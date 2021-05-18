<template>
    <div class="ui container flex-wrap">
        <div class="item">
            <ChooseHub></ChooseHub>
            <span v-if="readonly_switch !== null">
                <div class="ui middle aligned mini" data-tooltip="Toggle read-only mode" data-position="bottom left">
                    <i class="clickicon icon" :class="readonly_mode ? 'red lock': 'unlock'" @click="switchReadOnly"></i>
                </div>
            </span>
            <span v-else>
                <div class="ui middle aligned mini"  data-tooltip="Hub is read-only" data-position="bottom left">
                    <i class="lock icon" :class="readonly_mode ? 'red': ''"></i>
                </div>
            </span>
        </div>
        <div class="item">
            <Loader></Loader>
            <img class="m-0" :src="icon || default_icon" id="conn" :data-html="
            '<div style=\'width:30em;\'><table>'+
            '<tr><td colspan=\'2\'><h2 style=\'color:#0E6EB8;\'>' + conn.name + '</h2></td></tr>' +
            '<tr><td><b>Connection</b></td><td><a>' + conn.url + '</a></td></tr>' +
            '<tr><td><b>App Version</b></td><td>' + str_app_version +'</td></tr>' +
            '<tr><td><b>BioThings Version</b></td><td>' + str_biothings_version +'</td></tr>' +
            '<tr><td><b>Features</b></td><td><small>' + studio_features +'</small></td></tr>' +
            '</table></div>'
            " data-position="bottom center">
        </div>
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
</template>

<script>
import JobSummary from '../JobSummary.vue'
import EventMessages from '../EventMessages.vue'
import Loader from '../Loader.vue'
import ChooseHub from '../ChooseHub.vue'
//store
import {mapGetters} from 'vuex';
//mixins
import {has_feature} from '../mixins/has_feature'

export default {
    name: 'NavBar',
    data: function(){
        return{
            default_icon: '../assets/biothings-studio-color.svg',
        }
    },
    components:{
        JobSummary,
        EventMessages,
        Loader,
        ChooseHub
    },
    mixins: [has_feature],
    props:[
        'menu',
        'current_studio_version',
        'readonly_switch',
        'readonly_mode',
        'switchReadOnly',
    ],
    computed: {
        ...mapGetters({
            str_app_version: 'str_app_version',
            str_biothings_version: 'str_biothings_version',
            studio_features: 'studio_features',
            icon: 'icon',
            conn: 'conn'
        }),
    },
    mounted:function(){
        $('#conn').popup({on: 'hover'});
    }
}
</script>

<style>
.light-grey{
    background-color:#aaa9a9 !important;
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
.flex-center{
    display: flex;
    justify-content: start;
    align-items: center;
}
.justify-center{
    justify-content: center !important;
}
.flex{
    display: flex;
}
.justify-around{
    justify-content: space-around;
}
.justify-between{
    justify-content: space-between;
}
.justify-start{
    justify-content: start;
}
.justify-evenly{
    justify-content: space-evenly;
}
.flex-wrap{
    flex-wrap: wrap;
}
.flex-end{
    justify-content: flex-end;
}
.clearMenu{
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
}
.ui.card:hover{
    box-shadow: 0px 0px 12px rgb(165, 165, 165);
}
.m-auto{
    margin: auto;
}
</style>