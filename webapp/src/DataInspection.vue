<template>

  <div class="ui tab" :data-tab="source_name + '-type-stats'">
    <p>
      This is the field type and stats for <b>{{ page_type }}</b>.
    </p>
    <p>
      It provides a summary of the data structure,
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

    <div v-if="inspection_data">
      <p v-if="hasInspectionValidationWarnings(inspection_data)">
        <span class="ui text warning">There are some problems with field names</span>
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
          <tr v-for="row in inspection_data">
            <td>
              <div v-if="hasInspectionFieldValidationWarnings(row)" class="tooltip" data-position="top left"
                data-variation="very wide" :data-html="formatInspectionValidationTooltipMessage(row.warnings)">
                <span class="ui text warning">{{ row.field_name }} <i class="exclamation circle icon"></i></span>
              </div>
              <div v-else>{{ row.field_name }}</div>
            </td>
            <td>{{ row.field_type }}</td>
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

</template>

<script>

import axios from 'axios'

export default {
  name: 'data-inspection',
  props: [
    'page_type',
    'main_source_name',
    'source_name',
    'source_data',
  ],
  mounted() {
    this.fetch_flatten_inspection_data()
  },
  data() {
    return {
      inspection_data: [],
    }
  },
  watch: {
    source_data: function (newv, oldv) {
      if (newv != oldv) {
        this.fetch_flatten_inspection_data()
      }
    },
  },
  methods: {
    fetch_flatten_inspection_data: function () {
      const self = this
      let data = {}
      if (self.page_type == "datasource") {
        data.data_provider = ["src", self.main_source_name]
      }
      else {
        data.data_provider = self.main_source_name
      }

      axios.put(axios.defaults.baseURL + '/flatten_inspection_data', data)
        .then(response => {
          // console.log(response.data.result)
          if (response.data.result?.[self.source_name]) {
            const inspection_data_by_modes = response.data.result[self.source_name]
            self.inspection_data = inspection_data_by_modes.type || []
            if (Object.keys(inspection_data_by_modes.stats).length > 1) {
              self.inspection_data = inspection_data_by_modes.stats
            }
          }
          else {
            self.inspection_data = []
          }
          setTimeout(() => { $('.tooltip').popup() }, 0)
        })
        .catch(err => {
          console.log('Error fetching flatten inspection data: ' + err)
        })
    },
    hasInspectionFieldValidationWarnings: function (field_inspection) {
      return field_inspection.warnings.length > 0
    },
    hasInspectionValidationWarnings: function (inspection_data) {
      for (const field_inspection of inspection_data) {
        if (this.hasInspectionFieldValidationWarnings(field_inspection)) {
          return true
        }
      }
      return false
    },
    formatInspectionValidationTooltipMessage: function (warnings) {
      const tooltip_message = []
      for (const warning of warnings) {
        tooltip_message.push(`<li>${warning.code}: ${warning.message}</li>`)
      }
      return `<ul class="ui list">${tooltip_message.join('')}</ul>`
    }
  }
}
</script>

<style scoped>
.sortable .grid {
  margin: 0;
}

.sortable .row {
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
  border: 1px solid rgba(34, 36, 38, .1);
}

.sortable .column {
  padding-top: 0;
  padding-bottom: 0;
}
</style>
