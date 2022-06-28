<template>
    <div>
        <div v-if="error" class="ui error message">
            {{error}}
        </div>

        <div class="ui text red">
          This tab is intended to quickly create indexes for testing purpose. To create an index to use in a production environment, use normal flow instead.
        </div>

        <button class="ui small grey newrelease right floated  button" @click="newRelease" :class="actionable">
            New release
        </button>

        <div class="ui feed"  v-if="releases">
            <div class="event" v-for="rel in releases" :key="rel.index_name">
                <div class="eight wide column">
                  <div class="summary">
                      <i class="ui bookmark icon"></i>
                      Index
                      <b class="user">
                          {{rel.index_name}}
                      </b> was created on <b>{{rel.environment.name}}</b> environment (<b>{{rel.environment.host}}</b>)
                      <div class="date">
                          {{rel.creation_date | moment("from", "now")}}
                          (<i>on {{moment(rel.creation_date).format('MMMM Do YYYY, h:mm:ss a') }}</i>)

                      </div>
                      Current version: <b>{{ rel.build_version }}</b>
                  </div>
              </div>
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
                            <div>
                                <label>Enter a name for the type of stored documents ("gene", "variant", ...)</label>
                                <input type="text" name="doc_type" placeholder="Document type" required>
                                <br>
                                <br>
                            </div>
                            <div>
                                <label>Enter a name for the index (or leave it empty to have the same name as the datasource)</label>
                                <input type="text" name="index_name" placeholder="Index name">
                                <br>
                                <div class="ui teal message">
                                    In order to show newly created index in this tab, index name should be in this format: {DATASOURCE NAME}_{any string}, or QUICK__{DATASOURCE NAME}_{any string}
                                </div>
                                <br>
                            </div>
                            <div>
                                <label>Select an indexer environment to create the index on</label>
                                <select class="ui fluid indexenvs dropdown" name="indexer_env">
                                    <option v-for="(info,env) in indexer_envs.env" :key="env" :value="env">{{env}} <i>({{info.host}})</i></option>
                                </select>
                                <br>
                            </div>
                            <div>
                                <label>Enter number of shards (default is 1)</label>
                                <input type="number" name="num_shards" value="1" min="1">
                                <br>
                                <br>
                            </div>
                            <div>
                                <label>Enter number of replicas (default is 0)</label>
                                <input type="number" name="num_replicas" value="0" min="0">
                                <br>
                                <br>
                            </div>
                            <div>
                              <label>Optional parameters can be added to the configuration (usefull to customize builder behavior). Enter a JSON object structure</label>
                              <textarea name="extra_index_settings">{}</textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="ui error message" v-if="form_errors.length">
                <ul class="ui list">
                    <li v-for="(err, i) in form_errors" :key="err+i">{{err}}</li>
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
    </div>
</template>

<script>
import axios from 'axios'
import Loader from './Loader.vue'
import AsyncCommandLauncher from './AsyncCommandLauncher.vue'
import IndexReleaseEvent from './IndexReleaseEvent.vue'
import Actionable from './Actionable.vue'

export default {
  name: 'data-source-quick-index',
  props: ['source'],
  mixins: [AsyncCommandLauncher, Loader, Actionable],
  components: {
    IndexReleaseEvent,
  },
  data () {
    return {
      build: {},
      error: "",
      form_errors: [],
      indexer_envs: [],
      releases: [],
    }
  },
  mounted () {
    $('.ui.indexenvs.dropdown').dropdown()
  },
  created () {
    this.loadData()
  },
  beforeDestroy () {
    $('.ui.basic.newrelease.modal').remove()
  },
  methods: {
    onQuickIndexCommandSuccess: function (response) {
      this.loadData()
    },
    onQuickIndexCommandError: function (response) {
      let detail = response.data.result.results || []
      detail = detail.join(", ")
      this.error = `Failed to quick index. Error: ${detail}`
    },
    newFullRelease: function () {
      var doc_type = $('.ui.form input[name=doc_type]').val()
      var index_name = $('.ui.form input[name=index_name]').val()
      if (index_name == '') {
        index_name = null
      }
      var indexer_env = $('.ui.form select[name=indexer_env]').val()
      var num_shards = $('.ui.form input[name=num_shards]').val()
      var num_replicas = $('.ui.form input[name=num_replicas]').val()
      var extra_index_settings = $('.ui.form textarea[name=extra_index_settings]').val()

      if (!doc_type) {
        this.form_errors.push('Provide a document type')
      }
      if (!indexer_env) {
        this.form_errors.push('Select an indexer environment')
      }
      if (!num_shards || num_shards < 1) {
        num_shards = 1
      }
      if (!num_replicas || num_replicas < 0) {
        num_replicas = 0
      }
      if (extra_index_settings) {
        try {
          JSON.parse(extra_index_settings)
        }
        catch(error) {
          this.form_errors.push('Invalid extra index settings: ' + error)
        }
      }

      if (this.form_errors.length > 0) {
        return false
      }

      return axios.post(axios.defaults.baseURL + '/quick_index', {
          datasource_name: this.source._id,
          doc_type: doc_type,
          indexer_env: indexer_env,
          index_name: index_name,
          num_shards: num_shards,
          num_replicas: num_replicas,
          extra_index_settings: extra_index_settings,
      })
    },
    newRelease: function () {
      var self = this
      $('.ui.basic.newrelease.modal')
        .modal('setting', {
          detachable: false,
          onShow: function () {
            self.form_errors = []
            $('.ui.form input[name=doc_type]').val('')
            $('.ui.form input[name=index_name]').val('')
            $('.ui.form input[name=num_shards]').val(1)
            $('.ui.form input[name=num_replicas]').val(0)
            $('.ui.form textarea[name=extra_index_settings]').val('{}')
          },
          onApprove: function () {
            self.form_errors = []
            self.launchAsyncCommand(
              self.newFullRelease,
              self.onQuickIndexCommandSuccess,
              self.onQuickIndexCommandError
            )
          }
        })
        .modal('show')
    },
    getReleases: function() {
      const index_name = `quick__${this.source._id}_*,${this.source._id}_*`
      axios.get(axios.defaults.baseURL + `/indexes_by_name?index_name=${index_name}&limit=10`)
        .then(response => {
          this.releases = response.data.result
          this.releases.forEach((rel, _) => {
            rel.creation_date = parseFloat(rel.creation_date)
          })

        })
        .catch(err => {
          console.log(err)
        })
    },
    loadData: function () {
      // fetch releases
      this.getReleases()

      // fetch index envs
      axios.get(axios.defaults.baseURL + '/index_manager')
        .then(response => {
          this.indexer_envs = response.data.result
        })
        .catch(err => {
          console.log(err)
        })
    },
  }
}
</script>

<style scoped>
.ui.checkbox label {
    color: white !important;
}

</style>
