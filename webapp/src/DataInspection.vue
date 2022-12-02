<template>

  <div class="ui tab" :data-tab="source_name + '-type-stats'">
    <p>
      This is the field type and stats for <b>{{source_name}}</b>.
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

    <div v-if="inspection_data_flatten">
      <p v-if="hasInspectionValidationWarnings(inspection_data_validation)">
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
          <tr v-for="row in inspection_data_flatten">
            <td>
              <div v-if="hasInspectionFieldValidationWarnings(inspection_data_validation[row.field])"
                class="tooltip"
                data-position="top left"
                data-variation="very wide"
                :data-html="formatInspectionValidationTooltipMessage(inspection_data_validation[row.field]['messages'])"
              >
                <span class="ui text warning">{{ row.field }} <i class="exclamation circle icon"></i></span>
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

</template>

<script>

import { flattenInspectionData, validateInspectionData } from './utils/utils.js'


export default {
  name: 'data-inspection',
  props: ['page_type', 'source_name', 'source_data'],
  mounted () {
    $('.tooltip').popup()
  },
  computed: {
    inspection_data_flatten: function () {
      const inspection_data = this.source_data['inspect_stats'] || this.source_data['inspect_type'] || {}
      return flattenInspectionData(inspection_data)
    },
    inspection_data_validation: function () {
      return validateInspectionData(this.inspection_data_flatten)
    }
  },
  methods: {
    hasInspectionFieldValidationWarnings: function (field_validation) {
      // the validation messages is a Set object
      return field_validation.messages.size > 0
    },
    hasInspectionValidationWarnings: function (inspection_data) {
      for (const field in inspection_data) {        
        if (this.hasInspectionFieldValidationWarnings(inspection_data[field])) {
          return true
        }
      }
      return false
    },
    formatInspectionValidationTooltipMessage: function (messages) {
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
