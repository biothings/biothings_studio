<template>
    <div id="builds">
        <div class="ui left vertical labeled icon small inverted sidebar menu">
            <div class="item"><i>Existing configurations</i></div>
            <div class="item" style="margin-bottom:50px;">
              <div class="build-cont color-scroll">
                <a class="ui left-align accordion" v-for="(conf,conf_name) in build_configs" :id="'config_' + conf_name" :key="conf_name">
                    <div class="title" style="color:white">
                      <i class="dropdown icon"></i>
                      <div :title="conf_name" :class="['ui', build_colors[conf_name], 'empty circular label']"></div>
                      {{conf_name.length > 10 ? conf_name.slice(0,10)+'...' : conf_name}} <b v-if="conf.error" class="red"><i class="red bell icon"></i></b>
                    </div>
                    <div class="content divided list" style="background:black">
                      <a v-if="!conf.error" class="item pointer left-align" :class="actionable" :conf-name="conf_name" @click="newBuild($event)" :id="'create_' + conf_name">
                          <small><i class="cube icon" :style="{color: build_colors[conf_name]}"></i> Create new build</small>
                      </a>
                      <a class="item pointer left-align" :conf-name="conf_name" @click="editConfiguration($event)">
                          <small>
                            <i class="edit icon" :style="{color: build_colors[conf_name]}"></i>
                            {{readonly ? 'View' : 'Edit' }} configuration
                            <b v-if="conf.error" class="red" :id="'edit_' + conf_name">
                                <i class="red bell icon"></i>
                            </b>
                          </small>
                      </a>
                      <a class="item pointer left-align" :class="actionable" :conf-name="conf_name" @click="deleteConfiguration($event)" :id="'delete_' + conf_name">
                          <small><i class="trash alternate outline icon" :style="{color: build_colors[conf_name]}"></i> Delete configuration</small>
                      </a>
                    </div>
                </a>
              </div>
            </div>
            <div class="item"><i>Other actions</i></div>
            <a class="item"  v-on:click="createConfiguration" :class="actionable">
                <i class="big icons">
                    <i class="configure icon"></i>
                    <i class="corner add icon bottom right"></i>
                </i>
                <div>New configuration</div>
            </a>
            <a class="item" v-on:click="toggleShowArchivedConfigs">
                <i class="big icons">
                    <i class="archive icon"></i>
                </i>
                <div>{{include_archived_configs ? "Hide" : "Show"}}  archived configurations</div>
            </a>
        </div>
        <div class="pusher main-background">
            <div class="ui main container">
                    <!-- <div class="ui orange segment">
                      <div class="ui secondary small menu">
                          <div class="header item">
                            <h1 class="ui orange header">(<small>{{builds ? builds.length : 0}}</small>) Builds</h1>
                          </div>
                          <a class="item" id="side_menu">
                              <i class="sidebar icon"></i>
                              Menu
                          </a>
                      </div>
                    </div> -->

                    <div class="ui big message flex-center clearMenu m-0">
                      <h1 class="ui orange header">(<small>{{builds ? builds.length : 0}}</small>) Builds</h1>
                      <button id="side_menu" style="margin-left:20px;" class="circular ui icon orange button"><i class="icon ellipsis horizontal"></i></button>
                    </div>

                    <div class="ui menu clearMenu">
                      <div class="ui form item p-0 right floated">
                        <div class="fields m-0">
                          <!-- <div class="field">
                              <small class="m-1">Showing <b v-text="shown < builds.length ? shown : builds.length"></b> out of <b v-text="builds.length"></b> from <b class="green text" v-text="showSelection"></b></small>
                              <button v-if="shown < builds.length && shown !== 10" class="ui button mini m-1" @click="shown = shown-10">
                                -10
                              </button>
                              <button v-if="shown < builds.length" class="ui button mini m-1" @click="shown = shown+10">
                                +10
                              </button>
                          </div>
                          <a class="field">
                                <select class="ui filterbuilds dropdown" v-model="showSelection">
                                    <option value="">Date Filter</option>
                                    <optgroup label="view builds from">
                                        <option value="today">from today</option>
                                        <option value="1 day ago">from 1 day ago</option>
                                        <option value="2 days ago">from 2 days ago</option>
                                        <option value="3 days ago">from 3 days ago</option>
                                        <option value="all time">view all (most recent)</option>
                                    </optgroup>
                                </select>
                            </a> -->
                            <a class="field flex-center">
                                <select class="ui filterbuilds dropdown" v-model="conf_filter">
                                    <option value="">Source Filter</option>
                                    <template v-for="(conf,name) in build_configs">
                                        <option :value="name" :key="name+'filter'">
                                          <div :class="['ui', build_colors[name], 'empty circular label']"></div>
                                        {{name}}
                                        </option>
                                    </template>
                                </select>
                                <button class="ui clearconffilter red button white text" v-if="conf_filter" @click="clearFilter">
                                    Clear
                                </button>
                            </a>
                            <a class="field flex-center">
                                <select class="ui filterstatus dropdown" v-model="status_filter">
                                    <option value="">All Statuses</option>
                                    <option value="success">Successful</option>
                                    <option value="failed">Failed</option>
                                    <option value="canceled">Canceled</option>
                                </select>
                                <button class="ui clearconffilter red button white text" v-if="status_filter" @click="clearStatusFilter">
                                    Clear
                                </button>
                            </a>
                            <a class="field flex-center">
                                <div class="ui includearchived checkbox toggle">
                                    <input type="checkbox" name="includearchived" v-model="only_archived">
                                    <label><small>Show archived builds only</small></label>
                                </div>
                            </a>
                        </div>
                      </div>
                    </div>

                    <div v-if="loadingBuilds" class="ui active inverted dimmer">
                      <div class="ui text loader"></div>
                    </div>

                    <div class="ui centered grid">
                        <!-- <template v-for="(build,i) in builds">
                            <div class="ui five wide column" v-bind:key="i+'build'" v-if="i < shown">
                                <build v-bind:pbuild="build" v-bind:color="build_colors[build.build_config.name]"></build>
                            </div>
                        </template> -->
                        <PaginatedList :content="builds" type="Builds" :build_colors="build_colors"></PaginatedList>
                    </div>

                </div>
            </div>

            <!-- create new build configuration -->
            <div class="ui basic buildconfiguration modal">
                <h3 class="ui icon">
                    <i class="configure icon"></i>
                    Create/edit build configuration
                </h3>
                <div class="content">
                    <div class="ui buildconfiguration form">
                        <div class="ui centered grid">
                            <div class="eight wide column">

                                <div v-if="buildconf_error" class="ui negative message">
                                  <div class="header">
                                    Error in build configuration
                                  </div>
                                  <p>{{buildconf_error}}</p>
                                </div>

                                <label>Enter a build configuration name</label>
                                <input type="text" id="conf_name" placeholder="Configuration name" autofocus>
                                <br>
                                <br>

                                <label>Enter a name for the type of stored documents ("gene", "variant", ...)</label>
                                <input type="text" id="doc_type" placeholder="Document type" autofocus>
                                <br>
                                <br>

                                <label>Select the sources used to create merged data</label>
                                <span v-if="default_doc_types_display"> ({{ default_doc_types_display }})</span>
                                <select class="ui fluid sources dropdown" id="selected_sources" multiple="">
                                    <option value="">Available sources</option>
                                    <option v-for="_id in sources" :key="_id+'source'">{{_id}}</option>
                                </select>
                                <br>

                                <label>Once sources are selected, choose sources providing root documents</label>
                                <select class="ui fluid rootsources dropdown" id="root_sources" multiple="">
                                    <option value="">Root sources</option>
                                </select>
                                <br>

                                <label>Select a builder type</label>
                                <select class="ui fluid builders dropdown" id="builders">
                                    <option v-for="val,classpath in builder_classes" :key="classpath+'cp'" :value="classpath">{{classpath}} <i v-if="val.default">(default)</i></option>
                                </select>
                                <div class="ui blue message">
                                  <div class="header">
                                    About this builder
                                  </div>
                                  <p id="builder_doc">{{builder_doc}}</p>
                                </div>
                                <br>

                                <p>Optional parameters can be added to the configuration (usefull to customize builder behavior). Enter a JSON object structure</p>
                                <textarea id="optionals">{}</textarea>

                                <div class="ui teal message">
                                    <b>Note</b>: sources providing root documents, or <i>root sources</i>, are sources allowed to
                                    create a new document in a build (merged data). If a root source is declared, data from other sources will only be merged <b>if</b>
                                    documents previously exist with same IDs (documents coming from root sources). If not, data is discarded. Finally, if no root source
                                    is declared, any data sources can generate a new document in the merged data.
                                </div>

                                <span :class="actionable">
                                    <label>Remove this configuration from list by default</label>
                                    <div><i>You can still access it by clicking on "show/hide archived configuration" in the menu on the side</i></div>
                                    <div class="ui checkbox">
                                        <input type="checkbox" name="archive_conf">
                                        <label class="white">Archive</label>
                                    </div>
                                </span>

                            </div>
                        </div>
                    </div>
                </div>

                <div class="ui error message" v-if="errors.length">
                    <ul class="ui list">
                        <li v-for="err in errors" :key="err">{{err}}</li>
                    </ul>
                </div>

                <div class="actions">
                    <div class="ui red basic cancel inverted button">
                        <i class="remove icon"></i>
                        Cancel
                    </div>
                    <div class="ui green ok inverted button" id="newbuildconf_ok" :class="actionable">
                        <i class="checkmark icon"></i>
                        OK
                    </div>
                </div>
            </div>

            <div class="ui basic deleteconf modal">
                <div class="ui icon header">
                    <i class="trash alternate icon"></i>
                    Delete configuration
                </div>
                <div class="content">
                    <p>Are you sure you want to delete this build configuration ?</p>
                </div>
                <div class="actions">
                    <div class="ui red basic cancel inverted button">
                        <i class="remove icon"></i>
                        No
                    </div>
                    <div class="ui green ok inverted button">
                        <i class="checkmark icon"></i>
                        Yes
                    </div>
                </div>
            </div>

            <div class="ui basic newbuild modal">
                <div class="ui icon header">
                    <i class="cube icon"></i>
                    Create new build
                </div>
                <div class="ui newbuild form">
                    <div class="ui centered grid">
                        <div class="ten wide column">
                            <p>Enter a name for the merged data collection or leave it empty to generate a random one</p>
                            <input type="text" id="target_name" placeholder="Collection name" autofocus>
                            <div class="ui forcebuild checkbox">
                                <br/>
                                <input type="checkbox" name="force_build" id="force_build">
                                <label class="white">Skip sanity checks and force build (not recommended)</label>
                            </div>
                        </div>
                        <div class="six wide column">
                        </div>
                    </div>
                </div>
                <div class="actions">
                    <div class="ui red basic cancel inverted button">
                        <i class="remove icon"></i>
                        Cancel
                    </div>
                    <div class="ui green ok inverted button" id="newbuild_ok">
                        <i class="checkmark icon"></i>
                        OK
                    </div>
                </div>
            </div>

        </div>

    </template>

