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
                            <div>
                              <h6 class="header m-0"><i class="database icon"></i> ElasticSearch host</h6>
                              <a :href="backend.host"><small>{{backend.host}}</small></a>
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
				<standalone-release-versions v-bind:name="name" v-bind:backend="backend"></standalone-release-versions>
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
  props: ['name', 'url'],
  mixins: [AsyncCommandLauncher, Loader, Actionable],
  mounted () {
    this.refresh()
  },
  data () {
    return {
      backend: {},
      backend_error: null
    }
  },
  computed: {
    encoded_name: function () {
      return btoa(this.name).replace(/=/g, '_')
    }
  },
  components: { StandaloneReleaseVersions },
  methods: {
    refresh: function () {
      this.refreshBackend()
      bus.$emit('refresh_standalone', this.name)
    },
    refreshBackend: function () {
      var self = this
      self.backend_error = null
      var cmd = function () { self.loading(); return axios.get(axios.defaults.baseURL + `/standalone/${self.name}/backend`) }
      // results[0]: async command can produce multiple results (cmd1() && cmd2), but here we know we'll have only one
      var onSuccess = function (response) { self.backend = response.data.result.results[0] }
      var onError = function (err) { console.log(err); self.loaderror(err); self.backend_error = self.extractAsyncError(err) }
      this.launchAsyncCommand(cmd, onSuccess, onError)
    },
    resetBackend: function () {
      var self = this
      self.backend_error = null
      var cmd = function () { self.loading(); return axios.delete(axios.defaults.baseURL + `/standalone/${self.name}/backend`) }
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
</style>
