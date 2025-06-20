<template>
  <div class="ui container">
    <div class="ui container big message clearMenu">
      <h1 class="ui pink header">Sources</h1>
    </div>
    <div id="data-source" class="ui centered fluid card" v-if="source">
      <div class="content">
        <div class="left aligned header" v-if="source.name">
          {{ source.name }}
          <span class="dumper-schedule-popup" v-if="dumper_schedule_message" :data-html="dumper_schedule_message">
            <i class="calendar alternate outline icon"></i>
          </span>
        </div>

        <div class="meta">
          <span class="right floated time" v-if="source.download && source.download.started_at">
            Updated {{ source.download.started_at | moment("from", "now") }}
          </span>
          <span class="right floated time" v-else>Never updated</span>
          <span class="left floated category">{{ release }}</span>
        </div>
        <div class="left aligned description">
          <div>
            <div class="ui clearing divider"></div>
            <div class="left floated">
              <i class="file outline icon"></i>
              {{ source.count | currency('', 0) }} document{{ source.count > 1 ? "s" : "" }}
            </div>
            <div class="right floated">
              <span v-if="license !== null && typeof license === 'object'">
                <table class="meta ui single line compact small table">
                  <thead>
                    <tr>
                      <th v-for="(_, src) in license" :key="src">{{ src }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td v-for="url in license" :key="url">
                        <a v-if="url.startsWith('http')" :href="url">license</a>
                        <span v-else>{{ license }}</span>
                      </td>
                    </tr>
                    <tr>
                      <td v-for="url in website" :key="url">
                        <a :href="url">website</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </span>
              <span v-else>
                <table class="meta ui single line compact small table">
                  <tbody>
                    <tr>
                      <td>
                        <a v-if="license_url" :href="license_url">
                          <span v-if="license">{{ license }}</span>
                          <span v-else>license</span>
                        </a>
                        <span v-else>{{ license }}</span>
                      </td>
                      <td>
                        <a v-if="website" :href="website">website</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </span>
            </div>
            <br>
          </div>

          <div>
            <div class="ui top attached pointing menu">
              <a class="blue item active" data-tab="dump" v-if="source.download">Dumper</a>
              <!-- in case no dumper, uploader should be active tab -->
              <a :class="['blue item', source.download == undefined ? 'active' : '']" data-tab="upload"
                v-if="source.upload">Uploader</a>
              <a class="blue item" data-tab="plugin" v-if="source.data_plugin">Plugin</a>
              <a class="blue item" data-tab="mapping">Mapping</a>
              <a class="blue item" data-tab="validate">Validation</a>
              <a class="blue item" data-tab="quick_index">Quick Index</a>
            </div>
            <div class="ui bottom attached tab segment active" data-tab="dump" v-if="source.download">
              <data-source-dump :source="source"></data-source-dump>
              <br>
              <LogViewer type="dump" :item="source" key="dumplogs"></LogViewer>
            </div>
            <div :class="['ui bottom attached tab segment', source.download == undefined ? 'active' : '']"
              data-tab="upload" v-if="source.upload">
              <data-source-upload :source="source"></data-source-upload>
            </div>
            <div class="ui bottom attached tab segment" data-tab="validate" v-if="source.upload">
              <data-source-validate :source="source"></data-source-validate>
            </div>
            <div class="ui bottom attached tab segment" data-tab="plugin" v-if="source.data_plugin">
              <data-source-plugin :source="source"></data-source-plugin>
            </div>
            <div class="ui bottom attached tab segment" data-tab="mapping">
              <data-source-mapping :maps="maps" :_id="_id" :source="source"></data-source-mapping>
            </div>
            <div class="ui bottom attached tab segment" data-tab="quick_index">
              <data-source-quick-index :key="source._id" :source="source"></data-source-quick-index>
            </div>
          </div>

        </div>
      </div>

      <inspect-form v-bind:toinspect="source" v-bind:select_data_provider="true" :class="actionable">
      </inspect-form>

      <div class="ui basic unregister modal" v-if="source.data_plugin" :class="actionable">
        <input class="plugin_url" type="hidden" :value="source.data_plugin.plugin.url">
        <div class="ui icon header">
          <i class="remove icon"></i>
          Unregister data plugin
        </div>
        <div class="content">
          <p>Are you sure you want to unregister and delete data plugin <b>{{ source.name }}</b> ?</p>
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

      <diff-modal></diff-modal>

    </div>
  </div>
</template>

<script>
import axios from 'axios'
import bus from './bus.js'
import InspectForm from './InspectForm.vue'
import BaseDataSource from './BaseDataSource.vue'
import DataSourceDump from './DataSourceDump.vue'
import DataSourceValidate from './DataSourceValidate.vue'
import DataSourceUpload from './DataSourceUpload.vue'
import DataSourceInspect from './DataSourceInspect.vue'
import DataSourcePlugin from './DataSourcePlugin.vue'
import DataSourceMapping from './DataSourceMapping.vue'
import DataSourceQuickIndex from './DataSourceQuickIndex.vue'
import DiffModal from './DiffModal.vue'
import Loader from './Loader.vue'
import Actionable from './Actionable.vue'
import LogViewer from './components/LogViewer.vue'
import RouteWatcher from './mixins/RouteWatcher.vue'

export default {
  name: 'data-source-detailed',
  props: ['_id'],
  components: {
    InspectForm,
    DataSourceDump,
    DataSourceUpload,
    DataSourceInspect,
    DataSourcePlugin,
    DataSourceMapping,
    DataSourceValidate,
    DataSourceQuickIndex,
    DiffModal,
    Loader,
    LogViewer
  },
  mixins: [BaseDataSource, Loader, Actionable, RouteWatcher],
  mounted() {
    this.loadData()
    $('select.dropdown').dropdown()
    $('.menu .item').tab()
  },
  created() {
    bus.$on('change_source', this.loadData)
    bus.$on('change_master', this.loadData)
    bus.$on('change_data_plugin', this.loadData)
  },
  updated() {
    $('.dumper-schedule-popup').popup({
      hoverable: true,
    })
  },
  beforeDestroy() {
    bus.$on('change_source', this.loadData)
    bus.$off('change_master', this.loadData)
    bus.$on('change_data_plugin', this.loadData)
  },
  data() {
    return {
      source: null,
      dumper_schedule: null,
    }
  },
  computed: {
    // a computed getter
    maps: function () {
      // organize mappings in a simple object, if mappings exist
      var _maps = {}
      if (this.source.inspect && this.source.inspect.sources) {
        for (var subsrc in this.source.inspect.sources) {
          if (this.source.inspect.sources[subsrc].inspect) {
            _maps[subsrc] = {}
            for (var mode in this.source.inspect.sources[subsrc].inspect.results) {
              _maps[subsrc][`inspect_${mode}`] = this.source.inspect.sources[subsrc].inspect.results[mode]
            }
          }
        }
      }
      for (var subsrc in this.source.mapping) {
        if (!subsrc in _maps) { _maps[subsrc] = {} }
        if (!_maps[subsrc]) {
          _maps[subsrc] = {}
        }
        // registered is the registered/active mapping found in src_master
        _maps[subsrc].registered_mapping = this.source.mapping[subsrc]
      }
      if (Object.keys(_maps).length) { return _maps }

      return null
    },
    license: function () {
      return this.pick_metadata(['license'])
    },
    license_url: function () {
      return this.pick_metadata(['license_url', 'license_url_short'])
    },
    website: function () {
      return this.pick_metadata(['url'])
    },
    dumper_schedule_message: function () {
      if (!this.dumper_schedule) return

      const cron_info = this.dumper_schedule.cron,
        strdelta = this.dumper_schedule.strdelta

      if (!cron_info || !strdelta) return

      return `<div style="min-width: 300px;">
        <div>This dumper runs automatically:</div>
        <div style="margin-left: 1rem;"><B>Schedule</B>: <a href="https://crontab.guru/#${cron_info.replaceAll(" ", "_")}" target="_blank">${cron_info}</a></div>
        <div style="margin-left: 1rem;">Next job is scheduled to run in ${strdelta}</div>
      </div>`
    }
  },
  methods: {
    loadData() {
      var self = this
      this.loading()
      axios.get(axios.defaults.baseURL + `/source/${this._id}`)
        .then(response => {
          self.source = response.data.result
          try {
            self.dumper_schedule = self.source.download.dumper.schedule
          }
          catch (error) {
            self.dumper_schedule = null;
          }

          this.loaded()
        })
        .catch(err => {
          console.log('Error getting source information: ' + err)
          this.loaderror(err)
        })
    },
    pick_metadata: function (fields_priority) {
      var meta = null
      function pick(values) {
        var picked = null
        for (var field in fields_priority) {
          if (values[fields_priority[field]]) {
            picked = values[fields_priority[field]]
          }
        }
        return picked
      };

      if (this.source.__metadata__) {
        // one or more licenses ?
        // One : __metadata__ is a dictionary containing license keys
        // More: __metadata__ is a dictionary indexed by sub-src names
        if (Array.isArray(this.source.__metadata__)) {
          meta = {}
          for (var idx in this.source.__metadata__) {
            var m = this.source.__metadata__[idx]
            for (var subsrc in m) {
              var picked = pick(m[subsrc])
              if (picked) { meta[subsrc] = picked }
            }
          }
        } else {
          for (var src in this.source.__metadata__) {
            meta = pick(this.source.__metadata__)
          }
        }
      }
      return meta
    },
  }
}
</script>

<style>
.meta.ui.table {
  margin-bottom: 1em;
  border: 0px;
}

.meta.ui.table thead th {
  padding: 0.4em 0.4em 0.4em 0.4em !important;
  text-align: center;
}

.meta.ui.table tbody td {
  padding: 0.4em 0.4em 0.4em 0.4em !important;
  text-align: center;
}
</style>
