<template>
    <span>
        <div class="ui fluid basic segment right aligned" :class="actionable">
            <button class="ui button mini" v-on:click="$parent.inspect">
                <i class="unhide icon"></i>
                Inspect data
            </button>
        </div>
        <inspect-form v-bind:_id="_id">
        </inspect-form>
        <span v-if="maps">
            <!-- multiple sub-source -->
            <span v-if="Object.keys(maps).length > 1">
                <p>Found sub-sources linked to main source <b>{{_id}}</b>, select one to see mapping</p>
                <div id="maps" class="ui top attached tabular menu">
                    <a :class="['green item', i === 0 ? 'active' : '']" v-for="(_,subsrc,i) in maps" :key="i" :data-tab="'inspect_' + subsrc">{{subsrc}}
                        <button class="reset ui button" v-if="is_broken(subsrc)" @click="reset(subsrc)" data-tooltip="Datasource broken, click to remove">
                            <i class="close icon"></i>
                        </button>
                    </a>
                </div>
            </span>
            <div :class="['ui bottom attached tab segment', i === 0 ? 'active' : '']" v-for="(data,subsrc,i) in maps" :key="i" :data-tab="'inspect_' + subsrc">
                <!-- Inspection results tabs -->
                <div class="ui tabular menu">
                  <a class="item active" :data-tab="subsrc + '-mapping-mode'">Mapping</a>
                  <a class="item" :data-tab="subsrc + '-type-stats'">Field types & stats</a>
                </div>

                <!-- Inspection for Mapping mode -->
                <div class="ui tab active" :data-tab="subsrc + '-mapping-mode'">
                  <p>
                    This is the mapping for source <b>{{subsrc}}</b>.
                  </p>
                  <p>
                    <i>Mapping from inspection</i> has been generated during data inspection, while <i>Registered mapping</i> is the actual active mapping, used during indexation.
                  </p>
                  <p>
                      Mappings can be manually edited and mapping from inspection can be saved as the new registered, active mapping.
                  </p>
                  <div class="ui warning message">
                      <ul class="ui list">
                          <li>If a mapping is hard-coded in source code, it can't be edited, saved or replaced.</li>
                          <li>When testing a mapping, an temporary index is created on the selection ElasticSearch environment. That index is then deleted.</li>
                      </ul>
                  </div>
                  <div class="ui grid">
                      <div :class="actionable" class="center aligned sixteen wide column" v-if="maps[subsrc]['inspect_mapping'] && !maps[subsrc]['inspect_mapping']['errors'] && !maps[subsrc]['inspect_mapping']['pre-mapping']">
                          <button class="ui labeled mini icon button"
                              v-on:click="diffMapping('tab_mapping_inspected','tab_mapping_registered',subsrc)">
                              <i class="exchange icon"></i>
                              Diff
                          </button>
                      </div>
                      <div class="eight wide column">
                          <mapping-map v-if="maps[subsrc]"
                              v-bind:entity="'source'"
                              v-bind:map="maps[subsrc]['inspect_mapping']"
                              v-bind:name="subsrc"
                              v-bind:map_origin="'inspect'"
                              v-bind:map_id="'tab_mapping_inspected'"
                              v-bind:read_only="maps[subsrc]['inspect_mapping'] && maps[subsrc]['inspect_mapping']['pre-mapping']"
                              v-bind:can_commit="maps[subsrc]['registered_mapping'] ? maps[subsrc]['registered_mapping']['origin'] != 'uploader' : true">
                          </mapping-map>
                      </div>
                      <div class="eight wide column">
                          <mapping-map v-bind:map="maps[subsrc]['registered_mapping']['mapping']"
                              v-bind:entity="'source'"
                              v-bind:name="subsrc"
                              v-bind:map_origin="'master'"
                              v-bind:map_id="'tab_mapping_registered'"
                              v-bind:read_only="maps[subsrc]['registered_mapping'] && maps[subsrc]['registered_mapping']['origin'] == 'uploader'"
                              v-bind:can_commit="maps[subsrc]['registered_mapping'] ? maps[subsrc]['registered_mapping']['origin'] != 'uploader' : true"
                              v-if="maps[subsrc]['registered_mapping']">
                          </mapping-map>
                      </div>
                  </div>
                </div>

                <!-- Inspection for Type Stats mode -->
                <div class="ui tab" :data-tab="subsrc + '-type-stats'">
                  <p>
                    This is the field type and stats for source <b>{{subsrc}}</b>.
                  </p>
                  <p>
                    It provides a summary of the source's structure,
                    including: a map of all types involved in the data;
                    basic statistics, showing how volumetry fits over data structure.
                  </p>
                  <p>The basic statistics include these fields:</p>
                  <div class="ui bulleted list">
                    <div class="item">_count: Total records</div>
                    <div class="item">_max: Maximum value</div>
                    <div class="item">_min: Minimum value</div>
                    <div class="item">_none: number of records have no value</div>
                  </div>

                  <div v-if="inspection_data_flatten[subsrc]">
                    <p v-if="hasInspectionValidationWarnings(inspection_data_validation[subsrc])" class="text red">
                      There are some problems with field names
                    </p>

                    <table class="ui celled striped table sortable">
                      <thead>
                        <tr>
                          <th class="four wide">Field</th>
                          <th class="one wide">Type</th>
                          <th class="three wide">Stats</th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr v-for="row in inspection_data_flatten[subsrc]">
                          <td>
                            <div v-if="hasInspectionFieldValidationWarnings(inspection_data_validation[subsrc][row.field])"
                              class="text red tooltip"
                              data-position="top left"
                              data-variation="very wide"
                              :data-html="formatTooltipMessage(inspection_data_validation[subsrc][row.field]['messages'])"
                            >
                              {{ row.field }}
                            </div>
                            <div v-else>{{ row.field }}</div>
                          </td>
                          <td>{{ row.type }}</td>
                          <td>
                            <div class="ui grid">
                              <div class="row" v-for="data, field in row.stats">
                                <div class="six wide column">{{ field }}</div>
                                <div class="six wide column">{{ data }}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p v-else>
                    There is no types & stats results, please run "inpect data" with "type" and/or "stats" options.
                  </p>
                </div>
            </div>
        </span>
        <div v-else>
            No mapping data found for this source.
        </div>
    </span>

