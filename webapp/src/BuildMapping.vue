<template v-if="maps">
    <span>
        <div class="ui fluid basic segment right aligned" :class="actionable">
            <button class="ui button mini" v-on:click="inspect">
                <i class="unhide icon"></i>
                Inspect data
            </button>
        </div>

        <inspect-form v-bind:_id="build._id">
        </inspect-form>

        <p>
            These are the mappings for build <b>{{build._id}}</b>.
        </p>

        <!-- Inspection results tabs -->
        <div class="ui tabular menu">
            <div class="item active" data-tab="mapping-mode">Mapping mode</div>
            <div class="item" data-tab="type-mode">Type mode</div>
            <div class="item" data-tab="stats-mode">Stats mode</div>
        </div>

        <!-- Inspection for Mapping mode -->
        <div class="ui tab active" data-tab="mapping-mode">
            <p>
                <i>Mapping from inspection</i> has been generated during data inspection, while <i>Registered mapping</i> is the actual active mapping, used during indexation.
            </p>
            <p>
                Mappings can be manually edited and mapping from inspection can be saved as the new registered, active mapping.
            </p>
            <div class="ui warning message">
                <ul class="ui list">
                    <li>Registered mapping is created by merging each source's mapping. Modifications may not survive as it can be re-generated.</li>
                    <li>When testing a mapping, an temporary index is created on the selection ElasticSearch environment. That index is then deleted.</li>
                </ul>
            </div>
            <div class="ui segment" v-if="maps">
                <div class="ui grid">
                    <div class="center aligned sixteen wide column" v-if="maps['inspect_mapping'] && !maps['inspect_mapping']['errors'] && !maps['inspect_mapping']['pre-mapping']">
                        <button class="ui labeled mini icon button"
                            v-on:click="diffMapping('tab_mapping_inspected','tab_mapping_registered',build._id)">
                            <i class="exchange icon"></i>
                            Diff
                        </button>
                    </div>

                    <div class="sixteen wide column">
                        <div class="ui grid">
                            <div class="eight wide column">
                                <mapping-map v-if="maps"
                                    v-bind:entity="'build'"
                                    v-bind:map="maps['inspect_mapping']"
                                    v-bind:name="build._id"
                                    v-bind:map_origin="'inspect'"
                                    v-bind:map_id="'tab_mapping_inspected'"
                                    v-bind:read_only="maps['inspect_mapping'] && maps['inspect_mapping']['pre-mapping']"
                                    v-bind:can_commit="maps['registered_mapping'] ? maps['registered_mapping']['origin'] != 'uploader' : true">
                                </mapping-map>
                            </div>
                            <div class="eight wide column">
                                <mapping-map v-if="maps['registered_mapping']"
                                    v-bind:entity="'build'"
                                    v-bind:map="maps['registered_mapping']"
                                    v-bind:name="build._id"
                                    v-bind:map_origin="'build'"
                                    v-bind:map_id="'tab_mapping_registered'"
                                    v-bind:read_only="false"
                                    v-bind:can_commit="false">
                                </mapping-map>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else class="ui segment">
                No mapping found.
                <span :class="actionable">
                    <button class="ui button mini" v-on:click="inspect">
                        <i class="unhide icon"></i>
                        Inspect data
                    </button>
                    to create one.
                </span>
            </div>
        </div>
        <!-- Inspection for Type mode -->
        <div class="ui tab" data-tab="type-mode">
            <p>This is the inspection for type mode</p>
            <pre class="inspection-detail">{{ JSON.stringify(maps.inspect_type || '', null, 4) }}</pre>
        </div>
        <!-- Inspection for Stats mode -->
        <div class="ui tab" data-tab="stats-mode">
            <p>This is the inspection for stats mode</p>
            <pre class="inspection-detail">{{ JSON.stringify(maps.inspect_stats || '', null, 4) }}</pre>
        </div>

    </span>
</template>

<script>
import bus from './bus.js'
import InspectForm from './InspectForm.vue'
import MappingMap from './MappingMap.vue'
import JsonDiffResults from './JsonDiffResults.vue'
import BuildReleases from './BuildReleases.vue'
import BuildSources from './BuildSources.vue'
import BuildStats from './BuildStats.vue'
import BuildLogs from './BuildLogs.vue'
import BuildConfig from './BuildConfig.vue'
import DiffUtils from './DiffUtils.vue'
import Actionable from './Actionable.vue'

export default {
  name: 'build-mapping',
  props: ['build'],
  mixins: [DiffUtils, Actionable], // for diff mapping
  components: {
    InspectForm,
    MappingMap,
    JsonDiffResults,
    BuildReleases,
    BuildSources,
    BuildStats,
    BuildLogs,
    BuildConfig
  },
  updated () {
    $('select.dropdown').dropdown()
    $('.menu .item').tab()
  },
  computed: {
    // a computed getter
    maps: function () {
      // organize mappings in a simple object, if mappings exist
      var _maps = {}
      if (this.build.mapping) {
        // registered is the registered/active mapping found in src_master
        _maps.registered_mapping = this.build.mapping
      }
      if (this.build.inspect && this.build.inspect.results) {
        // inspected
        _maps.inspect_mapping = this.build.inspect.results.mapping
        _maps.inspect_type = this.build.inspect.results.type
        _maps.inspect_stats = this.build.inspect.results.stats
      }
      if (Object.keys(_maps).length) { return _maps }
      return null
    }
  },
  methods: {
    displayError: function () {
      var errs = []
      return errs.join('<br>')
    },
    inspect: function (event) {
      bus.$emit('do_inspect', this.build._id)
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
