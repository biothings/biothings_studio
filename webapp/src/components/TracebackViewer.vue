<template>
    <div>
        <div class="flex justify-center">
            <button class="ui button mini circular" :class="[show?'black':'orange']" @click="show = !show">
                {{show ? 'Close' : 'View Traceback'}}
            </button>
        </div>
        <div v-if="show">
            <div class="ui log error-message">
                <p v-for="(log,i) in logs" :key="i+'_log'" class="m-0">
                    <small><b>{{log}}</b></small>
                </p>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    name: 'TracebackViewer',
    data: function(){
        return {
            show: false,
            logs:[]
        }
    },
    props:{
        source:{
            type: Object,
            default: ()=>{ return {}}
        },
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
            let lines = this.findVal(this.source, 'traceback')
            this.logs = lines ? lines.split("\n") : ['Could not find traceback of error']
        },
        findVal(object, key) {
            var value;
            let self = this;
            Object.keys(object).some(function(k) {
                if (k === key) {
                    value = object[k];
                    return true;
                }
                if (object[k] && typeof object[k] === 'object') {
                    value = self.findVal(object[k], key);
                    return value !== undefined;
                }
            });
            return value;
        }
    }
}
</script>

<style>
.log.error-message{
    font-family: sans-serif;
    word-break: break-all;
    max-height: 300px;
    overflow-y: scroll;
    border: 4px #c45555 solid;
    color: rgb(139, 3, 3);
    padding: 5px;
}
</style>