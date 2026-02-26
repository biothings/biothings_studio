<template>
  <div class="ui basic scrolling cleanup modal cleanup-container">
    <div class="header">
      <i class="trash alternate outline icon"></i> Cleaning up old Hub entities
    </div>

    <div class="content">
      <div class="ui fluid container">
        <!-- Loader -->
        <div :class="['ui dimmer inverted', show_loader ? 'active' : '']">
          <div class="ui text loader">Loading</div>
        </div>

        <div class="ui centered fluid card">
          <!-- Top Attached Menu -->
          <div class="ui top attached pointing menu">
            <a class="active item" data-tab="snapshot">Snapshots</a>
            <a class="item" data-tab="mongo-builds">Builds</a>
          </div>

          <!-- Tab Content -->
          <div class="ui bottom attached active tab segment snapshot-wrapper" data-tab="snapshot">
            <!-- Actions Panel -->
            <div class="ui grid">
              <div class="row">
                <div class="six wide column">
                  <div class="ui buttons">
                    <div class="ui labeled icon button delete-snapshots" data-tooltip="Delete selected snapshots"
                      v-on:click="delete_snapshots($event)">
                      <i class="trash icon"></i>Delete
                    </div>
                    <div class="ui floating dropdown icon button button-spacing">
                      <i class="dropdown icon"></i>
                      <div class="menu">
                        <div class="ui checkbox item"
                          data-tooltip="Delete will ignore errors related to the environment"
                          data-position="bottom center">
                          <input type="checkbox" v-model="ignoreErrors" />
                          <label>Ignore Env Errors</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button class="ui labeled icon button validate-snapshots" @click="validate_snapshots($event)"
                    data-tooltip="Confirm that the snapshots exist in the S3 bucket">
                    <i class="sync icon"></i>Validate
                  </button>
                  <button class="ui labeled icon button" @click="toggleAllSnapshots($event)"
                    data-tooltip="Select or deselect all snapshots">
                    <i class="check square icon"></i>Select All
                  </button>
                </div>
                <div class="ten wide column">
                  <div class="ui grid">
                    <div class="column w-auto">
                      <select class="ui dropdown build_config_filter" v-model="build_config_filter"
                        @change="loadData()">
                        <option value="">Build configuration filter</option>
                        <template v-for="name in build_configs">
                          <option :value="name" :key="name + 'filter'">{{ name }}</option>
                        </template>
                      </select>
                      <button class="ui red button white text" v-if="build_config_filter"
                        @click="clearFilter('build_config')">
                        Clear
                      </button>
                    </div>
                    <div class="column w-auto">
                      <select class="ui dropdown build_filter" v-model="build_filter" @change="loadData()">
                        <option value="">Build filter</option>
                        <template v-for="name in build_names">
                          <option :value="name" :key="name + 'filter'">{{ name }}</option>
                        </template>
                      </select>
                      <button class="ui red button white text" v-if="build_filter" @click="clearFilter('build')">
                        Clear
                      </button>
                    </div>
                    <div class="column w-auto">
                      <select class="ui dropdown env_filter" v-model="env_filter" @change="loadData()">
                        <option value="">Environment filter</option>
                        <template v-for="env in environments">
                          <option :value="env" :key="env + 'filter'">{{ env }}</option>
                        </template>
                      </select>
                      <button class="ui red button white text" v-if="env_filter" @click="clearFilter('env')">
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="row ml-3" v-if="show_snapshots_validated">
                <div class="ui message green">
                  <div class="header">Snapshots deleted</div>
                  <p>{{ snapshots_validated }} snapshots were removed during validation.</p>
                </div>
              </div>
              <div class="row ml-3 mb-3" v-if="snapshots_error">
                <div class="error-messages" v-html="snapshots_error"></div>
              </div>
            </div>

            <!-- Snapshots Table Container -->
            <div class="table-container">
              <template v-for="build_config_snapshots in snapshots">
                <div class="build-config-header" :key="'build-config-header-' + build_config_snapshots._id">
                  <div class="ui checkbox checkbox-popup" title="Select all snapshots for this build config">
                    <input type="checkbox" @change="toggleAllSnapshots($event, build_config_snapshots._id)">
                    <label>
                      <i class="folder icon"></i>
                      <strong>Build Config: {{ build_config_snapshots._id }}</strong>
                      <span class="build-config-count">&mdash; {{ build_config_snapshots.items.length }} snapshot{{
                        build_config_snapshots.items.length === 1 ? '' : 's' }}</span>
                    </label>
                  </div>
                </div>
                <table class="ui celled table table-snapshots"
                  :key="'build-config-table-' + build_config_snapshots._id">
                  <thead>
                    <tr>
                      <th class="w-1"></th>
                      <!-- Combined Name / Index Name column -->
                      <th>Name / Index Name</th>
                      <th>S3 Path</th>
                      <th>Environment</th>
                      <th>Indexer Env</th>
                      <th class="min-width-9">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="snapshot_data in build_config_snapshots.items" :key="'snapshot-' + snapshot_data._id">
                      <td>
                        <div class="ui checkbox">
                          <input class="checkbox-snapshot" type="checkbox"
                            :data-build-config="build_config_snapshots._id" :data-snapshot-name="snapshot_data._id"
                            :data-environment="snapshot_data.environment">
                          <label class="pl-0"></label>
                        </div>
                      </td>
                      <!-- Combined Name / Index Name -->
                      <td>{{ getCombinedName(snapshot_data) }}</td>
                      <!-- Hyperlinked S3 Path -->
                      <td>
                        <a :href="getS3Url(snapshot_data)" target="_blank">
                          {{ getBucketName(snapshot_data) }}
                        </a>
                      </td>
                      <td>{{ snapshot_data.environment }}</td>
                      <td>{{ snapshot_data.indexer_env || snapshot_data.conf.indexer.env }}</td>
                      <td class="min-width-9">{{ snapshot_data.created_at | moment('MMM Do YYYY, h:mm:ss a') }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </div>
          </div>

          <div class="ui bottom attached tab segment builds-wrapper" data-tab="mongo-builds">
            <div class="ui grid">
              <div class="row">
                <div class="six wide column">
                  <button class="ui labeled icon button delete-builds" data-tooltip="Delete selected MongoDB builds"
                    :class="{ disabled: show_build_confirm || is_deleting_builds }" @click="delete_builds($event)">
                    <i class="trash icon"></i>Delete
                  </button>
                  <button class="ui labeled icon button validate-builds" @click="validate_builds($event)"
                    :class="{ disabled: show_build_confirm || is_deleting_builds }"
                    data-tooltip="Remove build records whose target collections no longer exist">
                    <i class="sync icon"></i>Validate
                  </button>
                  <button class="ui labeled icon button" @click="toggleAllBuilds($event)"
                    :class="{ disabled: show_build_confirm || is_deleting_builds }"
                    data-tooltip="Select or deselect all builds">
                    <i class="check square icon"></i>Select All
                  </button>
                </div>
                <div class="ten wide column">
                  <div class="ui grid">
                    <div class="column w-auto">
                      <select class="ui dropdown mongo_build_config_filter" v-model="mongo_build_config_filter"
                        :disabled="show_build_confirm || is_deleting_builds" @change="loadBuildsData()">
                        <option value="">Build configuration filter</option>
                        <template v-for="name in mongo_build_configs">
                          <option :value="name" :key="name + 'mongo-build-config-filter'">{{ name }}</option>
                        </template>
                      </select>
                      <button class="ui red button white text" v-if="mongo_build_config_filter"
                        @click="clearBuildFilter('mongo_build_config')">
                        Clear
                      </button>
                    </div>
                    <div class="column w-auto">
                      <select class="ui dropdown mongo_build_filter" v-model="mongo_build_filter"
                        :disabled="show_build_confirm || is_deleting_builds" @change="loadBuildsData()">
                        <option value="">Build filter</option>
                        <template v-for="name in mongo_build_names">
                          <option :value="name" :key="name + 'mongo-build-filter'">{{ name }}</option>
                        </template>
                      </select>
                      <button class="ui red button white text" v-if="mongo_build_filter"
                        @click="clearBuildFilter('mongo_build')">
                        Clear
                      </button>
                    </div>
                    <div class="column w-auto">
                      <select class="ui dropdown mongo_year_filter" v-model="mongo_year_filter"
                        :disabled="show_build_confirm || is_deleting_builds" @change="loadBuildsData()">
                        <option value="">Year filter</option>
                        <template v-for="year in available_years">
                          <option :value="year" :key="year + 'mongo-year-filter'">{{ year }}</option>
                        </template>
                      </select>
                      <button class="ui red button white text" v-if="mongo_year_filter"
                        @click="clearBuildFilter('mongo_year')">
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Inline Confirmation Panel -->
              <div class="row ml-3 mb-3" v-if="show_build_confirm">
                <div class="ui warning message build-confirm-panel">
                  <div class="header">Confirm Deletion</div>
                  <p>The following {{ pending_build_delete_ids.length }} build(s) will be permanently deleted:</p>
                  <div class="ui relaxed list build-confirm-list">
                    <div class="item" v-for="name in pending_build_delete_ids" :key="'pending-delete-' + name">
                      <i class="database icon"></i>
                      <div class="content">{{ name }}</div>
                    </div>
                  </div>
                  <div class="build-confirm-actions">
                    <button class="ui button" @click="cancel_delete_builds()">Cancel</button>
                    <button class="ui red button white text" @click="confirmed_delete_builds()">
                      <i class="trash icon"></i>Delete {{ pending_build_delete_ids.length }} Build(s)
                    </button>
                  </div>
                </div>
              </div>

              <!-- Deleting Spinner -->
              <div class="row ml-3 mb-3" v-if="is_deleting_builds">
                <div class="ui icon message build-deleting-panel">
                  <i class="notched circle loading icon"></i>
                  <div class="content">
                    <div class="header">Deleting builds&hellip;</div>
                    <p>Please wait while {{ deleting_build_count }} build(s) are being removed.</p>
                  </div>
                </div>
              </div>

              <!-- Inline Success Message -->
              <div class="row ml-3 mb-3" v-if="show_build_success">
                <div class="ui success message visible build-success-panel">
                  <i class="close icon" @click="show_build_success = false"></i>
                  <div class="header">Deletion Complete</div>
                  <p>{{ last_deleted_build_count }} build(s) were successfully removed.</p>
                  <div class="ui relaxed list build-confirm-list" v-if="last_deleted_build_names.length">
                    <div class="item" v-for="name in last_deleted_build_names" :key="'deleted-build-' + name">
                      <i class="check circle outline icon green"></i>
                      <div class="content">{{ name }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Inline Validation Result -->
              <div class="row ml-3 mb-3" v-if="show_build_validated">
                <div class="ui message green build-success-panel">
                  <i class="close icon" @click="show_build_validated = false"></i>
                  <div class="header">Validation Complete</div>
                  <p>{{ builds_validated }} orphaned build record(s) were removed.</p>
                  <div class="ui relaxed list build-confirm-list" v-if="builds_validated_names.length">
                    <div class="item" v-for="name in builds_validated_names" :key="'validated-build-' + name">
                      <i class="check circle outline icon green"></i>
                      <div class="content">{{ name }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="row ml-3 mb-3" v-if="builds_error">
                <div class="error-messages" v-html="builds_error"></div>
              </div>
            </div>

            <div class="table-container">
              <template v-for="build_group in mongo_builds">
                <div class="build-config-header" :key="'mongo-build-group-header-' + build_group._id">
                  <div class="ui checkbox checkbox-popup" title="Select all builds for this build config">
                    <input type="checkbox" @change="toggleAllBuilds($event, build_group._id)">
                    <label>
                      <i class="folder icon"></i>
                      <strong>Build Config: {{ build_group._id }}</strong>
                      <span class="build-config-count">&mdash; {{ build_group.items.length }} build{{
                        build_group.items.length === 1 ? '' : 's' }}</span>
                    </label>
                  </div>
                </div>
                <table class="ui celled table table-builds" :key="'mongo-build-group-table-' + build_group._id">
                  <thead>
                    <tr>
                      <th class="w-1"></th>
                      <th>Build Name</th>
                      <th>Build Config</th>
                      <th>Archived</th>
                      <th class="min-width-9">Started At</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="build_data in build_group.items" :key="'mongo-build-' + build_data._id">
                      <td>
                        <div class="ui checkbox">
                          <input class="checkbox-build" type="checkbox" :data-build-config="build_group._id"
                            :data-build-id="build_data._id">
                          <label class="pl-0"></label>
                        </div>
                      </td>
                      <td>{{ build_data._id }}</td>
                      <td>{{ build_data.build_config && build_data.build_config._id ? build_data.build_config._id :
                        'N/A' }}</td>
                      <td>{{ build_data.archived ? 'Yes' : 'No' }}</td>
                      <td class="min-width-9">{{ build_data.started_at | moment('MMM Do YYYY, h:mm:ss a') }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal Actions -->
    <div class="actions">
      <div class="ui cancel button">Close</div>
    </div>


  </div>
</template>

<script>
import axios from 'axios'
import Actionable from './Actionable.vue'
import AsyncCommandLauncher from './AsyncCommandLauncher.vue'

export default {
  name: 'cleanup',
  mixins: [AsyncCommandLauncher, Actionable],
  mounted() {
    const self = this
    // Initialize the modal
    $(".cleanup.modal").modal({
      autofocus: false,
      observeChanges: true,
      onShow: function () {
        self.resetMessages();
        self.loadData();
        self.loadBuildsData();
      }
    });

    // Initialize tabs
    $('.menu .item').tab();

    // Initialize dropdowns
    $('.cleanup-container .ui.dropdown').dropdown();

    // Initialize popup for delete button
    $(".delete-snapshots").popup({
      on: "manual"
    });

    // Initialize checkboxes
    $('.ui.checkbox').checkbox();


  },
  data() {
    return {
      snapshots: [],
      build_configs: [],
      build_names: [],
      environments: [],
      build_config_filter: '',
      build_filter: '',
      env_filter: '',
      show_loader: false,
      snapshots_error: null,
      snapshots_validated: 0,
      show_snapshots_validated: false,
      ignoreErrors: false,
      mongo_builds: [],
      mongo_build_configs: [],
      mongo_build_names: [],
      mongo_build_config_filter: '',
      mongo_build_filter: '',
      mongo_year_filter: '',
      available_years: [],
      builds_error: null,
      pending_build_delete_ids: [],
      last_deleted_build_count: 0,
      last_deleted_build_names: [],
      show_build_confirm: false,
      show_build_success: false,
      show_build_validated: false,
      builds_validated: 0,
      builds_validated_names: [],
      is_deleting_builds: false,
      deleting_build_count: 0,
    }
  },
  methods: {
    loading() {
      this.show_loader = true
    },
    loaded() {
      this.show_loader = false
    },
    extractError: function (err) {
      if (typeof err === 'string') {
        return err;
      }

      if (err.response && err.response.data && err.response.data.error) {
        return err.response.data.error;
      }

      if (err.data && err.data.error) {
        return err.data.error;
      }

      if (err.data && err.data.result && err.data.result.results) {
        const results = err.data.result.results;
        if (Array.isArray(results) && results.length > 0) {
          const result = results[0];
          if (result.errors && result.errors.length > 0) {
            return result.errors.join('<br>');
          } else if (typeof result === 'string') {
            return result;
          }
        }
      }

      return "An unknown error occurred.";
    },
    loaderror: function (title, err) {
      const errorContent = this.extractError(err);
      this.snapshots_error = `<div class="text red"><b>${title}</b><br>${errorContent}</div>`;
      this.loaded();
    },
    loadBuildError: function (title, err) {
      const errorContent = this.extractError(err);
      this.builds_error = `<div class="text red"><b>${title}</b><br>${errorContent}</div>`;
      this.loaded();
    },
    loadData(preserveMessages = false) {
      const self = this;
      if (!preserveMessages) {
        self.resetMessages();
      }
      self.loading();

      $(".table-snapshots [type='checkbox']").prop("checked", false)

      // Loading snapshots
      const snapshot_filters = []
      if (self.build_config_filter) {
        snapshot_filters.push(`build_config=${self.build_config_filter}`)
      }
      if (self.build_filter) {
        snapshot_filters.push(`build_name=${self.build_filter}`)
      }
      if (self.env_filter) {
        snapshot_filters.push(`environment=${self.env_filter}`)
      }

      axios.get(axios.defaults.baseURL + '/list_snapshots?' + snapshot_filters.join("&"))
        .then(response => {
          self.snapshots = response.data.result

          self.build_configs = []
          self.build_names = new Set()
          self.environments = new Set()

          self.snapshots.forEach(build_configuration_snapshot => {
            self.build_configs.push(build_configuration_snapshot._id)
            build_configuration_snapshot.items.forEach(snapshot => {
              self.build_names.add(snapshot.build_name)
              self.environments.add(snapshot.environment)
            })
          })

          self.$nextTick(function () {
            // Re-initialize the checkboxes
            $('.ui.checkbox').checkbox();

            // Re-initialize the popups
            $(".checkbox-popup").popup({
              boundary: '.table-container',
              scrollContext: '.table-container',
            });
          });

          self.loaded()
        })
        .catch(err => {
          console.log('Error when getting snapshots information: ' + err)
          self.loaderror("Error when getting snapshots", err)
        })
    },
    clearFilter(filter_type) {
      $(`.ui.${filter_type}_filter.dropdown`).dropdown('clear')
      this[filter_type + "_filter"] = "";
      this.resetMessages();
      this.loadData();
    },
    clearBuildFilter(filter_type) {
      $(`.ui.${filter_type}_filter.dropdown`).dropdown('clear')
      this[filter_type + "_filter"] = "";
      this.resetMessages();
      this.loadBuildsData();
    },
    toggleAllSnapshots(event, build_config = null) {
      if (build_config) {
        const is_checked = event.target.checked;
        $(`.snapshot-wrapper [type=checkbox][data-build-config="${build_config}"]`).prop("checked", is_checked);
      } else {
        const $all = $(".snapshot-wrapper .checkbox-snapshot");
        const allChecked = $all.length > 0 && $all.filter(':checked').length === $all.length;
        $(".snapshot-wrapper [type=checkbox]").prop("checked", !allChecked);
      }
    },
    toggleAllBuilds(event, build_config = null) {
      if (build_config) {
        const is_checked = event.target.checked;
        $(`.builds-wrapper [type=checkbox][data-build-config="${build_config}"]`).prop("checked", is_checked);
      } else {
        const $all = $(".builds-wrapper .checkbox-build");
        const allChecked = $all.length > 0 && $all.filter(':checked').length === $all.length;
        $(".builds-wrapper [type=checkbox]").prop("checked", !allChecked);
      }
    },
    loadBuildsData(showLoader = true) {
      const self = this;
      if (showLoader) {
        self.loading();
      }

      $(".table-builds [type='checkbox']").prop("checked", false)

      const build_filters = []
      if (self.mongo_build_config_filter) {
        build_filters.push(`build_config=${self.mongo_build_config_filter}`)
      }
      if (self.mongo_build_filter) {
        build_filters.push(`build_name=${self.mongo_build_filter}`)
      }
      if (self.mongo_year_filter) {
        build_filters.push(`year=${self.mongo_year_filter}`)
      }

      axios.get(axios.defaults.baseURL + '/mongo_builds?' + build_filters.join("&"))
        .then(response => {
          self.mongo_builds = response.data.result

          self.mongo_build_configs = []
          self.mongo_build_names = new Set()
          const yearsSet = new Set()

          self.mongo_builds.forEach(build_group => {
            self.mongo_build_configs.push(build_group._id)
            build_group.items.forEach(build => {
              self.mongo_build_names.add(build._id)
              if (build.started_at) {
                const year = new Date(build.started_at).getFullYear()
                if (!isNaN(year)) {
                  yearsSet.add(year)
                }
              }
            })
          })

          self.available_years = Array.from(yearsSet).sort((a, b) => a - b)

          self.$nextTick(function () {
            $('.ui.checkbox').checkbox();
            $(".checkbox-popup").popup({
              boundary: '.table-container',
              scrollContext: '.table-container',
            });
          });

          if (showLoader) {
            self.loaded()
          }
        })
        .catch(err => {
          console.log('Error when getting mongo builds information: ' + err)
          self.loadBuildError("Error when getting mongo builds", err)
        })
    },
    delete_snapshots(event) {
      const self = this;
      this.resetMessages();
      const $checked_snapshots = $(".checkbox-snapshot:checked");
      if ($checked_snapshots.length == 0) {
        $(event.target).popup("show");
        return;
      }

      self.loading();

      const cmd = function () {
        const data = { snapshots_data: {}, ignoreErrors: self.ignoreErrors };
        $checked_snapshots.map((_, element) => {
          const name = $(element).data("snapshotName");
          let environment = $(element).data("environment");

          if (environment === undefined) {
            environment = "__no_env__";
          }

          if (!data.snapshots_data[environment]) {
            data.snapshots_data[environment] = [];
          }
          data.snapshots_data[environment].push(name);
        });

        return axios.put(axios.defaults.baseURL + '/delete_snapshots', data);
      };

      const onSuccess = function (response) {
        console.log('Snapshots deleted: ' + response.data.result);
        self.loadData();

        self.$nextTick(() => {
          $('.ui.checkbox').checkbox();
        });
      };

      const onError = function (err) {
        self.loaderror("Error when deleting snapshots", err);
        console.error('Failed delete snapshots: ' + err);
      };

      this.launchAsyncCommand(cmd, onSuccess, onError);
    },
    delete_builds() {
      const self = this;
      this.resetMessages();
      const $checked_builds = $(".checkbox-build:checked");
      if ($checked_builds.length == 0) {
        return;
      }

      const build_ids = [];
      $checked_builds.map((_, element) => {
        build_ids.push($(element).data("buildId"));
      });

      self.pending_build_delete_ids = build_ids;
      self.show_build_confirm = true;
      self.show_build_success = false;
    },
    cancel_delete_builds() {
      this.pending_build_delete_ids = [];
      this.show_build_confirm = false;
    },
    confirmed_delete_builds() {
      const self = this;
      const build_ids = [...self.pending_build_delete_ids];
      if (!build_ids.length) {
        return;
      }

      self.show_build_confirm = false;
      self.is_deleting_builds = true;
      self.deleting_build_count = build_ids.length;

      const cmd = function () {
        return axios.put(axios.defaults.baseURL + '/mongo_builds/delete', { build_ids });
      };

      const onSuccess = function (response) {
        const deletedCount = response?.data?.result?.results?.[0]?.deleted_count || 0;
        self.last_deleted_build_count = deletedCount;
        self.last_deleted_build_names = build_ids;
        self.pending_build_delete_ids = [];
        self.is_deleting_builds = false;
        self.show_build_success = true;

        self.loadBuildsData(false);

        self.$nextTick(() => {
          $('.ui.checkbox').checkbox();
        });
      };

      const onError = function (err) {
        self.pending_build_delete_ids = [];
        self.is_deleting_builds = false;
        self.loadBuildError("Error when deleting mongo builds", err);
        console.error('Failed deleting mongo builds: ' + err);
      };

      this.launchAsyncCommand(cmd, onSuccess, onError);
    },
    validate_builds() {
      const self = this;
      self.resetMessages();
      self.loading();

      const cmd = function () {
        return axios.post(axios.defaults.baseURL + '/mongo_builds/validate');
      };

      const onSuccess = function (response) {
        if (response.data.result) {
          self.handleBuildValidateResult(response.data.result);
        }
        self.loaded();
      };

      const onError = function (err) {
        self.loadBuildError("Error when validating builds", err);
        console.error('Failed to validate builds:', err);
        self.loaded();
      };

      this.launchAsyncCommand(cmd, onSuccess, onError);
    },
    handleBuildValidateResult(result) {
      const results = result.results ? result.results[0] : result;
      const removedCount = results.builds_removed || 0;
      const removedNames = results.builds_removed_names || [];
      this.builds_validated = removedCount;
      this.builds_validated_names = removedNames;
      this.show_build_validated = true;
      this.loadBuildsData(false);
      this.loaded();
    },
    // Returns the S3 bucket path (bucket + base_path)
    getBucketName(snapshot_data) {
      if (
        snapshot_data.conf &&
        snapshot_data.conf.repository &&
        snapshot_data.conf.repository.settings &&
        snapshot_data.conf.repository.settings.bucket
      ) {
        return snapshot_data.conf.repository.settings.bucket + '/' + snapshot_data.conf.repository.settings.base_path;
      }
      return '';
    },
    // Returns AWS URL based on the S3 bucket info.
    getS3Url(snapshot_data) {
      const settings = snapshot_data.conf?.repository?.settings;
      if (settings && settings.bucket && settings.region && settings.base_path) {
        const region = settings.region;
        const bucket = settings.bucket;
        const base_path = settings.base_path;
        return `https://${region}.console.aws.amazon.com/s3/buckets/${bucket}?region=${region}&bucketType=general&prefix=${base_path}/&showversions=false`;
      }
      return '#';
    },
    // Combines the snapshot name (_id) and the index_name.
    getCombinedName(snapshot_data) {
      const name = snapshot_data._id;
      const indexName = snapshot_data.index_name;
      if (!indexName || name === indexName) {
        return name;
      }
      return `${name} / ${indexName}`;
    },
    validate_snapshots(event) {
      const self = this;
      self.loading();

      const cmd = function () {
        return axios.post(axios.defaults.baseURL + '/validate_snapshots');
      };

      const onSuccess = function (response) {
        if (response.data.result) {
          self.handleValidateResult(response.data.result);
        } else {
          const cmd_id = response.data.result.id;
          self.running[cmd_id] = { cb: self.handleValidateResult, eb: self.handleValidateError };
        }
        self.loaded();
      };

      const onError = function (err) {
        self.loaderror("Error when validating snapshots", err);
        console.error('Failed to validate snapshots:', err);
        self.loaded();
      };

      this.launchAsyncCommand(cmd, onSuccess, onError);
    },
    extractAsyncError: function (err) {
      if (err.data && err.data.result && err.data.result.failed) {
        const results = err.data.result.results;
        if (Array.isArray(results) && results.length > 0) {
          const result = results[0];
          if (result.errors && result.errors.length > 0) {
            return result.errors.join('<br>');
          } else if (typeof result === 'string') {
            return result;
          }
        }
      }
      console.log("Can't extract async error, it's not an error");
      console.log(err);
      return "An unknown error occurred.";
    },
    launchAsyncCommand: function (cmd, callback, errback) {
      var self = this;
      self.loading();
      cmd()
        .then(response => {
          if (response.data.status !== 'ok') {
            throw new Error(`Couldn't launch async command ${cmd}`);
          }
          if (response.data.result.is_done) {
            callback(response);
          } else {
            const cmd_id = response.data.result.id;
            self.running[cmd_id] = { cb: callback, eb: errback };
          }
          self.loaded();
        })
        .catch(err => {
          errback(err);
          self.loaderror(err);
          self.loaded();
        });
    },
    handleValidateResult(result) {
      const results = result.results[0];
      const snapshotsDeleted = results.snapshots_validated || 0;
      this.snapshots_validated = snapshotsDeleted;
      this.show_snapshots_validated = true;
      if (results.errors && results.errors.length > 0) {
        const errorMessage = results.errors.join('<br>');
        this.snapshots_error = `<div class="text red"><b>Validation completed with errors</b><br>${errorMessage}</div>`;
      } else {
        this.snapshots_error = `<div class="text green"><b>Validation completed successfully</b><br>${snapshotsDeleted} snapshots were removed during validation.</div>`;
      }
      this.loadData(true);
      this.loaded();
    },
    handleValidateError(err) {
      const errorMsg = this.extractAsyncError(err);
      this.snapshots_error = `<div class="text red"><b>Validation failed</b><br>${errorMsg}</div>`;
      this.loaded();
    },
    resetMessages() {
      this.show_snapshots_validated = false;
      this.snapshots_error = null;
      this.builds_error = null;
      this.pending_build_delete_ids = [];
      this.show_build_confirm = false;
      this.show_build_success = false;
      this.show_build_validated = false;
      this.builds_validated = 0;
      this.builds_validated_names = [];
      this.is_deleting_builds = false;
    },
  }
}
</script>

<style>
.w-1 {
  width: 1rem;
}

.ml-3 {
  margin-left: 1rem;
}

.mr-2 {
  margin-right: 0.6rem;
}

.mb-3 {
  margin-bottom: 1rem;
}

.pl-0 {
  padding-left: 0 !important;
}

[data-tab="snapshot"],
[data-tab="mongo-builds"] {
  margin-bottom: 0 !important;
}

.table-responsive {
  overflow: auto;
}

.min-width-9 {
  min-width: 9rem;
}

.w-auto {
  width: auto !important;
}

.table-container {
  max-height: 60vh;
  overflow-y: auto;
  margin-top: 5px;
  position: relative;
}

.cleanup.modal {
  width: 90% !important;
}

.table-snapshots thead th,
.table-builds thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  border-top: 1px solid rgba(34, 36, 38, 0.1);
}

.error-messages {
  max-height: 150px;
  overflow-y: auto;
  padding: 10px;
  background-color: #fff6f6;
  border: 1px solid #e0b4b4;
  border-radius: 5px;
}

.button-spacing {
  margin-right: 10px !important;
}

.build-confirm-panel,
.build-success-panel,
.build-deleting-panel {
  width: 100%;
}

.build-confirm-list {
  max-height: 200px;
  overflow-y: auto;
  margin: 8px 0 !important;
}

.build-confirm-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.build-config-header {
  background-color: #f0f4f8;
  border-left: 3px solid #2185d0;
  padding: 10px 14px;
  margin-top: 12px;
  border-radius: 4px 4px 0 0;
}

.build-config-header:first-child {
  margin-top: 0;
}

.build-config-header label {
  font-size: 1.05em;
  color: #1a1a2e;
}

.build-config-header .folder.icon {
  color: #2185d0;
  margin-right: 4px;
}

.build-config-count {
  font-weight: normal;
  color: #666;
  font-size: 0.95em;
  margin-left: 2px;
}

.table-container .table-snapshots,
.table-container .table-builds {
  margin-top: 0 !important;
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}
</style>
