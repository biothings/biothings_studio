<template>
    <!-- <div class="ui inverted pointing menu br-0 m-0"> -->
        <div class="ui container">
            <router-link :to="mitem['path']" class="item" style="padding: .5rem 1rem;" v-for="mitem in menu" v-bind:key="mitem.name" exact>
                {{ mitem['name'] }}
            </router-link>
            <div class="item p-1">
                <event-messages></event-messages>
            </div>
            <div class="ui item mini grey inverted jobs right p-1" v-if="has_feature('job')">
                <job-summary></job-summary>
            </div>
        </div>
    <!-- </div> -->
</template>

<script>
import JobSummary from '../JobSummary.vue'
import EventMessages from '../EventMessages.vue'
import {has_feature} from '../mixins/has_feature'

export default {
    name: 'NavBar',
    components:{
        JobSummary,
        EventMessages
    },
    mixins: [has_feature],
    props:[
        'menu',
    ],
}
</script>

<style>
.light-grey{
    background-color:#eeeeee !important;
}
.button:hover{
    background-color: #209bcc !important;
    color:white !important
}
.delete-btn:hover{
    background-color: rgb(255, 106, 80) !important;
    color:white !important
}
.br-0{
    border-radius: 0px !important;
}
.m-0{
    margin: 0px !important;
}
.p-1{
    padding: .5rem !important;
}
.pusher{
    min-height:90vh !important;
}
</style>