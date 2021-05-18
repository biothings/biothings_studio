<template>
    <div class="pusher main-background" style="min-height:100vh">
        <div class="ui container" style="margin:10px;">
          <div class="ui big message flex-center clearMenu m-0" :class="actionable">
              <h1 class="ui olive header">Releases</h1>
              <button class="ui circular button" style="margin-left:20px;" @click="wizard()">
                  <i class="magic icon"></i>
                  Setup
              </button>
            </div>
        </div>
        <div class="ui grid container" v-if="version_urls.length">
            <div class="three wide column">
                <div class="releases-subcont">
                  <h4 class="m-0">Sources</h4>
                  <div class="ui grey inverted vertical fluid tabular standalone menu releases-cont color-scroll word-wrap">
                    <a 
                      :data-tab="src.name" 
                      v-for="(src,i) in version_urls" 
                      :class="['item', selected && selected.name === src.name ? 'active' : '']" 
                      :key="i+'e'" 
                      @click="changeTab(src.name); selected = src"
                      :data-tooltip="src.name.length > 20 ? src.name : false" data-position="top right">
                        <i v-if="selected && selected.name === src.name" class="olive circle icon"></i>&nbsp;{{src.name.length > 20 ? src.name.slice(0,20)+'...' : src.name}}
                    </a>
                </div>
                </div>
            </div>
            <div class="thirteen wide stretched column">
                <!-- <div :class="['ui bottom attached tab srctab segment', i === 0 ? 'active' : '']" :data-tab="src.name" v-for="(src,i) in version_urls" :key="i+'p'">
                    <standalone-release v-bind:name="src.name" v-bind:url="src.url"></standalone-release>
                </div> -->
                <div class='ui bottom attached segment' v-if="selected && selected.name">
                    <standalone-release v-bind:name="selected.name" v-bind:url="selected.url" :key="selected.name"></standalone-release>
                </div>
                <h5 class="center align" v-else>Click on a source to load releases.</h5>
            </div>
        </div>

        <div class="ui basic inverted wizard modal">
            <standalone-wizard></standalone-wizard>
            <div class="ui right aligned segment">
                <div class="actions">
                    <div class="ui grey ok button">
                        <i class="remove icon"></i>
                        Close
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import axios from 'axios'
import Loader from './Loader.vue'
import Actionable from './Actionable.vue'
import StandaloneRelease from './StandaloneRelease.vue'
import StandaloneWizard from './StandaloneWizard.vue'

export default {
  name: 'standalone-releases',
  mixins: [Loader, Actionable],
  mounted () {
    $('select.dropdown').dropdown()
    this.refresh()
    $('.menu .standalone .item').tab()
  },
  beforeDestroy () {
    this.version_urls = []
    $('.ui.wizard.modal').remove()
  },
  data () {
    return {
      version_urls: [],
      selected: {}
    }
  },
  components: { StandaloneRelease, StandaloneWizard },
  methods: {
    refresh: function () {
      var self = this
      this.version_urls = [] // reinit to force components to be rebuilt
      this.loading()
      axios.get(axios.defaults.baseURL + '/standalone/list')
        .then(response => {
          self.version_urls = response.data.result
          // console.log('ALL', self.version_urls)
          self.loaded()
          if (!self.version_urls.length) {
            self.wizard()
          }
        })
        .catch(err => {
          console.log('Error getting list of biothings version_urls: ' + err)
          self.loaderror(err)
        })
    },
    changeTab: function (tabname) {
      // semantic w/ jquery sometimes is confused with tab init and doesn't react
      // we'll do that ourself...
      $('.ui.standalone.menu').find('.item').tab('change tab', tabname)
    },
    wizard: function () {
      $('.ui.wizard.modal')
        .modal('setting', {
          detachable: false,
          closable: false,
          onApprove: function () {
            return true
          }
        })
        .modal('show')
    }
  }
}
</script>

<style scoped>
.ui.sidebar {
    overflow: visible !important;
}
.srctab {
	border-color:rgb(212, 212, 213) !important;
	border-style:solid !important;
	border-width:1px !important;
	border-radius: 0px !important;
}
.releases-cont{
  min-height: 60vh;
  max-height: 60vh;
  border-radius: 5px;
  overflow-y: scroll;
  overflow-x: hidden;
}
.releases-subcont{
    background: #4e4b4b;
    padding: 15px;
    border-radius: 10px;
    color: #969696;
}
</style>
