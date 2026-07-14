<template>
    <div>
        <div v-if="error" class="ui error message">
            {{error}}
        </div>
        <div class="release-toolbar" :class="actionable">
            <button type="button" class="ui small grey newrelease button" @click="newRelease">
                New release
            </button>
        </div>
        <div class="ui feed"  v-if="releases">
            <div class="event" v-for="rel in releases" :key="rel.index_name">
                <!-- also pass main build object so we can access other related information to that release, such as release notes -->
                <index-release-event v-if="rel.index_name" :release="rel" :build="build" :type="'full'"></index-release-event>
                <diff-release-event v-if="rel.diff" :release="rel" :index_envs="index_envs" :build="build" :type="'incremental'"></diff-release-event>
            </div>
        </div>
        <div v-else>
            No release found
        </div>

        <!-- create new release -->
        <div class="ui basic newrelease modal">
            <h3 class="ui icon">
                <i class="tag icon"></i>
                Create new release
            </h3>
            <div class="content">
                <div class="ui form">
                    <div class="ui centered grid">
                        <div class="eight wide column">

                            <label>Select the type of release</label>
                            <div>
                                <select class="ui releasetype dropdown" name="release_type" v-model="release_type">
                                    <option>incremental</option>
                                    <option>full</option>
                                </select>
                                <br>
                                <br>
                            </div>

                            <span v-if="release_type == 'incremental'">
                                <label>Select a build to compute incremental release (compared to this one)</label>
                                <div>
                                    <select class="ui fluid availbuilds dropdown" name="old_build" v-if="avail_builds.length">
                                        <option v-for="b in avail_builds" :key="b">{{b}}</option>
                                    </select>
                                    <div class="ui red message" v-else>
                                        No build available to compute incremental data release
                                    </div>
                                    <br>
                                </div>
                                <div>
                                    <label>Select the type of diff files to generate</label>
                                    <select class="ui fluid difftypes dropdown" name="diff_type">
                                        <option v-for="dtyp in diff_types" :key="dtyp" :selected="dtyp == 'jsondiff-selfcontained'">{{dtyp}}</option>
                                    </select>
                                    <br>
                                </div>
                                <div class="ui checkbox">
                                    <input type="checkbox" name="diff_purge"><label>Purge existing diff files previously generated for this release ?</label>
                                </div>
                            </span>
                            <span v-if="release_type == 'full'">
                                <div>
                                    <label>Index name</label>
                                    <input class="derived-index-name" type="text" name="index_name" placeholder="Index name" :value="derived_index_name" readonly>
                                    <br>
                                    <br>
                                </div>
                                <div>
                                    <label>Select an indexer environment to create the index on</label>
                                    <select class="ui fluid indexenvs dropdown" name="index_env" v-model="selected_index_env" @change="onIndexEnvChange">
                                        <option v-for="(info,env) in index_envs.env" :key="env" :value="env" :data-env="env">{{env}} <i>({{info.host}})</i></option>
                                    </select>
                                    <br>
                                </div>
                                <div class="index-mode-panel" v-if="matching_index">
                                    <label>Existing index found</label>
                                    <div class="ui compact two buttons index-mode-buttons">
                                        <button type="button"
                                                :class="['ui', selected_index_mode == 'resume' ? 'teal' : 'basic teal', 'button']"
                                                data-tooltip="Indexes only missing documents. Best for partial failed runs."
                                                data-position="bottom center"
                                                @click.prevent="selectIndexMode('resume')">
                                            Resume existing index
                                        </button>
                                        <button type="button"
                                                :class="['ui', selected_index_mode == 'purge' ? 'red' : 'basic red', 'button']"
                                                data-tooltip="Deletes the old index first. Best for a clean rebuild."
                                                data-position="bottom center"
                                                @click.prevent="selectIndexMode('purge')">
                                            Purge and reindex
                                        </button>
                                    </div>
                                </div>
                            </span>

                        </div>

                        <div class="eight wide column">

                            <div class="ui teal message">
                                <b>Note</b>: sources providing root documents, or <i>root sources</i>, are sources allowed to
                                create a new document in a build (merged data). If a root source is declared, data from other sources will only be merged <b>if</b>
                                documents previously exist with same IDs (documents coming from root sources). If not, data is discarded. Finally, if no root source
                                is declared, any data sources can generate a new document in the merged data.
                            </div>

                            <div class="ui message index-mode-help" v-if="release_type == 'full' && matching_index">
                                <b>Existing index options</b>
                                <div class="ui relaxed list">
                                    <div class="item">
                                        <b>Resume</b> keeps the existing index and indexes only missing documents. Choose it when a previous index job failed or stopped partway through.
                                    </div>
                                    <div class="item">
                                        <b>Purge and reindex</b> deletes the existing index first, then builds it from scratch. Choose it when the current index is stale, bad, corrupt, or you want a clean rebuild.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="ui error message" v-if="errors.length">
                <ul class="ui list">
                    <li v-for="(err, i) in errors" :key="err+i">{{err}}</li>
                </ul>
            </div>

            <div class="actions">
                <div class="ui red basic cancel inverted button">
                    <i class="remove icon"></i>
                    Cancel
                </div>
                <div class="ui green ok inverted button" id="newrelease_ok" :class="actionable">
                    <i class="checkmark icon"></i>
                    OK
                </div>
            </div>
        </div>

        <div class="stageLogs">
          <div class="flex justify-center">
              <button class="ui button mini circular" :class="[showLogs?'black':'blue']" @click="toggleLogViewers(!showLogs)">
                  {{showLogs ? 'Close' : 'View Logs'}}
              </button>
              <button v-if="showLogs" class="ui icon button mini circular" @click="reloadLogs">
                  <i class="redo icon"></i>
              </button>
          </div>
          <div class="ui top attached pointing menu" :class="[showLogs? '' : 'hidden']">
            <h5 class="">Stages:</h5>
            <a v-for="stage in logStages" v-bind:key="stage.name" :data-tab="stage.name" @click="toggleLogViewers(true, stage.name)" class="item">{{ stage.name.toUpperCase() }}</a>
          </div>

          <div v-for="stage in logStages" v-bind:key="stage.name" :data-tab="stage.name" :class="'ui bottom attached tab segment ' + stage.name + 'Logs'">
            <LogViewer :type="stage.type"
              :item="build"
              :key="stage.name + 'Logs'"
              :ref="stage.name + 'Logs'"
              :showViewLogButton="false">
            </LogViewer>
          </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios'
