<template>
    <div style="display:flex; justify-content: center;">
        <div class="flex justify-center">
            <button class="ui orange button mini circular" @click="getLogs">
                View Traceback
            </button>
        </div>
        <div class="ui large modal traceback" id="traceback">
            <i class="close icon"></i>
            <div class="content font-jetbrains-mono line-height-1">
                <div class="ui log error-message m-0">
                    <code>
                        <p v-for="(log,i) in logs" :key="i+'_traceback'" class="m-0">
                            <pre class="m-0"><small>{{log}}</small></pre>
                        </p>
                    </code>
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
            $('#traceback').modal('show');
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
    font-weight: bold;
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

#traceback code, #traceback pre {
    font-family: 'JetBrains Mono', sans-serif;
}
</style>
