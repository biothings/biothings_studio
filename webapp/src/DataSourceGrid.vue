<template>
    <div id="sources">
      <div class="ui left vertical labeled icon small inverted sidebar menu actionable">
          <a class="item" v-on:click="register">
              <i class="plug icon"></i>
              New data plugin
          </a>
      </div>
      <div class="pusher main-background">
          <div class="ui main container">
              <div class="ui big message flex-center clearMenu">
                <h1 class="ui pink header">
                  (<small>{{orderedSources ? orderedSources.length : 0}}</small>) Sources
                </h1>
                <button id="sources_menu" style="margin-left:20px;" class="circular ui icon pink button"><i class="icon ellipsis horizontal"></i></button>
              </div>
              <div id="data-source-grid" class="justify-center" style="padding-bottom:100px;">
                  <!-- <div class="four wide column" v-for="(source, i) in orderedSources" :key="source+i">
                      <data-source v-bind:psource="source"></data-source>
                  </div> -->
                  <PaginatedList :content="orderedSources" type="Sources" :perPageProp="50"></PaginatedList>
              </div>
          </div>
      </div>
      <div class="ui basic newdatasource modal">
          <h3 class="ui icon">
              <i class="plug icon"></i>
              Register a new datasource
          </h3>
          <div class="content">
              <p>Specify a repository type and URL</p>
          </div>
          <div class="ui newdataplugin form">
              <div class="fields">
                  <div class="required four wide field">
                      <select class="ui dropdown">
                          <option data-value="github" selected>Github</option>
                      </select>
                  </div>
                  <div class="required ten wide field">
                      <input type="text" id="repo_url" placeholder="Repository URL" autofocus>
                  </div>
              </div>
          </div>
          <div class="actions">
              <div class="ui red basic cancel inverted button">
                  <i class="remove icon"></i>
                  Cancel
              </div>
              <div class="ui green ok inverted button" id="repo_url_ok">
                  <i class="checkmark icon"></i>
                  OK
              </div>
          </div>
      </div>
    </div>
</template>

<script>
import axios from 'axios'
import DataSource from './DataSource.vue'
import Loader from './Loader.vue'
import Actionable from './Actionable.vue'
import bus from './bus.js'
import PaginatedList from './components/PaginatedList.vue'

export default {
  name: 'data-source-grid',
  mixins: [Loader, Actionable],
  mounted () {
    this.getSourcesStatus()
    // this.interval = setInterval(this.getSourcesStatus,15000);
    $('select.dropdown').dropdown()
    $('#sources .ui.sidebar')
      .sidebar({ context: $('#sources') })
      .sidebar('setting', 'transition', 'overlay')
      .sidebar('attach events', '#sources_menu')
  },
  created () {
    bus.$on('change_data_plugin', this.onDataPluginChanged)
  },
  beforeDestroy () {
    bus.$off('change_data_plugin', this.onDataPluginChanged)
    $('.ui.basic.newdatasource.modal').remove()
  },
  data () {
    return {
      sources: [],
      errors: []
    }
  },
  computed: {
    orderedSources: function () {
      return _.orderBy(this.sources, 'name')
    }
  },
  components: { DataSource, PaginatedList },
  methods: {
    getSourcesStatus: function () {
      this.loading()
      axios.get(axios.defaults.baseURL + '/sources')
        .then(response => {
          function displayable (src) {
            // if base is an autoupdate dumper, it means it's a "internal" datasource used to managed data releases
            if (src.download && src.download.dumper && src.download.dumper.bases) {
              return !src.download.dumper.bases.includes('biothings.hub.autoupdate.dumper.BiothingsDumper')
            }
            return true
          }
          this.sources = response.data.result.filter(displayable)
          this.loaded()
        })
        .catch(err => {
          console.log('Error getting sources information: ' + err)
          this.loaderror(err)
        })
    },
    register: function () {
      this.loading()
      var self = this
      $('.ui.basic.newdatasource.modal')
        .modal('setting', {
          detachable: false,
          closable: false,
          onApprove: function () {
            var url = $('.ui.newdataplugin.form').form('get field', 'repo_url').val()
            axios.post(axios.defaults.baseURL + '/dataplugin/register_url', { url: url })
              .then(response => {
                console.log(response.data.result)
                self.loaded()
                return true
              })
              .catch(err => {
                console.log(err)
                console.log('Error registering repository URL: ' + err.data.error)
                self.loaderror(err)
              })
          },
          onDeny: function () {
            self.loaded()
          }
        })
        .modal('show')
    },
    onDataPluginChanged: function (_id = null, op = null) {
      // even if _id is set we refresh everything
      // (as we cannot know if a component for _id actually
      //  already exists when creating a data plugin)
      this.getSourcesStatus()
    }
  }
}
</script>
