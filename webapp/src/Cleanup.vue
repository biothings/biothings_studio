<template>
  <div class="ui basic cleanup modal">
    <div class="header">
      <i class="trash alternate outline icon"></i> Cleaning up old Hub entities
    </div>

    <div class="center">
      <div class="ui fluid container">

        <!-- Loader -->
        <div :class="['ui dimmer inverted', show_loader? 'active': '' ]">
          <div class="ui text loader">Loading</div>
        </div>

        <div class="ui centered fluid card">
          <div class="ui top attached pointing menu">
            <a class="active item" data-tab="snapshot">Snapshots</a>
          </div>
          <div class="ui bottom attached active tab segment snapshot-wrapper" data-tab="snapshot">
            <!-- Actions panel -->
            <div class="ui grid">
              <div class="row">
                <div class="three wide column">
                  <button class="ui button delete-snapshots" @click="delete_snapshots($event)"
                    data-content="You must choose at least one snapshot to delete">
                    <i></i> Delete
                  </button>
                </div>
                <div class="thirteen wide column">
                  <div class="ui grid">
                    <div class="column w-auto">
                        <select class="ui dropdown build_config_filter" v-model="build_config_filter" @change="loadData()">
                          <option value="">Build configuration filter</option>
                          <template v-for="name in build_configs">
                              <option :value="name" :key="name+'filter'">{{name}}</option>
                          </template>
                        </select>
                        <button class="ui red button white text" v-if="build_config_filter" @click="clearFilter('build_config')">
                            Clear
                        </button>
                    </div>
                    <div class="column w-auto">
                        <select class="ui dropdown build_filter" v-model="build_filter" @change="loadData()">
                            <option value="">Build filter</option>
                            <template v-for="name in build_names">
                                <option :value="name" :key="name+'filter'">{{name}}</option>
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
                                <option :value="env" :key="env+'filter'">{{env}}</option>
                            </template>
                        </select>
                        <button class="ui red button white text" v-if="env_filter" @click="clearFilter('env')">
                            Clear
                        </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="row ml-3 mb-3" v-if="snapshots_error" v-html="snapshots_error"></div>
            </div>

            <!-- Snapshots table -->
            <div class="table-responsive">
              <table class="ui celled table table-snapshots">
                <thead>
                  <tr>
                    <th class="w-1">
                      <div class="ui checkbox checkbox-popup" title="Select all snapshots">
                        <input type="checkbox" @click="toggleAllSnapshots($event)">
                        <label class="pl-0"></label>
                      </div>
                    </th>
                    <th>Name</th>
                    <th>Build Name</th>
                    <th>Environment</th>
                    <th>Indexer Env</th>
                    <th>Index Name</th>
                    <th class="min-width-9">Created At</th>
                  </tr>
                </thead>

                <tbody>
                  <template v-for="build_config_snapshots in snapshots" v-bind="snapshots">
                    <tr>
                      <td colspan="5">
                        <div class="ui checkbox checkbox-popup" title="Select all snapshots for this build config">
                          <input type="checkbox" @click="toggleAllSnapshots($event, build_config_snapshots._id)">
                          <label><strong>{{ build_config_snapshots._id }}</strong></label>
                        </div>
                      </td>
                    </tr>
                    
                    <tr v-for="snapshot_data in build_config_snapshots.items" v-bind="build_config_snapshots">
                      <td>
                        <div class="ui checkbox">
                          <input class="checkbox-snapshot" type="checkbox"
                            :data-build-config="build_config_snapshots._id"
                            :data-snapshot-name="snapshot_data._id"
                            :data-environment="snapshot_data.environment"
                          >
                          <label class="pl-0"></label>
                        </div>
                      </td>
                      <td>{{ snapshot_data._id }}</td>
                      <td>{{ snapshot_data.build_name }}</td>
                      <td>{{ snapshot_data.environment }}</td>
                      <td>{{ snapshot_data.indexer_env }}</td>
                      <td>{{ snapshot_data.index_name }}</td>
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
  </div>
</template>

<script>

import axios from 'axios'
import Actionable from './Actionable.vue'
import AsyncCommandLauncher from './AsyncCommandLauncher.vue'

export default {
  name: 'cleanup',
  mixins: [AsyncCommandLauncher, Actionable],
  mounted () {
    const self = this
    $(".cleanup.modal").modal("setting", {
      onShow: function () {
        self.loadData()
        $(".checkbox-popup").popup()
      }
    })
    $(".delete-snapshots").popup({
      on: "manual"
    })
  },
  data () {
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
    }
  },
  methods: {
    loading () {
      this.show_loader = true
      this.snapshots_error = null
    },
    loaded () {
      this.show_loader = false
    },
    extractError: function (err) {
      if (err.response) {
        return err.response.data.error
      }

      if (err.data) {
        return err.data.result.results.join("<br>")
      }
    },
    loaderror: function (title, err) {
      this.snapshots_error = `<div class="text red"><b>${title}</b><br>Detail: ${this.extractError(err)}</div>`
      this.loaded()
    },
    loadData () {
      const self = this
      self.loading()

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
        self.loaded()
      })
      .catch(err => {
        console.log('Error when getting snapshots information: ' + err)
        self.loaderror("Error when getting snapshots", err)
      })
    },
    clearFilter (filter_type) {
      $(`.ui.${filter_type}_filter.dropdown`).dropdown('clear')
      this[filter_type+ "_filter"] = ""
    },
    toggleAllSnapshots (event, build_config=null) {
      const is_checked = $(event.target).is(":checked")
      if (build_config) {
        $(`.snapshot-wrapper [type=checkbox][data-build-config=${build_config}]`).prop("checked", is_checked)
      }
      else {
        $(".snapshot-wrapper [type=checkbox]").prop("checked", is_checked)
      }
    },
    delete_snapshots (event) {
      const self = this
      const $checked_snapshots = $(".checkbox-snapshot:checked")
      if ($checked_snapshots.length == 0) {
        $(event.target).popup("show")
        return
      }

      self.loading()

      const cmd = function () {
        const data = {snapshots_data: {}}
        $checked_snapshots.map((_, element) => {
          const name = $(element).data("snapshotName")
          const environment = $(element).data("environment")
          if (! data.snapshots_data[environment]) {
            data.snapshots_data[environment] = []
          }
          data.snapshots_data[environment].push(name)
        })

        return axios.put(axios.defaults.baseURL + '/delete_snapshots', data)
      }

      const onSuccess = function (response) {
        self.loadData()
      }

      const onError = function (err) {
        self.loaderror("Error when deleting snapshots", err)
        console.error('Failed delete snapshots: ' + err)
      }

      this.launchAsyncCommand(cmd, onSuccess, onError)
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
  padding-left: 0!important;
}

[data-tab="snapshot"] {
  margin-bottom: 0!important;
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
</style>
