<template>
    <div id="apilogviewer" class="ui inverted segment" style="overflow-y: auto; font-family: JetBrains Mono">
        <table class="ui single line super compact inverted table" v-if="records.length">
            <tbody>
                <div class="log-entry" v-for="(record, i) in records" :key="i + 'r'">
                    <div @click="toggleLog(record.id)" class="toggle-logs-button">
                        <span class="log-timestamp">{{ formatTimestamp(record.ts) }}</span>
                        <span style="white-space: pre;" :class="getLogColor(record.msg)">{{
            record.msg }}</span>
                    </div>
                    <div v-if="record.isExpanded" class="collapsed-log">
                        {{ record.detailedMsg }}
                    </div>
                </div>
                <!-- empty record to move real ones above scrollbar -->
                <log-record v-bind:record="{ 'msg': '', 'logger': '', 'ts': '', 'level': '' }"></log-record>
            </tbody>
        </table>
        <div v-else>
            No logs yet...
        </div>
    </div>
</template>

<script>
import bus from './bus.js'
import LogRecord from './LogRecord.vue'

// TODO: this could be a setup in the app
const MAX_RECORDS = 1000

export default {
    name: 'api-log-viewer',
    components: { LogRecord },
    created() {
        bus.$on('clearApiLogs', () => this.records = [])
        bus.$on('log', this.onLog)
        bus.$on('ws_connected', this.onWSConnected)
    },
    beforeDestroy() {
        bus.$off('clearApiLogs', () => this.records = [])
        bus.$off('log', this.onLog)
        bus.$off('ws_connected', this.onWSConnected)
    },
    data() {
        return {
            records: [],
            ws_connected: false
        }
    },
    methods: {
        onLog(record) {
            if (record.logger === 'apimanager') {
                if (!record.msg.includes('%')) {
                    this.records.push(record);
                    bus.$emit('apiLogAdded');
                    while (this.records.length > MAX_RECORDS) {
                        this.records.shift();
                    }
                    var d = $('#apilogviewer');
                    d.scrollTop(d.prop('scrollHeight'));

                    // Check for end of test
                    if (record.msg.includes("Finished running pytests for")) {
                        bus.$emit('testFinished');
                    }
                }
            }
        },
        getLogColor(message) {
            if (message.includes('PASSED')) {
                return 'log-passed';
            } else if (message.includes('FAILED') || message.includes("FAILURES")) {
                return 'log-failed';
            } else if (message.includes('SKIPPED') || message.includes('warnings summary')) {
                return 'log-skipped';
            } else if (message.includes('short test summary info') || message.includes('________________________')) {
                return 'log-blue';
            } else {
                return '';
            }
        },
        onWSConnected(state) {
            this.ws_connected = state
        },
        toggleLog(id) {
            const record = this.records.find(r => r.id === id);
            if (record) {
                record.isExpanded = !record.isExpanded;
            }
        },
        formatTimestamp(timestamp) {
            return new Date(timestamp).toLocaleTimeString();
        },
    },
}
</script>

<style>
/* table .nowrap {
    white-space: pre;
}

.ui[class*="super compact"].table td {
    padding: 0.1em .6em !important;
} */



/* Adjust padding for a more compact display */
/* .ui[class*="super compact"].table td {
    padding: 0.4em 0.6em !important;
} */

/* Style for timestamp and message for a more compact display */
.log-timestamp,
.log-message {
    display: inline-block;
    margin-right: 10px;
}

/* Style for the collapsible button */
/* .toggle-logs-button { */
/* cursor: pointer; */
/* font-size: 0.75rem; Matching the smaller text size */
/* color: #4183c4; A clickable color indication */
/* } */

/* Collapsed log messages */
.collapsed-log {
    display: none;
    /* Hide the detailed logs initially */
}

.log-passed {
    color: #009B72;
}

.log-failed {
    color: #BB8588;
}

.log-skipped {
    color: #D6CE93;
}

.log-blue {
    color: #8ACDEA;
}

.api-log {
    font-family: 'JetBrains Mono', sans-serif;
}
</style>
