<template>
    <div id="apilogviewer" class="ui inverted segment" style="overflow-y: auto;">
        <div style="position: absolute; top: 2px; right: 2px; cursor: pointer;">
            <i class="red large close icon" @click="$emit('close')"></i>
        </div>
        <table class="ui single line super compact inverted table" v-if="records.length">
            <tbody>
                <div class="log-entry" v-for="(record, i) in records" :key="i + 'r'">
                    <div @click="toggleLog(record.id)" class="toggle-logs-button">
                        <span class="log-timestamp">{{ formatTimestamp(record.ts) }}</span>
                        <span :class="`log-level-${record.level}`">{{ record.msg | truncate }}</span>
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
        bus.$on('log', this.onLog)
        bus.$on('ws_connected', this.onWSConnected)
    },
    beforeDestroy() {
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
            // Example: Only push logs from apimanager
            if (record.logger === 'apimanager') {
                this.records.push(record);
                while (this.records.length > MAX_RECORDS) {
                    this.records.shift();
                }
                var d = $('#apilogviewer');
                d.scrollTop(d.prop('scrollHeight'));
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
            // Format your timestamp as needed
            return new Date(timestamp).toLocaleTimeString();
        }
    },
    filters: {
        truncate(value, length = 50) {
            return value.length > length ? value.substring(0, length) + '…' : value;
        }
    }
}
</script>

<style>
table .nowrap {
    white-space: nowrap;
}

.ui[class*="super compact"].table td {
    padding: 0.1em .6em !important;
}


#apilogviewer {
    /* ...existing styles... */
    font-size: 0.75rem;
    /* Smaller text */
}

/* Adjust padding for a more compact display */
.ui[class*="super compact"].table td {
    padding: 0.4em 0.6em !important;
}

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

/* Color coding for log levels */
.log-level-info {
    color: #2c662d;
}

.log-level-error {
    color: #9f3a38;
}

/* ...other styles... */
</style>
