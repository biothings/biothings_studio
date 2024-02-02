<template>
    <span>
        <span v-if="source.upload && source.upload.sources">
            <span v-if="Object.keys(source.upload.sources).length > 1">
                <div id="srcs" class="ui top attached tabular menu">
                    <a :class="['green item', i === 0 ? 'active' : '']"
                        :data-tab="'upload_' + subsrc"
                        v-for="(subsrc_data, subsrc, i) in source.upload.sources"
                        :key="i+'x'">
                        {{subsrc}}
                        <button class="reset ui button" v-if="source.upload.sources[subsrc]['uploader'] === null" @click="reset(subsrc)" data-tooltip="Datasource broken, click to remove">
                            <i class="close icon"></i>
                        </button>
                        <i class="red exclamation circle icon pulsing" v-if="subsrc_data.status === 'failed'" ></i>
                    </a>
                </div>
            </span>
            <div :class="['ui bottom attached tab segment', i === 0 ? 'active' : '']" :data-tab="'upload_' + subsrc" v-for="(info,subsrc,i) in source.upload.sources" :key="i">
                <div class="ui two grid">
                    <div class="row">
                        <div class="ten wide column">
                            <table class="ui small very compact definition collapsing table">
                                <tbody>
                                    <tr>
                                        <td >Release</td>
                                        <td>
                                            {{info.release}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <!--i class="folder icon"></i-->
                                            Data folder
                                        </td>
                                        <td>
                                            <a v-if="info.data_folder" :href="info.data_folder | replace('/data/biothings_studio','')">{{ info.data_folder }}</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td >Status</td>
                                        <td><i :class="info.status == 'failed' ? 'red' : 'green'">{{info.status}}</i></td>
                                    </tr>
                                    <tr v-if="info.error">
                                        <td >Error</td>
                                        <td>
                                            <div class="error-message red">{{info.error}}</div>
                                            <TracebackViewer :source="source"></TracebackViewer>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td >Last Upload</td>
                                        <td>{{info.started_at}} <i v-if="info.started_at">({{info.started_at | moment("from", "now")}})</i></td>
                                    </tr>
                                    <tr>
                                        <td >Duration</td>
                                        <td>{{info.time}}</td>
                                    </tr>
                                    <tr>
                                        <td >Documents uploaded</td>
                                        <td>{{info.count | currency('',0)}}</td>
                                    </tr>
                                    <tr>
                                        <td class="ui grey">Uploader</td>
                                        <td v-if="info.uploader">
                                            {{info.uploader.name}}
                                            <span v-if="info.uploader.dummy">(dummy)</span>
                                        </td>
                                        <td v-else>
                                            <div class="red">No uploader found, datasource may be broken</div>
                                        </td>

                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="six wide column" v-if="info.uploader">
                            <p v-if="info.uploader.dummy">This is a <i>dummy</i> uploader, meaning data isn't actually uploaded but rather already stored in a collection.
                                In order to register data, a <b>release</b> is required in order the uploader to run properly.</p>
                            <div :class="['ui upload form',actionable,subsrc]">
                                <div class="fields">
                                    <div class="required ten wide field">
                                        <input type="text" id="release" placeholder="Specify a release" autofocus v-if="info.uploader.dummy" v-model="release">
                                    </div>
                                    <div class="required six wide field">
                                        <button :class="['ui labeled small icon button',info.status == 'uploading' ? 'disabled' : '']" @click="do_upload(subsrc, release)">
                                            <i class="database icon"></i>
                                            Upload
                                        </button>
                                        <button
                                            :class="['ui labeled small icon button teal update-source-meta',info.status == 'uploading' ? 'disabled' : '']"
                                            @click="do_update_source_meta(subsrc)"
                                            :data-subsrc="subsrc">
                                            <i class="sync alternate icon"></i>
                                            Update metadata
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <br>

                <LogViewer type="upload" :item="source" :sub_item_name="subsrc" :key="'uploadlogs_' + subsrc"></LogViewer>
            </div>
        </span>
        <div v-else>
            No uploader found for this source.
        </div>

        <div class="ui modal" id="metadata-confirming">
            <div class="ui icon header">
                Confirm updating metadata
            </div>
            <div class="content">
                <div class="ui text small red" style="text-align: center; margin-bottom: 1rem;">Warning! Typically you want to re-run "upload" step to update both the metadata and actual data at the same time. Please proceed to update the metadata only if it won't cause any inconsistency with the previously uploaded data.</div>

                <div v-for="builder_class in metadataCompareData" v-bind:key="builder_class.kclass" class="ui grid">
                    <div class="row" style="padding-bottom: 0;">
                        <h3 v-for="version in ['current', 'new']" v-bind:key="version" :class="'eight wide column ' + version">
                            {{ version }} Metadata
                        </h3>
                    </div>
                    <div class="row metadata-wrapper">
                        <pre v-for="version in ['current', 'new']"
                            v-bind:key="version"
                            :class="'eight wide column metadata ' + version">{{ builder_class[version] }}</pre>
                    </div>
                </div>
            </div>
            <div class="actions">
                <div class="ui red basic cancel inverted button">
                    <i class="remove icon"></i> Cancel
                </div>
                <div class="ui green ok inverted button">
                    <i class="checkmark icon"></i> Update
                </div>
            </div>
        </div>

    </span>
</template>

<script>
import axios from 'axios'
import Loader from './Loader.vue'
import Actionable from './Actionable.vue'
import TracebackViewer from './components/TracebackViewer.vue'
import AsyncCommandLauncher from './AsyncCommandLauncher.vue'
import LogViewer from './components/LogViewer.vue'

export default {
  name: 'data-source-upload',
  props: ['source'],
  mixins: [AsyncCommandLauncher, Loader, Actionable],
  mounted () {
    this.setup()
  },
  components:{
      TracebackViewer,
      LogViewer,
  },
  data () {
    return {
        metadataCompareData: [],
        release: null
    }
  },
  methods: {
    setup: function () {
      const self = this
      $('.menu .item').tab()
      $("#metadata-confirming .actions .ok").on("click", event => {
        const subsrc = $("button.update-source-meta").data("subsrc")
        self.do_update_source_meta(subsrc, false)
      })
    },
    do_upload: function (subsrc = null, release = null) {
      return this.$parent.upload(subsrc = subsrc, release = release)
    },
    do_update_source_meta: function(subsrc=null, dry=true) {
        const self = this
        self.loading()

        const cmd = function () {
            const data = {"dry": dry}
            let srcname = self.source.name

            if (subsrc != null) { // update a sub-source only
                srcname += '.' + subsrc
            }

            return axios.put(axios.defaults.baseURL + `/source/${srcname}/update_source_meta`, data)
        }
        const onSuccess = function (response) {
            self.metadataCompareData = []
            response.data.result.results.forEach(kclass_data => {
                if (kclass_data) {
                    self.metadataCompareData.push(kclass_data)
                }
            })

            if (dry) {
                if (self.metadataCompareData.length > 0) {
                    $("#metadata-confirming").modal("show")
                }
                else {
                    $('body').modal('alert','<span class="ui large text">Nothing changed. No need to update.</span>');
                }
            }
            else {
                $('body').modal('alert','<span class="ui large text">Successfully updated metadata!</span>');
            }
        }
        const onError = function (err) {
            console.log(err);
            self.loaderror(err);
            self.backend_error = self.extractAsyncError(err)
        }

        this.launchAsyncCommand(cmd, onSuccess, onError)
    },
    reset: function (subsrc) {
      var self = this
      self.loading()
      var data = {
        name: self.source._id,
        key: 'upload',
        subkey: subsrc
      }
      axios.post(axios.defaults.baseURL + `/source/${self.source._id}/reset`, data)
        .then(response => {
          self.loaded()
        })
        .catch(err => {
          self.loaderror(err)
        })
    }
  }
}
</script>

<style scoped>
#srcs i.red {
    margin-left: 0.3rem;
}
.reset.button {
    font-size: 0.5em !important;
    margin-left: 1em !important;
}
.reset > i {
    margin: 0em !important;
}
.update-source-meta {
    margin-top: 2rem;
}

#metadata-confirming h3 {
    text-transform: capitalize;
}

#metadata-confirming .metadata-wrapper {
    display: flex;
    justify-content: space-between;
}

#metadata-confirming pre {
    overflow-x: auto;
    width: 49% !important;
}

.error-message {
    max-width: 30vw;
    overflow-x: auto;
    overflow-wrap: normal;
    margin-bottom: 0.5rem;
}
</style>
