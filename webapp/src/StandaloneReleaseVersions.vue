<template>
    <span>
      <div v-if="versions.length || error">
            <div class="ui tiny negative message" v-if="error">
                <div class="header">Encountered an error:</div>
                <p>{{error}}</p>
            </div>
            <table class="ui compact versions table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Release date</th>
                  <th>Type</th>
                  <th>Requires</th>
                  <th v-if="!readonly">Action</th>
                </tr>
              </thead>
            </table>
        </div>
        <div v-if="versions.length || error" class="releases-cont">
            <!-- <div class="ui tiny negative message" v-if="error">
                <div class="header">Encountered an error:</div>
                <p>{{error}}</p>
            </div> -->
            <table class="ui compact versions table">
              <thead style="display:none;">
                <tr>
                  <th>Version</th>
                  <th>Release date</th>
                  <th>Type</th>
                  <th>Requires</th>
                  <th v-if="!readonly">Action</th>
                </tr>
              </thead>
              <tbody v-if="versions && versions.length">
                <tr v-for="version in versions" :class="[getVersionClass(version)]" :key="version.release_date">
                  <td>{{version.build_version}}</td>
                  <td>{{ moment(version.release_date).format('MMMM Do YYYY, h:mm:ss a')}}</td>
                  <td><i :class="['ui ', version.type == 'full' ? 'blue bookmark' : 'orange exchange alternate','icon']"></i>{{version.type}}</td>
                  <td>{{version.require_version || "-"}}</td>
                  <td v-if="!readonly">
                      <div class="ui tiny compact menu">
                          <a class="item" @click="info(version)">
                              <div :class="['hide info loader', cssName(version.build_version)]">
                                  <div class="ui active inverted dimmer">
                                      <div class="ui small loader"></div>
                                  </div>
                              </div>
                              <div>
                                  <!-- <i class="info circle icon"></i> -->
                                  Info
                              </div>
                          </a>
                          <a class="disabled item" v-if="installing && installing == version.build_version">
                              <i>Installing</i>
                          </a>
                          <a class="item" @click="install(version)" v-else-if="!installing">
                              <div :class="['hide install loader', cssName(version.build_version)]">
                                  <div class="ui active inverted dimmer">
                                      <div class="ui small loader"></div>
                                  </div>
                              </div>
                              <div>
                                  <!-- <i class="download icon"></i> -->
                                  Install
                              </div>
                          </a>
                      </div>
                  </td>
                </tr>
              </tbody>
            </table>

        </div>
        <div v-else>
                <br><br>
            <div class="ui active inverted dimmer">
                <div class="ui text loader"></div>
            </div>
        </div>

        <div :class="['ui basic version modal', cssName(name)]">
            <standalone-release-info v-bind:selected_version="selected_version"></standalone-release-info>
        </div>

        <div :class="['ui basic install modal', cssName(name)]">
                <h2 class="ui icon">
                    <i class="info circle icon"></i>
                    Data release installation
                </h2>
                <div class="content" v-if="selected_version">
                    <p>Current installed version is <b>{{ backend.version || "... no version found"}}</b></p>
                    <p>Are you sure you want to install data release <b>{{selected_version.build_version || '???' }}</b> ?
                      <span v-if="!install_path.length">
                          <span v-if="selected_version.type == 'incremental'">
                              <br>It is compatible with current version and can directly be installed on top it.
                          </span>
                          <span v-else>
                            <br>This release will replace existing data.
                          </span>
                      </span>
                      <span v-if="install_path.length">
                          <br>In order to install this data release, the following releases will first be installed:
                          <div class="ui ordered inverted list">
                              <div class="item" v-for="ver in install_path" :key="ver+'v'">Release: <b>{{ ver }}</b></div>
                          </div>
                      </span>
                    </p>
                    <div v-if="selected_version.type == 'full' " class="ui checkbox">
                      <div class="ui toggle checkbox">
                        <input
                            type="checkbox"
                            id="full_install_use_no_downtime_method"
                            name="full_install_use_no_downtime_method"
                            :checked="full_install_use_no_downtime_method ? 'checked' : false"
                            @change="toggleFullInstallUseNoDowntimeMethod($event)">
                        <label class="white">Use no downtime method?</label>
                      </div>

                      <div class="ui accordion">
                        <div class="title white">
                          <i class="dropdown icon"></i>
                          Don't know which full install method should use? 
                        </div>
                        <div class="content">
                          <p>In order to do full install, there are 2 available methods:</p>
                          <div class="ui bulleted list full-install-description">
                            <div class="item">
                              Use no downtime method: performing a index restoration to a different index name and then switching the alias when it's done. This has no downtime, and is the default method.
                            </div>
                            <div class="item">
                              Use downtime method: deleting the old index and then install the new index. This causes downtime, should be used as a fallback method.
                            </div>
                          </div>
                        </div>
                      </div>
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
import bus from './bus.js'
import axios from 'axios'
import Loader from './Loader.vue'
import Actionable from './Actionable.vue'
import AsyncCommandLauncher from './AsyncCommandLauncher.vue'
import StandaloneReleaseInfo from './StandaloneReleaseInfo.vue'

