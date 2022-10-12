<template>
	<span>
		<h1 class="ui olive header">{{name}}</h1>
		<div class="ui secondary small compact menu">
			<a class="item" @click="refresh()">
				<i class="sync icon"></i>
				Refresh
			</a>
			<a class="item">
				<a :href="url">versions.json</a>
			</a>
		</div>
        <br>
        <br>
		<div class="ui grid">
      <div class="sixteen wide">
                <div class="ui tiny negative message" v-if="backend_error">
                    <div class="header">Unable to load backend information</div>
                    <p>{{backend_error}}</p>
                </div>
                <div class="item" v-else>
                    <div class="ui menu clearMenu">
                        <div class="item">
                          <div v-if="environments" class="content">
                            <h6 class="header m-0"><i class="server icon"></i> Target ES</h6>
                            <div class="ui mini selection dropdown text-capitalize" id="environments">
                              <input type="hidden" name="environment">
                              <i class="dropdown icon"></i>
                              <div class="default text"></div>
                              <div class="scrollhint menu">
                                <div class="item text-capitalize" v-for="environment in environments" :data-value="environment">
                                  {{ environment.replace("__", ": ") }}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div v-else>
                            <div>
                              <h6 class="header m-0"><i class="database icon"></i> ElasticSearch host</h6>
                              <a :href="backend.host"><small>{{backend.host}}</small></a>
                            </div>
                          </div>
                        </div>
                        <div class="item">
                            <div>
                              <h6 class="header m-0"><i class="bookmark icon"></i> Index</h6>
                              <small v-if="backend.index_alias">{{backend.index_alias}} ({{backend.index}})</small>
                              <small v-if="!backend.index_alias">{{backend.index}}</small>
                            </div>
                        </div>
                        <div class="item">
                            <div>
                              <h6 class="header m-0"><i class="thumbtack icon"></i> Version</h6>
                              <a v-if="backend && backend.version"><small>{{backend.version || "no version found"}}</small></a>
                            </div>
                        </div>
                        <div class="item">
                            <div>
                              <h6 class="header m-0"><i class="file alternate icon"></i> Documents</h6>
                              <small>{{ backend.count | formatNumeric(fmt="0,0") }}</small>
                            </div>
                        </div>
                        <div class="item">
                          <button class="ui mini circular inverted red button" @click="reset()" :class="actionable">Reset</button>
                        </div>
                    </div>

                </div>
            </div>
			<div class="sixteen wide column">
				<standalone-release-versions v-if="selected_environment"
          :key="selected_environment"
          v-bind:name="selected_environment"
          v-bind:backend="backend"
          v-bind:last_data="environments_data[selected_environment] || {}"
        ></standalone-release-versions>
			</div>
		</div>

        <div :class="['ui basic reset modal',encoded_name]">
                <h2 class="ui icon">
                    <i class="info circle icon"></i>
                    Reset backend
                </h2>
                <div class="content">
                    <p>Are you sure you want to reset the backend and delete the index.</p>
                    <div class="ui tiny warning message">
                        This operation is <b>not</b> reversible, all data on the index will be lost.
                    </div>
                </div>
                <div class="actions">
                    <div class="ui red basic cancel inverted button">
                        <i class="remove icon"></i>
                        No
                    </div>
                    <div class="ui green ok inverted button">
                        <i class="checkmark icon"></i>
                        Yes
                    </div>
                </div>
        </div>

	</span>
</template>

<script>
import axios from 'axios'
import Loader from './Loader.vue'
import Actionable from './Actionable.vue'
import AsyncCommandLauncher from './AsyncCommandLauncher.vue'
import StandaloneReleaseVersions from './StandaloneReleaseVersions.vue'
import bus from './bus.js'

export default {
  name: 'standalone-release',
  props: ['name', 'url', 'environments', 'last_data'],
  mixins: [AsyncCommandLauncher, Loader, Actionable],
  mounted () {
    bus.$on('store_environment_data', this.store_environment_data)

    this.environments_data = this.last_data

    const self = this
    if ($('#environments').length > 0) {
      self.selected_environment = $('#environments .item:first-child').data("value")
      $('#environments')
        .dropdown({
          action: 'activate',
          onChange: function(value, text, $selectedItem) {
            self.selected_environment = value
            self.refresh()
          }
        })
        .dropdown("set selected", self.selected_environment, null, true)
    }
    else {
      self.selected_environment = self.name
    }

    self.refresh()
  },
  beforeDestroy () {
    bus.$emit(
      'store_source_environments_data',
      {
        source_name: this.name,
        data: this.environments_data
      }
    )
  },
  data () {
    return {
      backend: {},
      backend_error: null,
      selected_environment: '',
      environments_data: {}
    }
  },
  computed: {
    encoded_name: function () {
      return btoa(this.selected_environment).replace(/=/g, '_')
    },
  },
  components: { StandaloneReleaseVersions },
  methods: {
    store_environment_data: function(environment_data) {
      const name = environment_data.name
      this.environments_data[name] = environment_data.data
    },
    refresh: function () {
      this.refreshBackend()
      bus.$emit('refresh_standalone', this.selected_environment)
    },
    refreshBackend: function () {
      var self = this
      self.backend_error = null
      var cmd = function () { self.loading(); return axios.get(axios.defaults.baseURL + `/standalone/${self.selected_environment}/backend`) }
      // results[0]: async command can produce multiple results (cmd1() && cmd2), but here we know we'll have only one
      var onSuccess = function (response) {
        self.backend = response.data.result.results[0] 
      }
      var onError = function (err) { console.log(err); self.loaderror(err); self.backend_error = self.extractAsyncError(err) }
      this.launchAsyncCommand(cmd, onSuccess, onError)
    },
    resetBackend: function () {
      var self = this
      self.backend_error = null
      var cmd = function () { self.loading(); return axios.delete(axios.defaults.baseURL + `/standalone/${self.selected_environment}/backend`) }
      // results[0]: async command can produce multiple results (cmd1() && cmd2), but here we know we'll have only one
      var onSuccess = function (response) { self.refreshBackend() }
      var onError = function (err) { console.log(err); self.loaderror(err); self.backend_error = self.extractAsyncError(err) }
      this.launchAsyncCommand(cmd, onSuccess, onError)
    },
    reset: function () {
      var self = this
      $(`.ui.basic.reset.modal.${this.encoded_name}`)
        .modal('setting', {
          onApprove: function () {
            self.resetBackend()
          }
        })
        .modal('show')
    }

  }
}
</script>

<style scoped>
.ui.sidebar {
    overflow: visible !important;
}
.srctab {
	border-color:rgb(212, 212, 213) !important;
	border-style:solid !important;
	border-width:1px !important;
	border-radius: 0px !important;
}

.text-capitalize,
.ui.menu .ui.dropdown .menu>.item.text-capitalize {
  text-transform: capitalize !important;
}
</style>