import IndexReleaseEvent from './IndexReleaseEvent.vue'
import DiffReleaseEvent from './DiffReleaseEvent.vue'
import Actionable from './Actionable.vue'
import LogViewer from './components/LogViewer.vue'

export default {
  name: 'build-releases',
  props: ['build'],
  mixins: [Actionable],
  mounted () {
    $('.ui.releasetype.dropdown').dropdown()
  },
  created () {
    this.loadData()
  },
  beforeDestroy () {
    $('.ui.basic.newrelease.modal').remove()
  },
  components: {
    IndexReleaseEvent,
    DiffReleaseEvent,
    LogViewer,
  },
  data () {
    return {
      errors: [],
      release_type: null,
      diff_types: [],
      avail_builds: [],
      index_envs: [],
      selected_index_env: null,
      selected_index_mode: 'index',
      matching_index: null,
      index_lookup_id: null,
      logStages: [
        {name: "index", type: "index"},
        {name: "diff", type: "diff"},
        {name: "releaseNote", type: "releasemanager"},
        {name: "sync", type: "sync"},
        {name: "snapshot", type: "snapshot"},
        {name: "publish", type: "releaser"},
      ],
      showLogs: false,
    }
  },
  computed: {
    releases: function () {
      // sort index and diff releases by dates
      var _releases = []
      if (this.build.index) {
        for (var [key, value] of Object.entries(this.build.index))
          value.index_name = key
        _releases = _releases.concat(Object.values(this.build.index))
      }
      if (this.build.diff) { _releases = _releases.concat(Object.values(this.build.diff)) }
      _releases.sort(function (a, b) {
        var da = a.created_at && Date.parse(a.created_at)
        var db = b.created_at && Date.parse(b.created_at)
        return db - da
      })
      //console.log(_releases)
      return _releases
    },
    error: function () {
      var last = this.build.jobs[this.build.jobs.length - 1]
      if (last && last.err) { return last.err }
    },
    derived_index_name: function () {
      return this.build && (this.build._id || this.build.target_name) || ''
    }
  },
  watch: {
    release_type: function () {
      if (this.release_type == 'full') {
        this.ensureSelectedIndexEnv()
        this.$nextTick(this.checkIndexExists)
      } else {
        this.resetIndexMode()
      }
    },
    selected_index_env: function () {
      this.checkIndexExists()
    },
    derived_index_name: function () {
      this.checkIndexExists()
    }
  },
  methods: {
    displayError: function () {
    },
    ensureSelectedIndexEnv: function () {
      var envs = this.index_envs && this.index_envs.env ? Object.keys(this.index_envs.env) : []
      if (!this.selected_index_env && envs.length) {
        this.selected_index_env = envs[0]
      }
    },
    getSelectedIndexEnv: function () {
      return this.selected_index_env || $('.ui.form select[name=index_env]').val() || $('.ui.form select[name=index_env] :selected').attr('data-env')
    },
    resetIndexMode: function () {
      this.matching_index = null
      this.selected_index_mode = 'index'
      this.index_lookup_id = null
    },
    selectIndexMode: function (mode) {
      this.selected_index_mode = mode
    },
    onIndexEnvChange: function (event) {
      this.selected_index_env = event.target.value
    },
    refreshNewReleaseModal: function () {
      this.$nextTick(function () {
        $('.ui.basic.newrelease.modal').modal('refresh')
      })
    },
    checkIndexExists: function () {
      if (this.release_type != 'full') {
        return
      }

      var index_name = this.derived_index_name
      var index_env = this.getSelectedIndexEnv()
      if (!index_name || !index_env) {
        this.resetIndexMode()
        return
      }

      var lookup_id = `${index_name}:${index_env}:${Date.now()}`
      this.index_lookup_id = lookup_id
      var params = new URLSearchParams()
      params.set('index_name', index_name)
      params.set('env_name', index_env)
      params.set('limit', '1')

      axios.get(axios.defaults.baseURL + `/indexes_by_name?${params.toString()}`)
        .then(response => {
          if (this.index_lookup_id != lookup_id) {
            return
          }
          var indexes = response.data && response.data.result ? response.data.result : []
          var matching_index = indexes.find(index => {
            return index.index_name == index_name &&
              (!index.environment || !index.environment.name || index.environment.name == index_env)
          })
          this.matching_index = matching_index || null
          if (this.matching_index) {
            if (this.selected_index_mode != 'resume' && this.selected_index_mode != 'purge') {
              this.selected_index_mode = 'resume'
            }
          } else {
            this.selected_index_mode = 'index'
          }
          this.refreshNewReleaseModal()
        })
        .catch(err => {
          if (this.index_lookup_id != lookup_id) {
            return
          }
          console.log(err)
          this.resetIndexMode()
          this.refreshNewReleaseModal()
        })
    },
    getIndexModeForSubmit: function () {
      if (this.matching_index && (this.selected_index_mode == 'resume' || this.selected_index_mode == 'purge')) {
        return this.selected_index_mode
      }
      return 'index'
    },
    newFullRelease: function () {
      var index_name = null
      var index_env = this.getSelectedIndexEnv()
      var mode = this.getIndexModeForSubmit()
      axios.put(axios.defaults.baseURL + '/index', {
          indexer_env: index_env,
          build_name: this.build._id, // after biothings 8/20/2021
          index_name: index_name,
          mode: mode })
        .then(response => {
          //console.log(response.data.result)
          return response.data.result
        })
        .catch(err => {
          //console.log('Error creating index: ')
          console.log(err)
          axios.put(axios.defaults.baseURL + '/index', {
            indexer_env: index_env,
            target_name: this.build._id, // before then
            index_name: index_name,
            mode: mode })
        })
    },
    newIncrementalRelease: function () {
      var old_build = $('.ui.form select[name=old_build]').val()
      var diff_type = $('.ui.form select[name=diff_type]').val()
      var diff_purge = $('.ui.form input[name=diff_purge]').prop('checked')
      if (!old_build) { this.errors.push('Select a build to compute incremental data') }
      if (!diff_type) { this.errors.push('Select a diff type') }
      var args = { diff_type: diff_type, old: old_build, new: this.build._id }
      if (diff_purge) { args.mode = 'purge' }
      axios.put(axios.defaults.baseURL + '/diff', args)
        .then(response => {
          //console.log(response.data.result)
          return response.data.result
        })
        .catch(err => {
          //console.log('Error creating diff: ')
          console.log(err)
        })
    },
    newRelease: function () {
      var self = this
      $('.ui.basic.newrelease.modal')
        .modal('setting', {
          detachable: false,
          onShow: function () {
            self.errors = []
            self.ensureSelectedIndexEnv()
            self.$nextTick(function () {
              $('.ui.indexenvs.dropdown').dropdown('refresh')
              self.checkIndexExists()
            })
          },
          onApprove: function () {
            self.errors = []
            var release_type = $('.ui.form select[name=release_type]').val()
            if (release_type == 'full') {
              return self.newFullRelease()
            } else if (release_type == 'incremental') {
              return self.newIncrementalRelease()
            } else {
              //console.log(`Unknown release type ${release_type}`)
              return false
            }
          }
        })
        .modal('show')
    },
    loadData: function () {
      // diff types
      axios.get(axios.defaults.baseURL + '/diff_manager')
        .then(response => {
          //console.log(response.data.result)
          this.diff_types = Object.keys(response.data.result).sort()
        })
        .catch(err => {
          console.log(err)
          //console.log('Error loading differ information: ' + err.data.error)
        })
      // index env
      axios.get(axios.defaults.baseURL + '/index_manager')
        .then(response => {
          this.index_envs = response.data.result
          this.ensureSelectedIndexEnv()
          this.$nextTick(function () {
            $('.ui.indexenvs.dropdown').dropdown()
            this.checkIndexExists()
          })
        })
        .catch(err => {
          console.log(err)
          //console.log('Error loading differ information: ' + err.data.error)
        })
      // avail builds
      axios.get(axios.defaults.baseURL + `/builds?conf_name=${this.build.build_config._id}`)
        .then(response => {
          //console.log(response.data.result)
          $(response.data.result).each((i, e) => {
            //console.log(`${e._id} ${this.build._id}`)
            if (e._id != this.build._id) { this.avail_builds.push(e._id) }
          })
        })
        .catch(err => {
          console.log(err)
          //console.log('Error loading differ information: ' + err.data.error)
        })
    },
    reloadLogs: function() {
      let activeTab = $(".stageLogs a[data-tab].active")
      if (activeTab) {
        this.$refs[activeTab.data("tab") + "Logs"][0].getLogs(true)
      }
    },
    toggleLogViewers: function(show, stageName){
      this.showLogs = show
      if (show) {
        this.showLogViewers(stageName)
      }
      else {
        this.hideLogViewers()
      }
    },
    showLogViewers: function(stageName=null) {
      // if show, we get stages' logs first
      // then check if there is an active tab, if not, active the first tab
      // lastly, we set the the LogViewer.show based on its tab visible

      if (!stageName) {
        stageName = $(".stageLogs a[data-tab]:first").data("tab")
      }

      $(".stageLogs [data-tab]:not([data-tab" + stageName + "])").removeClass("active")
      $(".stageLogs [data-tab=" + stageName + "]").addClass("active")

      this.logStages.forEach(stage => {
        let logViewer = this.$refs[stage.name + 'Logs'][0]
        if (stage.name === stageName) {
          logViewer.show = true
        }
        else {
          logViewer.show = false
        }
      })
    },
    hideLogViewers: function() {
      // first we hide all tabs
      // then set all LogViewer.show to false
      $(".stageLogs [data-tab]").removeClass("active")
      this.logStages.forEach(stage => {
        this.$refs[stage.name + 'Logs'][0].show = false
      })
    }
  }
}
</script>

