<template>
    <div style="display:inline-block; margin-left:5px;">
        <div class="flex justify-center">
            <button class="ui orange button mini circular" @click="getLogs">
                View Traceback
            </button>
        </div>
        <div class="ui large modal traceback">
            <i class="close icon"></i>
            <div class="content">
                <div class="ui log error-message">
                    <p v-for="(log,i) in logs" :key="i+'_traceback'" class="m-0">
                        <small><b>{{log}}</b></small>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    name: 'TracebackViewer',
    data: function(){
        return {
            logs:[]
        }
    },
    props:{
        source:{
            type: Object,
            default: ()=>{ return {}}
        },
    },
    methods:{
        getLogs(){
            let lines = this.findVal(this.source, 'traceback')
            this.logs = lines ? lines.split("\n") : ['Could not find traceback of error']
            $('.ui.large.modal.traceback').modal('show');
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
    border: 2px #e48b8b solid;
    border-radius: 4px;
    margin-top: 10px;
    color: rgb(139, 3, 3);
    padding: 5px;
}
.log.error-message p:nth-child(odd){
    background-color: rgb(243, 243, 243);
}
</style>