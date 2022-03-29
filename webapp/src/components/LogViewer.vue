<template>
    <div>
        <div class="flex justify-center">
            <button class="ui button mini circular" :class="[show?'black':'blue']" @click="show = !show">
                {{show ? 'Close' : 'View Logs'}}
            </button>
            <button v-if="show" class="ui icon button mini circular" @click="getLogs(true)">
                <i class="redo icon"></i>
            </button>
        </div>
        <div v-if="show">
            <h3 class="flex justify-between">
                <div>
                    <span class="pr-1">View log:</span>
                    <span v-if="availabelLogNames.length == 0">NOT AVAILABLE</span>
                    <select class="dropdown select-log-name" v-model="selectedLogName" v-if="availabelLogNames.length > 0">
                        <option
                            v-for="availabelLogName in availabelLogNames"
                            v-bind:key="availabelLogName"
                            :value="availabelLogName"
                        >
                            {{availabelLogName}}
                        </option>
                    </select>
                </div>
                <button class="ui mini button circular m-0" @click="expand"><i class="expand icon m-0"></i></button>
            </h3>
            <div class="ui log message">
                <p v-for="(log,i) in logs" :key="i+'_log'" class="m-0" :style="{color: getColor(log)}">
                    <small><b>{{log}}</b></small>
                </p>
            </div>
        </div>
        <div class="ui large modal logs" id="logs-modal">
            <i class="close icon"></i>
            <div class="header">
                {{logName}}
            </div>
            <div class="content">
                <div class="ui log log-message">
                    <p v-for="(log,i) in logs" :key="i+'_log'" class="m-0">
                        <small><b>{{log}}</b></small>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {mapGetters} from 'vuex';
import axios from 'axios';

export default {
    name: 'LogViewer',
    data: function(){
        return {
            show: false,
            availabelLogNames: [],
            selectedLogName: '',
        }
    },
    props:{
        item:{
            type: Object,
            default: ()=>{ return {}}
        },
        date:{
            type: String,
            default: ''
        },
        type:{
            type: String,
            default: '',
            required: true
        }
    },
    computed:{
        ...mapGetters({
            logs: 'logs',
            logName: 'logName'
        }),
    },
    watch:{
        show: function(v){
            if(v){
                this.getLogs()
            }
        },
        selectedLogName: function(v) {
            this.getLogs()
        }
    },
    methods:{
        expand(){
            $('#logs-modal').modal('show');
        },
        getAvailabelLogNames(){
            this.availabelLogNames = []

            let targetName = this.item.name
            if (this.type === "build") {
                targetName = this.item.target_name
            }

            axios
            .get(axios.defaults.baseURL + `/logs/?json&filter=${this.type}_${targetName}`)
            .then(res => {
                if (res.data.length == 0) {
                    console.log(`%c 🔖 No available -${this.type}- logs for <${targetName}>`, 'color:coral')
                    this.$store.commit('saveLogs', {logs: [`😿 [NOT AVAILABLE] No -${this.type}- logs for <${targetName}>`]})
                    return
                }
                this.availabelLogNames = [res.data[0]]
                this.availabelLogNames = this.availabelLogNames.concat(res.data.slice(1).sort().reverse())
                this.selectedLogName = this.availabelLogNames.length ? this.availabelLogNames[0] : ''
            })
            .catch(err => {
                console.log(`%c 🔖 Cannot fetch available log names, due to ${err}`, 'color:coral')
            });
        },
        getLogs(reload=false){
            if (reload || !this.availabelLogNames || this.availabelLogNames.length == 0) {
                this.getAvailabelLogNames()
            }

            let fileName = this.selectedLogName
            if (fileName && this.type !== undefined) {
                this.$store.dispatch('getLogsFor',
                    {
                        fileName: fileName,
                        type: this.type,
                    });
            }
        },
        getColor(line){
            return line.includes('INFO') ? 'royalblue' :
            line.includes('OK') ? 'green' : 
            line.includes('DEBUG') ? 'purple' : 
            line.includes('ERROR') ? 'red' : 
            line.includes('NOT AVAILABLE') ? 'hotpink' : 
            'black'
        },
    }
}
</script>

<style>
.log.message{
    font-family: sans-serif;
    word-break: break-all;
    max-height: 300px;
    overflow-y: scroll;
    border: 4px #c9c9c9 solid;
}
</style>