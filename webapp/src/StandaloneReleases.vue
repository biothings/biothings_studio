<template>
    <div class="main-background" style="min-height:100vh">

        <div class="ui container" style="margin:10px;">
          <div class="ui big message flex-center" :class="actionable">
              <h1 class="ui teal header">Releases</h1>
              <button class="ui button" style="margin-left:20px;" @click="wizard()">
                  <i class="magic icon"></i>
                  Setup
              </button>
          </div>
        </div>
        <div class="ui grid" v-if="version_urls.length">
            <div class="three wide column">
                <div class="ui grey inverted vertical fluid tabular standalone menu releases-cont color-scroll word-wrap">
                    <a 
                      :class="['item', i === 0 ? 'active' : '']" 
                      :data-tab="src.name" 
                      v-for="(src,i) in version_urls" 
                      :key="i+'e'" 
                      @click="changeTab(src.name)"
                      :data-tooltip="src.name.length > 20 ? src.name : false" data-position="top right">
                        {{src.name.length > 20 ? src.name.slice(0,20)+'...' : src.name}}
                    </a>
                </div>
            </div>
            <div class="eleven wide stretched column">
                <div :class="['ui bottom attached tab srctab segment', i === 0 ? 'active' : '']" :data-tab="src.name" v-for="(src,i) in version_urls" :key="i+'p'">
                    <standalone-release v-bind:name="src.name" v-bind:url="src.url"></standalone-release>
                </div>
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
      version_urls: []
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
  max-height: 500px;
  border-radius: 5px;
  overflow-y: scroll;
  overflow-x: hidden;
}
</style>