<style scoped>
.ui.checkbox label {
    color: white !important;
}

.release-toolbar {
  margin-bottom: 1rem;
  position: relative;
  text-align: right;
  z-index: 1;
}

.stageLogs .menu.hidden {
  display: none;
}

.stageLogs .menu {
  margin-top: 1rem;
}

.stageLogs .menu h5 {
  display: flex;
  align-items: flex-end;
  padding: 1rem 1rem 0 1rem;
}

.derived-index-name[readonly] {
  background: #f9fafb;
  color: rgba(0, 0, 0, 0.7);
}

.index-mode-panel {
  margin-top: 0;
  margin-bottom: 1rem;
}

.index-mode-buttons {
  width: 100%;
  margin-top: 0.5rem;
}

.index-mode-buttons .button {
  line-height: 1.2;
  white-space: normal;
}

.index-mode-buttons .teal.button,
.index-mode-buttons .red.button {
  color: #fff !important;
}

.index-mode-buttons .basic.teal.button {
  background: #fff !important;
  box-shadow: 0 0 0 1px #00b5ad inset !important;
  color: #00b5ad !important;
}

.index-mode-buttons .basic.red.button {
  background: #fff !important;
  box-shadow: 0 0 0 1px #db2828 inset !important;
  color: #db2828 !important;
}

.index-mode-help {
  margin-top: 0;
  text-align: left;
}

.index-mode-help .list {
  margin-top: 0.5rem;
}
</style>
