<template>
    <div id="logviewer" class="ui inverted segment" style="overflow-y: auto; width: 800px; max-height: 500px; max-width: 85vw;">
        <table class="ui single line super compact inverted table" v-if="records.length">
            <tbody>
                <log-record v-for="(record, i) of records" v-bind:record="record" :key="i+'r'"></log-record>
                <!-- empty record to move real ones above scrollbar -->
                <log-record v-bind:record="{'msg':'','logger':'','ts':'','level':''}"></log-record>
            </tbody>
        </table>
        <div v-else>
            No logs yet...
        </div>
        <div v-if="!ws_connected" class="ui small orange label">
            WebSockect disconnected, can't receive logs
        </div>
    </div>
</template>

<script>
import bus from './bus.js'
import LogRecord from './LogRecord.vue'

// TODO: this could be a setup in the app
const MAX_RECORDS = 1000

export default {
  name: 'log-viewer',
  components: { LogRecord },
  created () {
    bus.$on('log', this.onLog)
    bus.$on('ws_connected', this.onWSConnected)
  },
  beforeDestroy () {
    bus.$off('log', this.onLog)
    bus.$off('ws_connected', this.onWSConnected)
  },
  data () {
    return {
      records: [],
      ws_connected: false
    }
  },
  methods: {
    onLog (record) {
      this.records.push(record)
      while (this.records.length > MAX_RECORDS) {
        this.records.shift()
      }
      var d = $('#logviewer')
      d.scrollTop(d.prop('scrollHeight'))
    },
    onWSConnected (state) {
      this.ws_connected = state
    }
  }
}
</script>

<style>
table .nowrap {
        white-space:  nowrap;
    }
    .ui[class*="super compact"].table td {
        padding: 0.1em .6em !important;
    }

</style>
