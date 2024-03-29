<template>
    <div class="event-container">
        <div class="ui grid">
            <div class="eight wide column">
                <div class="summary">
                    <i class="ui bookmark icon"></i>
                    Index
                    <b class="user">
                        {{release.index_name}}
                    </b> was created on <b>{{release.environment}}</b> environment (<b>{{release.host}}</b>)
                    <div class="date">
                        {{release.created_at | moment("from", "now")}}
                        (<i>on {{moment(release.created_at).format('MMMM Do YYYY, h:mm:ss a') }}</i>)

                    </div>
                    Current version: <b>{{ build._meta.build_version }}</b>
                </div>
                <div class="meta">
                  <div :class="actionable">
                    <i class="file alternate icon"></i> {{ num_indexed | formatNumber }} documents indexed
                      <button :class="[release.snapshot ? 'disabled' : '','ui tinytiny grey labeled icon button']" @click="snapshot(release)">
                          <i class="bookmark icon"></i>Snapshot
                      </button>
                  </div>
                </div>
                <div class="meta" v-if="relevant_snapshots && Object.keys(relevant_snapshots).length">
                  <div>
                    <i class="server alternate icon"></i> {{ Object.keys(relevant_snapshots).length }} snapshot(s) created:
                    <table class="ui compact collapsing small green table">
                        <thead>
                          <tr>
                            <th>Snapshot Name</th>
                            <th :class="actionable">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="info,name in relevant_snapshots" class="item" :key="name">
                            <td>
                                <a>{{name}}</a> on <b>{{info.environment || "N/A"}}</b>
                                <publish-summary v-if="build.publish && build.publish.full && build.publish.full.hasOwnProperty(name)":publish="build.publish.full[name]" :type="type"></publish-summary>
                            </td>
                            <td :class="actionable">
                                <button class="ui tinytiny grey labeled icon button"
                                        @click="publish(release,name,build._id)">
                                    <i class="share alternate square icon"></i>
                                    Publish
                                </button>
                            </td>
                          </tr>
                        </tbody>
                    </table>
                  </div>
                </div>
            </div>
            <div class="eight wide column">
                <release-note-summary :build="build" :release="release" :type="type"></release-note-summary>
            </div>
        </div>

        <!-- create snapshot -->
        <div :class="['ui basic createsnapshot modal',release.index_name]">
            <h3 class="ui icon">
                <i class="bookmark icon"></i>
                Create snapshot
            </h3>
            <div class="content">
                <div class="ui form">
                    <div class="ui centered grid">
                        <div class="eight wide column">

                            <label>Select an environment, snapshot will be created according to its configuration:</label>
                            <div>
                                <select class="ui fluid snapshotenv dropdown" name="snapshot_env" v-model="selected_snapshot_env">
                                    <option v-for="_,env in snapshot_envs" :key="env">{{ env }}</option>
                                </select>
                                <br>
                                <br>
                            </div>

                            <label>Enter a name for the snapshot (or leave it empty to have the same name as the index)</label>
                            <div>
                              <input type="text" name="snapshot_name" placeholder="Snapshot name" autofocus v-model="snapshot_name">
                            </div>

                            <div :class="['ui','inverted', 'checkbox', repo_verification_error? '' : 'd-none']">
                              <br>
                              <br>
                              <input type="checkbox" name="recreate-repo" v-model="recreate_repo">
                              <label>Recreate repository? (old and outdated repo will be deleted, and new one is created to bypass verification step)</label>
                            </div>

                        </div>

                        <div class="eight wide column">
                            <span v-if="selected_snapshot_env">
                                <label>Configuration details:</label>
                                <pre class="envdetails">{{ snapshot_envs[selected_snapshot_env] }}</pre>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="ui error message" v-if="error" v-html="error" />

            <div class="actions">
                <div class="ui red basic cancel inverted button">
                    <i class="remove icon"></i>
                    Cancel
                </div>
                <div class="ui green ok inverted button">
                    <i class="checkmark icon"></i>
                    OK
                </div>
            </div>
        </div>

        <!-- publish release-->
        <div :class="['ui basic publishrelease modal',release_id]">
            <h3 class="ui icon">
                <i class="share square icon"></i>
                Publish release
            </h3>
            <div class="content">
                <div class="ui form">
                    <div class="ui centered grid">
                        <div class="eight wide column">

                            <div>
                                <label>The following full release will be published:</label>
                                <table class="ui inverted darkbluey definition table">
                                  <tbody>
                                    <tr>
                                      <td>Snapshot name</td>
                                      <td>{{ selected_snapshot }}</td>
                                    </tr>
                                  </tbody>
                                </table>
                                <br>
                                <br>
                            </div>

                            <div>
                                <select class="ui fluid releaseenv dropdown" name="publisher_env" v-model="selected_release_env">
                                    <option value="" disabled selected>Select a release environment</option>
                                    <option v-for="_,env in release_envs">{{ env }}</option>
                                </select>
                                <br>
                                <br>
                            </div>

                            <div>
                                <br>
                                <select class="ui fluid releaseenv dropdown" name="release_note" v-model="selected_release_note" v-if="build.release_note">
                                    <option value="" disabled selected>Select a release note to publish with this snapshot</option>
                                    <option v-for="_,reln in build.release_note">{{ reln }}</option>
                                </select>
                                <div v-else class="ui orange small message">Release note was not found and won't be published.</div>
                            </div>

                        </div>

                        <div class="eight wide column">
                            <span v-if="selected_release_env">
                                <label>Configuration details:</label>
                                <pre class="envdetails">{{ release_envs[selected_release_env] }}</pre>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="ui error message" v-if="publish_error">
                {{publish_error}}
            </div>

            <div class="actions">
                <div class="ui red basic cancel inverted button">
                    <i class="remove icon"></i>
                    Cancel
                </div>
                <div class="ui green ok inverted button">
                    <i class="checkmark icon"></i>
                    OK
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import axios from 'axios'
import bus from './bus.js'
import AsyncCommandLauncher from './AsyncCommandLauncher.vue'
import ReleaseNoteSummary from './ReleaseNoteSummary.vue'
import BaseReleaseEvent from './BaseReleaseEvent.vue'
import PublishSummary from './PublishSummary.vue'

