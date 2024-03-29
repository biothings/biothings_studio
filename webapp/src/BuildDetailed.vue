<template>
    <div class="ui container">
        <div class="ui container big message clearMenu">
                <h1 class="ui orange header">Builds</h1>
        </div>
        <div id="build" class="ui centered fluid card" v-if="build">
            <div class="content">
                <div class="left aligned header" v-if="build.target_name">{{ build.target_name }}</div>
                <div class="meta">
                    <span class="right floated time" v-if="build.started_at">Built {{ build.started_at | moment("from", "now") }}
                        <div class="time" v-if="build.archived">Archived {{ build.archived | moment("from", "now") }}</div>
                    </span>
                    <div :class="['ui',color ? color : 'grey tiny', 'left floated', 'label conftag']">{{build.build_config.name}}</div>
                </div>
                <div class="left aligned description">
                    <div>
                        <div class="ui clearing divider"></div>
                        <div>
                            <i class="file outline icon"></i>
                            {{ build.count | currency('',0) }} document{{ build.count &gt; 1 ? "s" : "" }}
                        </div>
                        <br>
                    </div>

                    <p>
                        <div class="ui top attached pointing menu">
                            <a class="red item active" data-tab="info">Information</a>
                            <a class="red item" data-tab="mapping">Mapping</a>
                            <a class="red item" data-tab="releases">Releases</a>
                        </div>
                        <div class="ui bottom attached tab segment active" data-tab="info">
                            <div class="ui grid">
                                <div class="six wide column">
                                    <h5>Configuration</h5>
                                    <build-config v-bind:build="build"></build-config>
                                </div>
                                <div class="five wide column">
                                    <h5>Sources</h5>
                                    <build-sources v-bind:build="build"></build-sources>
                                    <h5>Statistics</h5>
                                    <build-stats v-bind:build="build"></build-stats>
                                </div>
                                <div class="five wide column">
                                    <h5>Logs</h5>
                                    <build-logs v-bind:build="build"></build-logs>
                                </div>
                            </div>
                            <div class="ui segment">
                              <LogViewer type="build" :item="build" key="buildlogs"></LogViewer>
                            </div>
                        </div>
                        <div class="ui bottom attached tab segment" data-tab="mapping">
                            <build-mapping v-bind:build="build"></build-mapping>
                        </div>
                        <div class="ui bottom attached tab segment" data-tab="releases">
                            <build-releases v-bind:build="build"></build-releases>
                        </div>
                    </p>

                </div>
            </div>

            <!-- Diff-->
            <diff-modal></diff-modal>

        </div>
    </div>
</template>

<script>
import axios from 'axios'
import bus from './bus.js'
import InspectForm from './InspectForm.vue'
import BaseBuild from './BaseBuild.vue'
import BuildReleases from './BuildReleases.vue'
import BuildSources from './BuildSources.vue'
import BuildStats from './BuildStats.vue'
import BuildLogs from './BuildLogs.vue'
import BuildConfig from './BuildConfig.vue'
import BuildMapping from './BuildMapping.vue'
import DiffModal from './DiffModal.vue'
import Loader from './Loader.vue'
import LogViewer from './components/LogViewer.vue'
import RouteWatcher from './mixins/RouteWatcher.vue'

export default {
  name: 'build-detailed',
  props: ['_id', 'color'],
  mixins: [BaseBuild, Loader, RouteWatcher],
  components: {
    InspectForm,
    BuildReleases,
    BuildMapping,
    DiffModal,
    BuildSources,
    BuildStats,
    BuildLogs,
    BuildConfig,
    Loader,
    LogViewer
  },
  mounted () {
    this.loadData()
  },
  updated () {
    $('select.dropdown').dropdown()
    $('.menu .item').tab()
  },
  created () {
    bus.$on('change_build', this.loadData)
  },
  beforeDestroy () {
    bus.$off('change_build', this.loadData)
  },
  data () {
    return {
      build: null
    }
  },
  methods: {
    displayError: function () {
      var errs = []
      return errs.join('<br>')
    },
    loadData () {
      var self = this
      this.loading()
      axios.get(axios.defaults.baseURL + `/build/${this._id}`)
        .then(response => {
          self.build = response.data.result
          this.loaded()
        })
        .catch(err => {
          console.log('Error getting build information: ' + err)
          this.loaderror(err)
        })
    }
  }
}
</script>

<style>
.conftag {
    margin-top: 1em !important;
    margin-bottom: 1em !important;
}
</style>
