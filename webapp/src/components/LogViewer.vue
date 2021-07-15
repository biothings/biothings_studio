<template>
    <div>
        <div class="flex justify-center">
            <button class="ui button mini circular" :class="[show?'black':'blue']" @click="show = !show">
                {{show ? 'Close' : 'View Logs'}}
            </button>
            <button v-if="show" class="ui icon button mini circular" @click="getLogs">
                <i class="redo icon"></i>
            </button>
        </div>
        <div v-if="show">
            <h3>{{logName}}</h3>
            <div class="ui log message">
                <div style="display: flex;justify-content: flex-end;">
                    <button class="ui mini button circular m-0" @click="expand"><i class="expand icon m-0"></i></button>
                </div>
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

export default {
    name: 'LogViewer',
    data: function(){
        return {
            show: false
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
                this.getLogs();
            }
        },
    },
    methods:{
        expand(){
            $('#logs-modal').modal('show');
        },
        getLogs(){
            //build names are different and need to be cleaned up
            if (this.type == 'build' && !Object.prototype.hasOwnProperty.call(this.item, "name")) {
                //covid_who_clinical_trials_202105270830_udmfle16
                let name = this.item.target_name.split('_')
                name.splice(-2, 2)
                name = name.length > 1 ? name.join('_') : name[0]
                this.item.name = name
            }
            if (Object.prototype.hasOwnProperty.call(this.item, "name") && this.type !== undefined) {
                this.$store.dispatch('getLogsFor',
                    {
                        item: this.item,
                        date: this.date,
                        type: this.type
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