export default {
  name: 'standalone-release-versions',
  props: ['name', 'backend', 'last_data'],
  mixins: [AsyncCommandLauncher, Loader, Actionable],
  mounted () {
    this.refreshVersions()

    this.selected_version = this.last_data.selected_version
    this.error = this.last_data.error
    this.installing = this.last_data.installing

    $(`.ui.basic.version.modal.${this.cssName(this.name)}:not(:first)`).remove()
    $(`.ui.basic.install.modal.${this.cssName(this.name)}:not(:first)`).remove()
  },
  created () {
    bus.$on('refresh_standalone', this.onRefresh)
  },
  beforeDestroy () {
    bus.$off('refresh_standalone', this.onRefresh)
    bus.$emit(
      'store_environment_data',
      {
        name: this.name,
        data: {
          selected_version: this.selected_version,
          error: this.error,
          installing: this.installing,
        }
      }
    )
  },
  data () {
    return {
      error: null,
      versions: [],
      // fetching info
      selected_version: null, // selected version from the table
      full_install_use_no_downtime_method: true,
      info_error: null,
      installing: null,
      install_path: []
    }
  },
  components: { StandaloneReleaseInfo },
  methods: {
    cssName: function (what) {
      return what.replace('.', '_')
    },
    onRefresh: function (name) {
      if (name == this.name) {
        this.versions = []
        this.refreshVersions()
      }
    },
    toggleFullInstallUseNoDowntimeMethod: function(event) {
      this.full_install_use_no_downtime_method = !this.full_install_use_no_downtime_method
    },
    getVersionClass: function (version) {
      if (this.backend.version == version.target_version) {
        return 'current'
      } else if (this.backend.version > version.target_version) {
        return 'old'
      } else {
        return 'notcurrent'
      }
    },
    refreshVersions: function () {
      var self = this
      self.error = null
      var cmd = function () {
        self.loading()
        return axios.get(axios.defaults.baseURL + `/standalone/${self.name}/versions`)
      }
      // results[0]: async command can produce multiple results (cmd1() && cmd2), but here we know we'll have only one
      var onSuccess = function (response) {
        self.versions = response.data.result.results[0].reverse()
      }
      var onError = function (err) {
        console.log('error getting versions')
        console.log(err)
        self.loaderror(err)
        self.error = "Can't load versions: " + self.extractAsyncError(err)
      }
      this.launchAsyncCommand(cmd, onSuccess, onError)
    },
    infoLoader: function (version, loading) {
      var build_version = this.cssName(version.build_version)
      if (loading) {
        $(`.loader.info.${build_version}`).show()
      } else {
        $(`.loader.info.${build_version}`).hide()
      }
    },
    installLoader: function (version, loading) {
      var build_version = this.cssName(version.build_version)
      if (loading) {
        $(`.loader.install.${build_version}`).show()
      } else {
        $(`.loader.install.${build_version}`).hide()
      }
    },
    info: function (version) {
      var self = this
      self.selected_version = null // reset
      self.error = null
      var cmd = function () {
        self.infoLoader(version, true)
        self.loading()
        return axios.get(axios.defaults.baseURL + `/standalone/${self.name}/info?version=${version.build_version}`)
      }
      // results[0]: async command can produce multiple results (cmd1() && cmd2), but here we know we'll have only one
      var onSuccess = function (response) {
        self.infoLoader(version, false)
        self.selected_version = response.data.result.results[0]
        $(`.ui.basic.version.modal.${self.cssName(self.name)}`)
          .modal('setting', {
            detachable: false,
            closable: false
          })
          .modal('show')
      }
      var onError = function (err) {
        self.infoLoader(version, false)
        self.loaderror(err)
        self.error = self.extractAsyncError(err)
      }
      this.launchAsyncCommand(cmd, onSuccess, onError)
    },
    adjustInstallPath: function (path) {
      var idx = path.indexOf(this.selected_version.build_version)
      if (idx > -1) {
        path.splice(idx, 1)
      }
      return path
    },
    install: function (version) {
      var self = this
      self.selected_version = version
      self.install_path = []
      self.error = null
      var cmd = function () {
        // we force install, ie. force download of required files each time,
        // just to make we trigger install from beginning (when failing, we could
        // stop and need apply() command from the console, to apply diff updates
        // from files locally stored. Hub will not installed them again other than
        // with using apply() or re-downloading them. We stay on the safe (and easy,
        // I confess) side.
        var data = {
          version: version.build_version,
          force: 1,
          use_no_downtime_method: self.full_install_use_no_downtime_method
        }
        return axios.post(axios.defaults.baseURL + `/standalone/${self.name}/install`, data)
      }
      var onSuccess = function (response) {
        self.installing = null
        self.installLoader(version, true)
        self.$parent.refresh()
      }
      var onError = function (err) {
        self.installing = null
        self.error = 'Installation error: ' + self.extractAsyncError(err)
      }

      self.launchAsyncCommand(function () {
        self.installLoader(version, true)
        return axios.post(axios.defaults.baseURL + `/standalone/${self.name}/install`, { version: version.build_version, dry: true })
      },
      function (response) {
        self.installLoader(version, false)
        var path = response.data.result.results[0]
        if (path) {
          // if hub returned a list of versions to apply before, adjust it
          // (ie. remove current one for display purpose)
          self.install_path = self.adjustInstallPath(response.data.result.results[0])
        }
        $(`.ui.basic.install.modal.${self.cssName(self.name)} .ui.accordion`).accordion();
        $(`.ui.basic.install.modal.${self.cssName(self.name)}`)
          .modal('setting', {
            onApprove: function () {
              self.installing = version.build_version
              self.launchAsyncCommand(cmd, onSuccess, onError)
            }
          })
          .modal('show')
      },
      function (err) {
        self.installLoader(version, false)
        self.error = self.extractAsyncError(err)
      })
    }
  }
}
</script>

<style scoped>
.hide {
    display: none;
}
.current {
    background-color: #e1f790 !important;
}
.old {
    background-color: #ebeaea !important;
}
.releases-cont{
    max-height: 1000px;
    overflow: scroll;
}
#full_install_use_no_downtime_method~label {
  color: white !important;
}
.full-install-description {
  margin-left: 3rem !important;
}
</style>
