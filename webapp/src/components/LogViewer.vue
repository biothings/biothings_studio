<template>
    <div>
        <div class="flex justify-center">
            <button class="ui button mini circular" :class="[show?'black':'blue']" @click="show = !show">
                <i class="tasks icon"></i> {{show ? 'Close' : 'View Logs'}}
            </button>
            <button v-if="show" class="ui icon button mini circular" @click="getLogs">
                <i class="redo icon"></i>
            </button>
        </div>
        <div v-if="show">
            <h3>{{logName}}</h3>
            <div class="ui log message">
                <p v-for="(log,i) in logs" :key="i+'_log'" class="m-0" :style="{color: getColor(log)}">
                    <small>{{log}}</small>
                </p>
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
        getLogs(){
            //build names are different and need to be cleaned up
            if (this.type == 'build' && !'name' in this.item) {
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
            line.includes('DEBUG') ? 'purple' : 
            line.includes('ERROR') ? 'red' : 
            'white'
        },
    }
}
</script>

<style>
.log.message{
    font-family: sans-serif;
    max-height: 300px;
    overflow: scroll;
    border: 4px #c9c9c9 solid;
}
</style>