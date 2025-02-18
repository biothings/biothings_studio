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
          </div>

          <!-- Tab Content -->
          <div class="ui bottom attached active tab segment snapshot-wrapper" data-tab="snapshot">
            <!-- Actions Panel -->
            <div class="ui grid">
              <div class="row">
                <div class="five wide column">
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
              <table class="ui celled table table-snapshots">
                <thead>
                  <tr>
                    <th class="w-1">
                      <div class="ui checkbox checkbox-popup" title="Select all snapshots">
                        <input type="checkbox" @change="toggleAllSnapshots($event)">
                        <label class="pl-0"></label>
                      </div>
                    </th>
                    <!-- Combined Name / Index Name column -->
                    <th>Name / Index Name</th>
                    <th>S3 Path</th>
                    <th>Environment</th>
                    <th>Indexer Env</th>
                    <th class="min-width-9">Created At</th>
                  </tr>
                </thead>

                <tbody>
                  <template v-for="build_config_snapshots in snapshots">
                    <tr :key="'build-config-' + build_config_snapshots._id">
                      <td colspan="5">
                        <div class="ui checkbox checkbox-popup" title="Select all snapshots for this build config">
                          <input type="checkbox" @click="toggleAllSnapshots($event, build_config_snapshots._id)">
                          <label><strong>{{ build_config_snapshots._id }}</strong></label>
                        </div>
                      </td>
                    </tr>

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
                  </template>
                </tbody>
              </table>
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
    },
    toggleAllSnapshots(event, build_config = null) {
      const is_checked = event.target.checked;
      if (build_config) {
        $(`.snapshot-wrapper [type=checkbox][data-build-config=${build_config}]`).prop("checked", is_checked);
      } else {
        $(".snapshot-wrapper [type=checkbox]").prop("checked", is_checked);
      }
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
            const result = response.data.result.results[0];
            callback(result);
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

[data-tab="snapshot"] {
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

.table-snapshots thead th {
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
</style>