</template>

<script>
import axios from 'axios'
import Loader from './Loader.vue'
import Actionable from './Actionable.vue'
import MappingMap from './MappingMap.vue'
import DiffUtils from './DiffUtils.vue'
import InspectForm from './InspectForm.vue'
import { flattenInspectionData, validateInspectionData } from './utils/utils.js'
import './tablesort.js'


export default {
  name: 'data-source-mapping',
  props: ['_id', 'maps', 'source'],
  mixins: [DiffUtils, Loader, Actionable],
  mounted () {
    this.setup()
    // $('#maps .item:first').addClass('active');
    // $('.tab:first').addClass('active');
  },
  components: { MappingMap, InspectForm },
  computed: {
    inspection_data_flatten: function () {
      const data = {}
      Object.entries(this.maps).forEach(([subsrc, subsrc_data]) => {
        const inspection_data = subsrc_data['inspect_stats'] || subsrc_data['inspect_type'] || {}
        if (inspection_data && Object.keys(inspection_data).length > 0) {
          data[subsrc] = flattenInspectionData(inspection_data)
        }
        else {
          data[subsrc] = null
        }
      })
      return data
    },
    inspection_data_validation: function () {
      const data = {}
      Object.entries(this.inspection_data_flatten).forEach(([subsrc, flattened_data]) => {
        data[subsrc] = validateInspectionData(flattened_data)
      })
      return data
    }
  },
  watch: {
    maps: function (newv, oldv) {
      if (newv != oldv) {
        // there's a race condition here: if multiple mappings updated in very little time,
        // not all tabs will be setup properly (some could be ignored depending on the time
        // spent to set it up and the events telling us they have changed)
        this.setup() // refresh tabs
      }
    }
  },
  methods: {
    setup: function () {
      $('.menu .item').tab()
      $("table.sortable").tablesort()
      $(".tooltip").popup()
    },
    is_broken: function (subsrc) {
      try {
        if (!this.source.upload.sources.hasOwnProperty(subsrc) ||
                    this.source.upload.sources[subsrc].uploader === null) {
          return true
        }
      } catch (e) {
        return false
      }
    },
    reset: function (subsrc) {
      var self = this
      self.loading()
      var data = {
        name: self.source._id,
        key: 'inspect',
        subkey: subsrc
      }
      axios.post(axios.defaults.baseURL + `/source/${self.source._id}/reset`, data)
        .then(response => {
          self.loaded()
        })
        .catch(err => {
          self.loaderror(err)
        })
    },
    hasInspectionFieldValidationWarnings: function (field_validation) {
      return field_validation.messages.size > 0
    },
    hasInspectionValidationWarnings: function (inspection_data) {
      // the validation messages is a Set object
      for (const field in inspection_data) {        
        if (this.hasInspectionFieldValidationWarnings(inspection_data[field])) {
          return true
        }
      }
      return false
    },
    formatTooltipMessage: function (messages) {
      const tooltip_message = []
      for (const message of messages) {
        tooltip_message.push(`<li>${message}</li>`)
      }
      return `<ul class="ui list">${tooltip_message.join('')}</ul>`
    }
  }
}
</script>

<style scoped>
.reset.button {
    font-size: 0.5em !important;
    margin-left: 1em !important;
}
.reset > i {
    margin: 0em !important;
}

.sortable .grid {
  margin: 0;
}

.sortable .row {
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
  border: 1px solid rgba(34,36,38,.1);
}

.sortable .column {
  padding-top: 0;
  padding-bottom: 0;
}
</style>