export default {
  name: 'index-release-event',
  mixins: [AsyncCommandLauncher, BaseReleaseEvent],
  props: ['release', 'build', 'type'],
  mounted () {
  },
  beforeDestroy () {
    $(`.ui.basic.createsnapshot.modal.${this.release.index_name}`).remove()
  },
  components: { ReleaseNoteSummary, PublishSummary },
  data () {
    return {
      snapshot_envs: {},
      error: null,
      repo_verification_error: false,
      selected_snapshot_env: null,
      selected_snapshot: null,
      snapshot_name: null,
      recreate_repo: false,
      selected_release_note: null,
    }
  },
  computed: {
    num_indexed: function () {
      return this.release.count || 0
    },
    release_id: function () {
      return this.release.index_name
    },
    relevant_snapshots: function() {
      if (this.build.snapshot && Object.entries(
          this.build.snapshot).map(([k, v]) => v.index_name).every(Boolean)) {
        // biothings.hub > 8/20/2021 saves index_name for each snapshot
        return Object.fromEntries(
          Object.entries(this.build.snapshot).filter(
            ([k, v]) => (v.index_name === this.release.index_name) && 
              (v.indexer_env === this.release.environment)))
      } else { // there is no way to correlate a snapshot with an index
        return this.build.snapshot
      }
    }
  },
  methods: {
    displayError: function () {
    },
    snapshot (release) {
      var self = this
      self.loading()
      axios.get(axios.defaults.baseURL + '/snapshot_manager')
        .then(response => {
          self.snapshot_envs = response.data.result.env
          $('.ui.snapshotenv.dropdown').dropdown()
          self.loaded()
        })
        .catch(err => {
          console.log('Error getting snapshot environments: ')
          console.log(err)
          self.loaderror(err)
          self.error = err
        })
      $(`.ui.basic.createsnapshot.modal.${this.release.index_name}`)
        .modal('setting', {
          detachable: false,
          closable: false,
          onApprove: function () {
            self.loading()
            
            if (!self.selected_snapshot_env) { return }

            self.launchAsyncCommand(
              self.newSnapshot,
              self.onNewSnapshotCommandSuccess,
              self.onNewSnapshotCommandError,
            )
          }
        })
        .modal('show')
    },
    newSnapshot: function () {
      const self = this
      this.repo_verification_error = false
      return axios.put(axios.defaults.baseURL + '/snapshot',
        {
          snapshot_env: self.selected_snapshot_env,
          index: self.release.index_name,
          snapshot: self.snapshot_name,
          recreate_repo: self.recreate_repo,
        }
      )
    },
    onNewSnapshotCommandSuccess: function (response) {
      bus.$emit('reload_build_detailed')
      this.error = null
      this.loaded()
      return response.data.result
    },
    onNewSnapshotCommandError: function (response) {
      const error = JSON.parse(response.data.result.results)[0]
      if (error.error == 'repository_verification_exception') {
        this.repo_verification_error = true
      }
      this.error = "<span>Failed to verify the repository.</span>"
      this.error += `<pre>${JSON.stringify(error.detail, null, 2)}</pre>`
      console.log('Error creating snapshot: ', error)

      $(`.ui.basic.createsnapshot.modal.${this.release.index_name}`).modal('show')

      // The modal's observeChanges setting is not worked in this case, 
      // So this trick is used to force the modal to refresh, whenever the modal's size is changed.
      setTimeout(
        () => {
          $(`.ui.basic.createsnapshot.modal.${this.release.index_name}`).modal('refresh')
        },
        0
      )
      
    },
    publish: function (release, snapshot_name, current_build) {
      console.log(`snapshot_name ${snapshot_name} current_build ${current_build}`)
      var self = this
      self.error = null
      self.getReleaseEnvironments()
      self.selected_current = current_build
      self.selected_snapshot = snapshot_name
      $(`.ui.basic.publishrelease.modal.${this.release_id}`)
        .modal('setting', {
          detachable: false,
          closable: false,
          onApprove: function () {
            // more than one release note, user has to choose
            console.log(`rt ${self.selected_release_note} l ${self.build.release_note}`)
            if (!self.selected_release_note && Object.keys(self.build.release_note).length) {
              self.publish_error = 'Multiple release note found, please select one'
              return false
            }
            var params = {
              publisher_env: self.selected_release_env,
              build_name: self.selected_current,
              previous_build: self.selected_release_note,
              snapshot: snapshot_name
            }
            if (!self.selected_release_env) { return false }
            self.loading()
            axios.post(axios.defaults.baseURL + '/publish/full', params)
              .then(response => {
                bus.$emit('reload_build_detailed')
                self.loaded()
                return response.data.result
              })
              .catch(err => {
                console.log('Error publishing release: ')
                console.log(err)
                self.loaderror(err)
              })
          }
        })
        .modal('show')
    }
  }
}
</script>

<style scoped>
.tinytiny {
    padding: .5em 1em .5em;
    font-size: .6em;
}
.event-container {
    margin-bottom: 1em;
    width: inherit;

}
.pubactions {
    padding: 0 !important;
}

.envdetails {
    font-size: .8em;
    overflow: visible !important;
}

.d-none {
  display: none;
}
</style>