<script>
import axios from 'axios'
import Actionable from './Actionable.vue'
import Build from './Build.vue'
import bus from './bus.js'
import PaginatedList from './components/PaginatedList.vue'
import Loader from './Loader.vue'

export default {
  name: 'build-grid',
  mixins: [Loader, Actionable],
  mounted () {
    var self = this
    $('.accordion').accordion();
    $('.ui.filterbuilds.dropdown').dropdown()
    $('.ui.buildconfigs.dropdown').dropdown()
    $('.ui.rootsources.dropdown').dropdown()
    $('.ui.sources.dropdown').dropdown({
      onChange: function (addedValue, addedText, $addedChoice) {
        var selected_sources = $('.ui.sources.dropdown').dropdown('get value')
        var fmt = []
        for (var i in selected_sources) {
          var x = selected_sources[i]
          var d = { name: x, text: x, value: x }
          fmt.push(d)
        }
        $('.ui.rootsources.dropdown').dropdown('clear')
        $('.ui.rootsources.dropdown').dropdown('setup menu', { values: fmt }).dropdown('refresh')
      },
      onHide: function() {
        const doc_type = $('.ui.buildconfiguration.form').form('get field', 'doc_type').val()
        if (doc_type && doc_type.length > 0) {
          return
        }

        const selected_sources = $('.ui.sources.dropdown').dropdown('get value')
        const selected_doc_types = []
        selected_sources.forEach(source => {
          const default_doc_type = self.source_doc_type_mapping[source]
          selected_doc_types.push(default_doc_type)
        })

        if (selected_doc_types.length == 1) {
          $('.ui.buildconfiguration.form').form('get field', 'doc_type').val(selected_doc_types[0])
        }
      }
    })

    $('.ui.builders.dropdown').dropdown({
      onChange: function (value, text) {
        self.setBuilderDoc(value)
      }
    })
    $('#builds .ui.sidebar')
      .sidebar({ context: $('#builds') })
      .sidebar('setting', 'transition', 'overlay')
      .sidebar('attach events', '#side_menu')
    $('.ui.form').form()
    $('.ui.includearchived.checkbox').checkbox()
    $('.ui.forcebuild.checkbox').checkbox()
  },
  updated () {
    // there's some kind of race-condition regarding dropdown init, if
    // in mounted() they won't get init, prob. because data changed and needs to
    // be re-rendered
    $('.ui.buildconfigs.dropdown').dropdown()
    $('.accordion').accordion();
  },
  created () {
    // load sources to build dropdown list when creating a new config
    this.loading()
    this.getSourceList()
    // builds & configs
    this.getBuildConfigs()
    this.getBuilds()
    bus.$on('change_source', this.onSourceChanged)
    bus.$on('change_build', this.onBuildChanged)
    bus.$on('change_build_config', this.onBuildConfigChanged)
  },
  beforeDestroy () {
    clearInterval(this.interval)
    // hacky to remove modal from div outside of app, preventing having more than one
    // modal displayed when getting back to that page. https://github.com/Semantic-Org/Semantic-UI/issues/4049
    $('.ui.basic.deleteconf.modal').remove()
    $('.ui.basic.newbuild.modal').remove()
    $('.ui.basic.buildconfiguration.modal').remove()
    bus.$off('change_source', this.onSourceChanged)
    bus.$off('change_build', this.onBuildChanged)
    bus.$off('change_build_config', this.onBuildConfigChanged)
  },
  watch: {
    conf_filter: function (newv, oldv) {
      if (newv != oldv) {
        this.getBuilds()
      }
    },
    only_archived: function (newv, oldv) {
      if (newv != oldv) {
        this.getBuilds()
      }
    },
    status_filter: function (newv, oldv) {
      if (newv != oldv) {
        this.getBuilds()
      }
    },
    // showSelection: function (s, os) {
    //   if (s != os) {
    //     this.getBuilds()
    //   }
    // }
  },
  data () {
    return {
      builds: [],
      sources: [],
      source_doc_type_mapping: {},
      default_doc_types_display: null,
      all_build_configs: {}, // from API
      build_configs: {}, // displayed
      builder_classes: {},
      default_builder_class: null,
      builder_doc: 'No documentation for this builder', // selected builder doc
      buildconf_error: null,
      errors: [],
      build_colors: {},
      // build colors for easy visual id
      colors: ['orange', 'green', 'yellow', 'olive', 'teal', 'violet', 'blue', 'pink', 'purple'],
      color_idx: 0,
      conf_filter: '',
      status_filter: '',
      only_archived: false,
      include_archived_configs: false,
      // shown: 9,
      // showSelection: 'today',
      loadingBuilds: false
    }
  },
  components: { Build, PaginatedList },
  methods: {
    setBuilderDoc: function (classpath) {
      var bclass = this.builder_classes[classpath]
      if (bclass) {
        this.builder_doc = bclass.desc
      }
      if (!this.builder_doc) { this.builder_doc = 'No documentation for this builder' }
    },
    updateRootSources: function () {
      var avail_roots = $('.ui.buildconfiguration.form').form('get field', 'selected_sources').val()
      $('#root_sources').dropdown('clear')
      $('#root_sources').empty()
      $.each(avail_roots, function (i) {
        var val = avail_roots[i]
        $('#root_sources').append(
          $('<option></option>').val(val).html(val)
        )
      })
      $('#root_sources').dropdown().dropdown('refresh')
    },
    getBuilds: function () {
      var self = this
      self.loadingBuilds = true;
      var filter = self.conf_filter == '' ? '' : `?conf_name=${self.conf_filter}`
      // https://vuejs.org/v2/guide/list.html#Caveats:
      // "Vue implements some smart heuristics to maximize DOM element reuse, so replacing an
      //  array with another array containing overlapping objects is a very efficient operation."
      // Well, if only one element changes, like a deleted build, it seems that smart heuristic
      // is somehow dumb enough to partially render the list, so we need to empty that list here
      // (and if emptied in "response", I guess there's a race condition because builds aren't
      // rendered properly again...). Anyway, I don't know if it's related but that's the only
      // explanation I have...
      if (self.status_filter) {
        if (filter == '') {
          filter += `?status=${self.status_filter}`
        }
        else {
          filter += `&status=${self.status_filter}`
        }
      }
      if (self.only_archived) {
        if (filter == '') { filter += '?only_archived=1' } else { filter += '&only_archived=1' }
      }
      self.loading()
      self.builds = []
      axios.get(axios.defaults.baseURL + '/builds' + filter)
        .then(response => {
          self.builds = response.data.result
          console.log('%c 🧰 TOTAL BUILDS =>' + self.builds.length, 'color: coral')
          // if (!self.showSelection) {
          //   self.showSelection = 'today'
          // }

          // const filtered = []
          // for (let i = 0; i < self.builds.length; i++) {
          //   switch (self.showSelection) {
          //     case 'today':
          //       const isFromToday = moment().isSame(moment(self.builds[i].started_at), 'day')
          //       if (isFromToday) {
          //         filtered.push(self.builds[i])
          //       }
          //       break
          //     case '1 day ago':
          //       const onedayago = moment(moment().subtract(1, 'days')).isSame(moment(self.builds[i].started_at), 'day')
          //       if (onedayago) {
          //         filtered.push(self.builds[i])
          //       }
          //       break
          //     case '2 days ago':
          //       const twodayago = moment(moment().subtract(2, 'days')).isSame(moment(self.builds[i].started_at), 'day')
          //       if (twodayago) {
          //         filtered.push(self.builds[i])
          //       }
          //       break
          //     case '3 days ago':
          //       const threedayago = moment(moment().subtract(3, 'days')).isSame(moment(self.builds[i].started_at), 'day')
          //       if (threedayago) {
          //         filtered.push(self.builds[i])
          //       }
          //       break
          //     default:
          //       filtered.push(self.builds[i])
          //       break
          //   }
          // }
          // self.builds = filtered
          self.loadingBuilds = false;
          self.loaded()
        })
        .catch(err => {
          //console.log('Error getting builds information: ' + err)
          self.loadingBuilds = false;
          self.loaderror(err)
        })
    },
    setBuildConfigs: function () {
      this.build_configs = {}
      // make sure we always give the same color for a given build config
      var keys = Object.keys(this.all_build_configs)
      for (var k in keys) {
        if (!this.include_archived_configs && this.all_build_configs[keys[k]].build_config.archived) { continue }
        this.build_configs[keys[k]] = this.all_build_configs[keys[k]]
      }
    },
    getBuildConfigs: function () {
      var self = this
      // reset colors (if configs haven't changed we should get the same colors
      // as we sort the build config by name)
      self.build_colors = {}
      self.color_idx = 0
      this.loading()
      axios.get(axios.defaults.baseURL + '/build_manager')
        .then(response => {
          // depending on API version, build configs are under "build_configs" key
          // along with "builder_classes", or at the root (no builder_classes)
          // TODO: version hub API and check version number there
          if (response.data.result.build_configs) {
            self.all_build_configs = response.data.result.build_configs
            self.builder_classes = response.data.result.builder_classes
            for (var k in self.builder_classes) {
              if (self.builder_classes[k].default) { self.default_builder_class = k }
            }
          } else {
            self.all_build_configs = response.data.result
            self.builder_classes = []
          }
          var keys = Object.keys(self.all_build_configs)
          for (var k in keys) {
            self.build_colors[keys[k]] = self.colors[self.color_idx++]
            if (self.color_idx + 1 >= Object.keys(self.colors).length) {
              self.color_idx = 0
            }
          }
          self.setBuildConfigs()
          this.loaded()
        })
        .catch(err => {
          //console.log('Error getting builds information: ' + err)
          this.loaderror(err)
        })
    },
    getSourceList: function () {
      var self = this
      this.loading()
      self.sources = []
      self.source_doc_type_mapping = {}
      axios.get(axios.defaults.baseURL + '/sources')
        .then(response => {
          $(response.data.result).each(function (i, e) {
            const default_doc_type = e.data_plugin?.plugin?.biothing_type
            if (e.upload) {
              for (var k in e.upload.sources) {
                self.sources.push(k)
                self.source_doc_type_mapping[k] = default_doc_type
              }
            }
          })
          self.sources.sort()
          self.update_default_doc_types_display()
          this.loaded()
        })
        .catch(err => {
          //console.log('Error listing sources: ' + err)
          this.loaderror(err)
        })
    },
    update_default_doc_types_display: function () {
      const doc_types = {}
      let has_value = false
      Object.values(this.source_doc_type_mapping).forEach(doc_type => {
        if (!doc_type) {
          doc_type = 'not provided'
        }
        else {
          has_value = true
        }
        
        if (!doc_types[doc_type]) {
          doc_types[doc_type] = 0
        }
        doc_types[doc_type] ++
      })

      if (has_value) {
        const doc_type_count = []
        for (const [doc_type, count] of Object.entries(doc_types)) {
          doc_type_count.push(`${doc_type} (${count})`)
        }
        this.default_doc_types_display = `biothing_type from data source(s): ${doc_type_count.join(", ")}`
      }
      else {
        this.default_doc_types_display = null
      }
    },
    buildExists: function (_id) {
      var gotit = false
      var self = this
      $(this.builds).each(i => {
        if (self.builds[i]._id == _id) {
          gotit = true
          return false
        }
      })
      return gotit
    },
    onSourceChanged: function (_id = null, op = null) {
      // reload all of them
      this.getSourceList()
    },
    onBuildChanged: function (_id = null, op = null) {
      if (_id == null) {
        //console.log('Refreshing builds')
        this.getBuilds()
      } else {
        if (this.buildExists(_id)) {
          // there's an ID for an existing build, propagate
          bus.$emit('build_updated', _id, op)
        } else {
          this.getBuilds()
        }
      }
    },
    onBuildConfigChanged: function (_id = null, op = null) {
      // reload all of them
      this.getBuildConfigs()
      if (op == 'remove') {
        // refresh builds to assign new colors
        this.getBuilds()
      }
    },
    showBuildConfig: function (event) {
      var confname = $(event.currentTarget).html().trim()
      // //console.log(this.build_configs[confname]);
    },
    clearConfigurationModal () {
      $('#selected_sources').dropdown('clear')
      $('#root_sources').empty()
      $('#root_sources').dropdown('clear')
      $('#builders').dropdown('clear')
      $('.ui.buildconfiguration.form').form('get field', 'conf_name').val('')
      $('.ui.buildconfiguration.form').form('get field', 'doc_type').val('')
      $('.ui.buildconfiguration.form').form('get field', 'optionals').val('{}') // json valid doc
      $('.ui.buildconfiguration.form').form('get field', 'archive_conf').prop('checked', false)
    },
    sendAPI: function (data, mode) {
      var axiosfunc = (mode == 'new' ? axios.post : axios.put)
      var self = this
      axiosfunc(axios.defaults.baseURL + '/buildconf', data)
        .then(response => {
          self.loaded()
          return true
        })
        .catch(err => {
          //console.log(err)
          //console.log('Error creating build configuration: ' + err.data.error)
          self.loaderror(err)
        })
    },
    showBuildConfigModal: function (mode) {
      // refresh doc label for current selected builder
      this.setBuilderDoc($('.ui.buildconfiguration.form').form('get field', 'builders').val())
      var self = this
      $('.ui.basic.buildconfiguration.modal')
        .modal('setting', {
          detachable: false,
          closable: false,
          onApprove: function () {
            self.errors = []
            var conf_name = $('.ui.buildconfiguration.form').form('get field', 'conf_name').val()
            var doc_type = $('.ui.buildconfiguration.form').form('get field', 'doc_type').val()
            var selected_sources = $('.ui.buildconfiguration.form').form('get field', 'selected_sources').val()
            var root_sources = []
            // form valid
            if (!conf_name) { self.errors.push('Provide a configuration name') }
            if (!doc_type) { self.errors.push('Provide a document type') }
            if (selected_sources.length == 0) { self.errors.push('Select at least one source to build merged data') }
            // semantic won't populate select.option when dynamically set values, but rather add "q" elements,
            // despite the use of refresh. How ugly...
            $('.ui.rootsources.dropdown a').each(function (i, e) { root_sources.push($(e).text()) })
            var bclass = $('.ui.buildconfiguration.form').form('get field', 'builders').val()
            var optionals = {}
            try {
              optionals = JSON.parse($('.ui.buildconfiguration.form').form('get field', 'optionals').val())
            } catch (e) {
              self.errors.push('Invalid optional parameter: ' + e)
            }
            if (self.errors.length) { return false }
            self.loading()
            var archived = $('.ui.buildconfiguration.form').form('get field', 'archive_conf').prop('checked')
            var api_data = {
              name: conf_name,
              doc_type: doc_type,
              sources: selected_sources,
              roots: root_sources,
              builder_class: bclass,
              params: optionals,
              archived: archived
            }
            self.sendAPI(api_data, mode)
          }
        })
        .modal('show')
    },
    createConfiguration: function () {
      // force close sidebar
      $('#builds .ui.sidebar').sidebar('hide')
      this.clearConfigurationModal()
      this.showBuildConfigModal('new')
    },
    editConfiguration: function (event) {
      // force close sidebar
      var conf_name = $(event.currentTarget).attr('conf-name')
      var conf = this.all_build_configs[conf_name]
      if (!conf) {
        //console.log(`Unable to get configuration details for ${conf_name}`)
        return
      }
      this.buildconf_error = conf.error
      this.clearConfigurationModal()
      // restore values from existing config
      $('.ui.buildconfiguration.form').form('get field', 'conf_name').val(conf.build_config.name)
      $('.ui.buildconfiguration.form').form('get field', 'doc_type').val(conf.build_config.doc_type)
      $('.ui.buildconfiguration.form').form('get field', 'selected_sources').val(conf.build_config.sources).change()
      this.updateRootSources()
      $('.ui.buildconfiguration.form').form('get field', 'root_sources').val(conf.build_config.root).change()
      var bclass = conf.build_config.builder_class
      if (!bclass) { bclass = this.default_builder_class }
      $('.ui.buildconfiguration.form').form('get field', 'builders').val(bclass).change()
      var optionals = {}
      // conf keys not properly organized, all at root levels, we need to identify which one are specifically dealt with
      // in a specific form element so optionals only contain things not handled in the form
      $.each(conf.build_config, function (k, v) {
        if (['name', 'doc_type', 'sources', 'root', '_id', 'archived', 'builder_class'].indexOf(k) == -1) {
          optionals[k] = v
        }
      })
      $('.ui.buildconfiguration.form').form('get field', 'optionals').val(JSON.stringify(optionals, null, 4))
      $('.ui.buildconfiguration.form').form('get field', 'archive_conf').prop('checked', conf.build_config.archived)
      this.showBuildConfigModal('edit')
    },
    deleteConfiguration: function (event) {
      // force close sidebar
      $('#builds .ui.sidebar').sidebar('hide')
      var conf_name = $(event.currentTarget).attr('conf-name')
      var self = this
      $('.ui.basic.deleteconf.modal')
        .modal('setting', {
          detachable: false,
          onApprove: function () {
            self.loading()
            axios.delete(axios.defaults.baseURL + '/buildconf', { data: { name: conf_name } })
              .then(response => {
                self.loaded()
                return true
              })
              .catch(err => {
                //console.log(err)
                //console.log('Error deleting configuration: ' + err ? err.data.error : 'unknown error')
                self.loaderror(err)
              })
          }
        })
        .modal('show')
    },
    newBuild: function (event) {
      // force close sidebar
      $('#builds .ui.sidebar').sidebar('hide')
      var conf_name = $(event.currentTarget).attr('conf-name')
      var self = this
      $('.ui.basic.newbuild.modal')
        .modal('setting', {
          detachable: false,
          onApprove: function () {
            self.loading()
            var target_name = $('.ui.newbuild.modal #target_name').val()
            var force = $('.ui.forcebuild.checkbox #force_build').prop('checked')
            if (target_name == '') { target_name = null }
            axios.put(axios.defaults.baseURL + `/build/${conf_name}/new`, { target_name: target_name, force: force })
              .then(response => {
                //console.log(response.data.result)
                self.loaded()
                return true
              })
              .catch(err => {
                //console.log(err)
                self.loaderror(err)
              })
          }
        })
        .modal('show')
    },
    clearFilter: function () {
      $('.ui.filterbuilds.dropdown')
        .dropdown('clear')
      this.conf_filter = ''
      this.getBuilds()
    },
    clearStatusFilter: function () {
      $('.ui.filterstatus.dropdown')
        .dropdown('clear')
      this.status_filter = ''
      this.getBuilds()
    },
    toggleShowArchivedConfigs: function () {
      this.include_archived_configs = !this.include_archived_configs
      this.setBuildConfigs()
    }
  }
}
</script>

<style>
.ui.sidebar {
    overflow: visible !important;
    width: 13rem !important;
}

.ui.vertical.menu .item>i.icon, .ui.vertical.menu .item>i.icons {
  float: unset;
  margin: 0;
}

.clearconffilter {
    margin-right:1em !important;
}

.white {
  color: white !important;
}

.red{
  color: red !important;
}

.showBox{
    padding:10px;
}

.m-1{
    margin:.25rem;
}
.m-auto{
  margin: auto;
}
.m-0{
  margin: 0px;
}
.p-0{
  padding: 0px !important;
}
.build-cont{
  max-height: 55vh;
  background-color: rgb(54, 54, 54) !important;
  overflow-y: scroll;
}
.word-wrap{
  word-wrap: break-word;
}
.left-align{
  text-align: left !important;
}
.color-scroll::-webkit-scrollbar-thumb {
    -webkit-border-radius: 10px;
    border-radius: 10px;
    background: #b5cb17 !important; 
}
.color-scroll::-webkit-scrollbar {
  width: 4px;
}
.title.active{
  color:greenyellow;
}
.pointer{
  cursor: pointer;
}

.filterbuilds.dropdown {
  min-width: 14em !important;
}

.includearchived.checkbox {
  margin-top: unset !important;
}
</style>
