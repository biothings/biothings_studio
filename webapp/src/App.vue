<template>
  <div id="app" class="m-0">
    <!--🌈🌈 NAV 🌈🌈-->
    <div class="ui pointing inverted menu br-0 m-0 flex-wrap flex-end">
      <NavBar
      :menu="menu"
      :conn="conn"
      :current_studio_version="current_studio_version"
      :readonly_mode="readonly_mode"
      :readonly_switch="readonly_switch"
      :switchReadOnly="switchReadOnly"
      ></NavBar>
      <div class="item m-auto">
        <div data-tooltip="Quick Search" data-position="bottom center">
          <button class="mini circular ui icon button" @click="openQuickSearch"><i class="search icon"></i></button>
        </div>

        <div data-tooltip="Cleanup" data-position="bottom center">
          <button class="mini circular ui icon button" @click="openCleanup"><i class="trash alternate outline icon"></i></button>
        </div>

        <div v-if="needs_upgrade">
            <!-- <button class="mini circular ui icon button" @click="showUpgrades()" data-tooltip="Studio Upgrade Available" data-position="bottom center">
                <b class="upgrade">Upgrade</b>
            </button> -->
            <div class="ui vertical animated mini circular button pointer" tabindex="0" @click="showUpgrades()" data-tooltip="Studio Upgrade Available" data-position="bottom center">
              <div class="visible content">
                <i class="wrench icon upgrade"></i>
              </div>
              <div class="hidden content">
                Upgrade
              </div>
            </div>
        </div>

        <div id="settings" v-if="has_feature('config')">
            <button class="mini circular ui icon button" @click="openConfig" data-tooltip="Edit Studio Configuration" data-position="bottom center">
                <i class="cog icon"></i>
            </button>
        </div>
        <span v-if="has_feature('ws')">
          <div v-if="socket && socket.readyState == 1" :data-tooltip="'Connection: ' + socket.transport" data-position="bottom center">
              <button class="mini circular ui icon button" @click="closeConnection">
                  <i class="green power off icon"></i>
              </button>
          </div>
          <div v-else-if="ws_connection == 'connecting'" data-tooltip="Connecting" data-position="bottom center">
              <button class="mini circular ui icon button" @click="closeConnection">
                  <i class="spinning grey spinner icon"></i>
              </button>
          </div>
          <div v-else>
              <button class="mini circular ui icon button" @click="openConnection"
                  data-tooltip="Click to reconnect"
                  data-position="bottom center">
                  <i class="red plug icon"></i>
              </button>
          </div>
        </span>
      </div>

    </div>

    <!--🌈🌈 NAV END🌈🌈-->

        <div class="ui basic redirect modal">
            <div class="content" v-if="redirect_url">
                <p>
                    Hub requires a different Studio version, found here: <a :href="redirect_url">{{redirect_url}}</a>
                </p>
                <p>
                    This page will automatically redirect to this URL in {{redirect_delay/1000}} second(s) unless cancelled.
                </p>
            </div>
            <div class="content" v-else>
                <p>
                    Hub requires a different Studio version than the one currently running.<br/>
                    No other URLs could be found as a compatible Studio version.<br/>
                </p>
                <p>
                    For your information, required version is: <code><b>{{required_studio_version}}</b></code><br/>
                    Tested URLs were:
                    <div class="ui inverted segment">
                    <div class="ui ordered inverted list">
                        <div class="item" v-for="(url, i) in compat_urls" :key="url+i"><a :href="url">{{url}}</a></div>
                    </div>
                </div>
                </p>
            </div>
            <div class="content">
                <div class="ui form">
                    <div class="ui checkbox">
                        <input id="skip_compat" type="checkbox" @click="toggleCheckCompat($event)">
                        <label class="white">Skip compatility check</label>
                    </div>
                </div>
            </div>
            <div class="actions">
                <div class="ui red basic cancel inverted button" v-if="redirect_url">
                    <i class="remove icon"></i>
                    Keep this version (not recommended)
                </div>
                <div class="ui green ok inverted button">
                    <i class="checkmark icon"></i>
                    Validate
                </div>
            </div>
        </div>

        <quick-search></quick-search>

        <cleanup></cleanup>

        <div class="ui basic config modal" v-if="has_feature('config')">
            <h3 class="ui icon">
                <i class="cog icon"></i>
                Hub Configuration
            </h3>
            <div class="content">
                <hub-config></hub-config>
            </div>
            <div class="actions">
                <div class="ui red basic cancel inverted button">
                    <i class="remove icon"></i>
                    Cancel
                </div>
                <div class="ui green ok inverted button">
                    <i class="checkmark icon"></i>
                    OK
                </div>
            </div>

        </div>

        <div id="page_content" class="clickable ui active tab p-0 m-0">
            <router-view></router-view>
        </div>

        <div class="ui basic upgrade modal">
            <h3 class="ui icon">
                <i class="sync icon"></i>
                Upgrade system
            </h3>
            <div class="content">
                <system-upgrade v-bind:biothings_version="conn.biothings_version" v-bind:app_version="conn.app_version"></system-upgrade>
            </div>
            <div class="actions">
                <div class="ui green ok inverted button">
                    <i class="checkmark icon"></i>
                    OK
                </div>
            </div>
        </div>

        <event-alert></event-alert>

        <div class="ui mini grey bottom fixed inverted menu">
            <div class="left menu">
              <a class="clickable terminal item"  v-if="has_feature('terminal')">
                  <i class="terminal icon"></i>
                  Terminal
              </a>
            </div>

            <div class="right menu">

              <a class="clickable logs item" v-if="has_feature('ws')">
                  <i class="bell outline icon"></i>
                  Logs
              </a>
            </div>
          </div>

          <div class="ui terminal popup top left transition hidden" style="width:50%;">
              <div class="ui inverted segment" v-if="has_feature('terminal')">
                  <terminal></terminal>
              </div>
          </div>

          <div class="ui logs popup top transition hidden" v-if="has_feature('ws')">
              <log-viewer></log-viewer>
          </div>

      </div>

      </div>
    </template>

<script>

import Vue from 'vue'
import axios from 'axios'
import URI from 'urijs'
import regeneratorRuntime from 'regenerator-runtime' // await/async support

import VueLocalStorage from 'vue-localstorage'
import Loader from './Loader.vue'
import Actionable from './Actionable.vue'

import Vue2Filters from 'vue2-filters'
import VueRouter from 'vue-router'

import bus from './bus.js'
import hubapi from './hubapi.js'

import _ from 'lodash'

import JobSummary from './JobSummary.vue'
import Status from './views/Status.vue'
import DataSourceGrid from './DataSourceGrid.vue'
import DataSourceDetailed from './DataSourceDetailed.vue'
import BuildGrid from './BuildGrid.vue'
import BuildDetailed from './BuildDetailed.vue'
import ApiGrid from './ApiGrid.vue'
import EventMessages from './EventMessages.vue'
import EventAlert from './EventAlert.vue'
import HubConfig from './HubConfig.vue'
import LogViewer from './LogViewer.vue'
import Terminal from './Terminal.vue'
import FeatureChecker from './FeatureChecker.vue'
import StandaloneReleases from './StandaloneReleases.vue'
import StandaloneWizard from './StandaloneWizard.vue'
import SystemUpgrade from './SystemUpgrade.vue'
import NavBar from './components/NavBar.vue'
import QuickSearch from './QuickSearch.vue'
import Cleanup from './Cleanup.vue'

const STUDIO_VERSION = '0.2b'
Vue.use(VueLocalStorage)
Vue.use(Vue2Filters)
Vue.use(require('vue-moment'))
Vue.use(VueRouter)

function timesofar (value) {
  const hours = parseInt(Math.floor(value / 3600))
  const minutes = parseInt(Math.floor((value - (hours * 3600)) / 60))
  const seconds = parseInt((value - ((hours * 3600) + (minutes * 60))) % 60)

  const dHours = (hours > 9 ? hours : '0' + hours)
  const dMins = (minutes > 9 ? minutes : '0' + minutes)
  const dSecs = (seconds > 9 ? seconds : '0' + seconds)

  var res = ''
  if (hours) res += dHours + 'h'
  if (minutes) res += dMins + 'm'
  if (seconds) res += dSecs + 's'

  return res
};
Vue.filter('timesofar', timesofar)

var UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
var STEP = 1024

function pretty_size (bytes, precision = 2) {
  var units = [
    'bytes',
    'KB',
    'MB',
    'GB',
    'TB',
    'PB'
  ]

  if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
    return '?'
  }

  var unit = 0

  while (bytes >= 1024) {
    bytes /= 1024
    unit++
  }

  return bytes.toFixed(+precision) + ' ' + units[unit]
};
Vue.filter('pretty_size', pretty_size)

function split_and_join (str, sep = '_', glue = ' ') {
  return str.split(sep).join(' ')
}
Vue.filter('splitjoin', split_and_join)
function jsonstr (value) {
  return JSON.stringify(value)
}
Vue.filter('json', jsonstr)

var numeral = require('numeral')
numeral.register('locale', 'mine', {
  delimiters: {
    thousands: ',',
    decimal: '.'
  },
  abbreviations: {
    thousand: 'thousand',
    million: 'million',
    billion: 'billion',
    trillion: 'trillion'
  }
})
numeral.locale('mine')

Vue.filter('formatNumeric', function (value, fmt) {
  return numeral(value).format(fmt)
})

Vue.filter('formatNumber', function (value) {
  return numeral(value).format('0.00 a')
})

Vue.filter('formatInteger', function (value) {
  return numeral(value).format('0 a')
})

Vue.filter('replace', function (value, what, repl) {
  return value.replace(what, repl)
})

const router = new VueRouter({ linkActiveClass: 'active' })

const PING_INTERVAL_MS = 10000

export default {
  name: 'app',
  router: router,
  mixins: [FeatureChecker, Loader, Actionable],
  components: {
    JobSummary,
    EventMessages,
    EventAlert,
    HubConfig,
    Loader,
    LogViewer,
    Terminal,
    SystemUpgrade,
    NavBar,
    QuickSearch,
    Cleanup,
  },
  mounted () {
    $('.menu .item').tab()
    $('.ui.sticky')
      .sticky({
        context: '#page_content'
      })
    $('.ui.utilssticky')
      .sticky({
        context: '#app'
      })
    var last = Vue.localStorage.get('last_conn')
    this.conn = this.default_conn
    this.$store.dispatch('resetDefaultConnection')
    if (last) {
      this.conn = JSON.parse(last)
      this.$store.commit('saveConnection', {new_conn: JSON.parse(last)})
    }
    this.setupConnection()
    this.skip_studio_compat = Vue.localStorage.get('skip_studio_compat')

    window.addEventListener("keydown", event => {  // shortcuts for windows/linux
      const open_quick_search = (
        (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'p')  // shortcut for chromium
        || (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'p')  // shortcut for firefox
      )
      if (open_quick_search) {
        event.preventDefault()
        this.openQuickSearch()
      }
    })

    window.addEventListener("keyup", event => {  // shortcuts for mac
      const open_quick_search = (
        (event.metaKey && event.shiftKey && event.key.toLowerCase() === 'p')  // shortcut for chromium
        || (event.metaKey && event.altKey && event.key.toLowerCase() === 'p')  // shortcut for firefox
      )
      if (open_quick_search) {
        event.preventDefault()
        this.openQuickSearch()
      }
    })
  },
  created () {
    // //console.log('App created')
    bus.$on('reconnect', this.setupConnection)
    bus.$on('connect', this.setupConnection, null, '/')
    bus.$on('feature_terminal', this.setupTerminal)
    bus.$on('feature_ws', this.setupLogs)
    bus.$on('redirect', this.redirect)
    // connect to default one to start
    this.conn = this.default_conn
  },
  beforeDestroy () {
    bus.$off('reconnect', this.setupConnection)
    bus.$off('connect', this.setupConnection)
    bus.$off('feature_terminal', this.setupTerminal)
    bus.$off('feature_ws', this.setupLogs)
    bus.$off('redirect', this.redirect)
  },
  data () {
    return {
      routes: [],
      menu: [],
      ws_connection: 'disconnected',
      socket_msg: '',
      socket: null,
      msg_timestamp: null,
      latency_value: null,
      ping_interval: PING_INTERVAL_MS, // adjustable delay
      default_conn: {
        icon: 'assets/biothings-studio-color.svg',
        name: 'BioThings Studio',
        app_version: null,
        biothings_version: null,
        url: 'http://localhost:7080'
      },
      conn: null,
      // studio version compatibility checks
      cancel_redirect: false,
      redirect_url: null,
      required_studio_version: null,
      current_studio_version: STUDIO_VERSION,
      compat_urls: [],
      redirect_delay: 5000,
      readonly_mode: true, // from hub features
      readonly_switch: true // from UI (switch in config)
    }
  },
  computed: {
    biothings_needs_upgrade: function () {
      if (Object(this.conn.biothings_version).hasOwnProperty('upgrade')) {
        return true
      } else {
        return false
      }
    },
    app_needs_upgrade: function () {
      if (Object(this.conn.app_version).hasOwnProperty('upgrade')) {
        return true
      } else {
        return false
      }
    },
    needs_upgrade: function () {
      return this.biothings_needs_upgrade || this.app_needs_upgrade
    }
  },
  watch: {
    latency_value: function (newv, oldv) {
      if (newv != oldv) {
        this.evalLatency(oldv, newv)
      }
    },
    // conn: function (newv, oldv) {
    //   if (newv != oldv) {
    //     if (this.conn.icon) { $('.logo').attr('src', this.conn.icon) } else { $('.logo').attr('src', this.default_conn.icon) }
    //   }
    // },
    readonly_mode: function (newv, oldv) {
      this.actionable = newv
      bus.$emit('readonly_mode', newv)
    },
    readonly_switch: function (newv, oldv) {
      // sync mode and switch together
      // if null, we're just deactivating the switch, only true/false values
      // are allowed to be considered and synced
      if (newv !== null) {
        this.readonly_mode = newv
        Vue.localStorage.set('readonly_switch', JSON.stringify(this.readonly_switch))
      }
    },
    required_studio_version: function (newv, oldv) {
      //console.log(`this.required_studio_version, old ${oldv} new ${newv}`)
      if (newv != oldv) {
        this.selectStudio(newv)
      }
    }
  },
  methods: {
    setupUIByFeatures () {
      var self = this
      //console.log('Setup UI according to listed features')
      //console.log(Vue.config.hub_features)
      this.routes = []
      this.menu = []
      if (this.has_feature('readonly')) {
        this.readonly_mode = true
        //console.log('Hub is read-only, deactivate readonly switch')
        this.readonly_switch = null
      } else {
        this.readonly_mode = false
        //console.log('Hub is read/write, activate readonly switch')
        // restore from localstorage
        var stored_switch = Vue.localStorage.get('readonly_switch')
        if (stored_switch !== null) {
          // something previously stored, restore switch state, and sync
          // readonly mode accordingly
          this.readonly_switch = JSON.parse(stored_switch)
          this.readonly_mode = this.readonly_switch
        } else {
          // nothing stored previously, so sync switch state to default mode
          // (ie. not readonly)
          this.readonly_switch = this.readonly_mode
        }
      }
      this.actionable = this.readonly_mode
      if (this.has_feature('source') && this.has_feature('build')) {
        //console.log('Setup Home tab')
        this.routes.push({ path: '/', component: Status })
        this.menu.push({ path: '/', name: 'Home', icon: 'home' })
      }
      if (this.has_feature('source')) {
        //console.log('Setup Sources tab')
        this.routes.push({ path: '/sources', component: DataSourceGrid })
        this.routes.push({ path: '/source/:_id', component: DataSourceDetailed, props: true })
        this.menu.push({ path: '/sources', name: 'Sources', icon: 'database' })
      }
      if (this.has_feature('build')) {
        //console.log('Setup Builds tab')
        this.routes.push({ path: '/builds', component: BuildGrid })
        this.routes.push({ path: '/build/:_id', component: BuildDetailed, props: true, name: 'build' })
        this.menu.push({ path: '/builds', name: 'Builds', icon: 'cubes' })
      }
      if (this.has_feature('autohub')) {
        //console.log('Setup autohub tab')
        var path = '/standalone'
        this.routes.push({ path: path, component: StandaloneReleases })
        var wizard = path + 'wizard'
        this.routes.push({ path: wizard, component: StandaloneWizard, name: 'wizard' })
        this.menu.push({ path: path, name: 'Releases', icon: 'globe' })
      }
      if (this.has_feature('api')) {
        //console.log('Setup API tab')
        this.routes.push({ path: '/apis', component: ApiGrid })
        this.menu.push({ path: '/apis', name: 'API', icon: 'shield alternate' })
      }
      // adjust home link, if none defined
      if (this.menu.length && this.menu[0].path != '/') {
        this.menu[0].path = '/'
        this.menu[0].name = 'Home'
        this.routes[0].path = '/'
      }
      this.routes.forEach(route=>router.addRoute(route))
    },
    dispatchEvent (evt) {
      if (evt.op == 'log') {
        bus.$emit('log', evt)
      } else if (evt.op == 'shell') {
        bus.$emit('shell', evt)
      } else if (evt.obj) {
        // is it a structured event (jsonifiable) or a standard string event
        var invalid_json = false
        if (evt.data && evt.data.msg.startsWith('{') && evt.data.msg.endsWith('}')) {
          // try to avoid json process if not even a dict
          try {
            var dmsg = JSON.parse(evt.data.msg)
            // we only know this type for now...
            if (dmsg.type == 'alert') {
              bus.$emit('alert', dmsg)
              return
            } else {
              //console.log(`Unknown structured event type: ${dmsg.type}`)
            }
          } catch (e) {
            // will be processed as a basic/standard event
          }
        }
        var event = `change_${evt.obj}`
        //console.log(`dispatch event ${event} (${evt._id}): ${evt.op} [${evt.data}]`)
        bus.$emit(event, evt._id, evt.op, evt.data)
      }
    },
    evalLatency: function (oldv, newv) {
      var info = {}
      function getInfo (val) {
        // depending on websocket latency, adjust color and text info
        if (val == null) {
          info.color = 'grey'
          info.quality = 'unknown'
        } else if (val > 0 && val <= 20) {
          info.color = 'green'
          info.quality = 'excellent'
        } else if (val > 20 && val <= 30) {
          info.color = 'olive'
          info.quality = 'good'
        } else if (val > 30 && val <= 50) {
          info.color = 'yellow'
          info.quality = 'average'
        } else if (val > 50 && val <= 100) {
          info.color = 'orange'
          info.quality = 'poor'
        } else if (val > 100) {
          info.color = 'red'
          info.quality = 'very poor'
        } else {
          info.color = 'brown'
          info.quality = '???'
        }
        return info
      }
      var oldinfo = getInfo(oldv)
      var newinfo = getInfo(newv)
    },
    openQuickSearch () {
      $('.ui.basic.quick-search.modal').modal('show')
    },
    openCleanup () {
      $('.ui.basic.cleanup.modal').modal('show')
    },
    openConfig () {
      this.loading()
      var self = this
      $('.ui.basic.config.modal')
        .modal('setting', {
          detachable: false,
          closable: false,
          onApprove: function () {
            self.loaded()
          },
          onDeny: function () {
            self.loaded()
          }
        })
        .modal('show')
    },
    openConnection () {
      this.setupConnection(null, false)
    },
    setupConnection (conn = null, redirect = false) {
      if (conn != null) {
        this.conn = conn
        this.$store.commit('saveConnection', {new_conn: conn})
      }
      // get connection setion anchor hash first
      if (/\/connect=/.test(window.location.hash)) {
        var url = window.location.hash.replace(/.*\/connect=/, '')
        //console.log(`Connect from anchor hash: ${url}`)
        router.push({ name: '/' })
      } else {
        var url = this.conn.url.replace(/\/$/, '')
        //console.log(`Connecting to ${this.conn.name} (${url})`)
      }
      hubapi.base(url)
      this.refreshConnection(url)
      Vue.localStorage.set('last_conn', JSON.stringify(this.conn))
      this.setupSocket(redirect)
    },
    getStudioWebappRoots: function () {
      // where should we look for compatible studio webapp
      var current_host_port = new URI(location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : ''))
      var studio_roots = [current_host_port.toString() + '/']
      var remote_webapps = ['https://studio.biothings.io'] // default remote root if none configured
      if (Vue.localStorage.get('remote_webapps')) {
        studio_roots = Vue.localStorage.get('remote_webapps')
        if (typeof studio_roots !== Array) { studio_roots = [studio_roots] }
      }
      Array.prototype.push.apply(studio_roots, remote_webapps)
      //console.log(`Studio webapp roots: ${studio_roots}`)
      return studio_roots
    },
    selectStudio: function (studio_version) {
      var studio_roots = this.getStudioWebappRoots()
      var current_host_port = new URI(location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : ''))

      var self = this
      //console.log(`Now selecting Studio version ${studio_version}`)

      if (studio_version == 'this') {
        //console.log('Running version is the actual required one, all good')
        return
      }
      if (!studio_version) {
        //console.log("Couldn't find any suitable version, will keep current as failover")
        return
      } else {
        //console.log(`Selected compatible version ${studio_version}`)
      }
      for (var idx in studio_roots) {
        var root = studio_roots[idx]
        if (studio_version == this.current_studio_version) {
          var uri = new URI(root)
        } else {
          var uri = new URI([root, studio_version].join('/'))
        }
        uri.normalize() // prevent double slashes
        var url = uri.toString()
        self.compat_urls.push(url)
      }

      if (!self.compat_urls) {
        //console.log('Could not ensure compatibity')
        return
      }

      var checked = []
      for (var i in self.compat_urls) {
        // check URL is valid
        //console.log(`Checking ${self.compat_urls[i]}`)
        // opaque response only needed so we can avoid CORS security, we just wanna know if
        // there's something valid on the other side before redirection
        // Note: this function is tricky, fetch() is async and we want to access
        // compat_urls using index "i", but in then() we may treat "i" as the one from the
        // loop occurence since it's async (fetch() will immediately return, moving the next loop)
        // so we need to store "i" as "idx" on this function (like a clojure)
        function doFetch (idx) {
          fetch(self.compat_urls[idx])
            .then(function (response) {
              checked.push({ url: self.compat_urls[idx], valid: response.ok, order: idx })
            })
        }
        doFetch(i)
      }
      // ok fetch() are running, we now wait for the results
      var poll_delay = 500
      var max_iter = self.redirect_delay / 500 // try at least the number of seconds we would wait before redirect
      var count = 0
      var inter = setInterval(function () {
        if (Object.keys(checked).length != self.compat_urls.length) {
          count++
          //console.log(`Checking URL for compatible version ${count}/${max_iter}`)
          if (count > max_iter) {
            //console.log('Give up')
            clearInterval(inter)
            $('.redirect.modal')
              .modal('show')
          }
        } else {
          //console.log('All checked:')
          //console.log(checked)
          clearInterval(inter)
          self.cancel_redirect = false
          // select the best redirect, following studio_roots order
          self.redirect_url = null
          var validsorted = checked.filter(url => url.valid == true).sort((u1, u2) => u1.order - u2.order)
          if (!validsorted.length) {
            //console.log('No valid redirection, weird...')
            $('.redirect.modal')
              .modal('show')
            return
          }
          self.redirect_url = validsorted[0].url
          if (self.redirect_url) {
            if (current_host_port.toString() == self.redirect_url) {
              //console.log('Current Studio is compatible')
              return
            }
            $('.redirect.modal')
              .modal('setting', {
                detachable: false,
                closable: false,
                onApprove: function () {
                  window.location.replace(self.redirect_url + window.location.hash)
                },
                onDeny: function () {
                  self.cancel_redirect = true
                }
              }).modal('show')
            setTimeout(
              function () {
                if (!self.cancel_redirect) {
                  //console.log(`Redirecting to ${self.redirect_url}`)
                  window.location.replace(self.redirect_url + window.location.hash)
                }
              }, self.redirect_delay)
          }
        }
      }, poll_delay)
    },
    checkCompat: function (data) {
      // user asked to skip compat checks ?
      if (Vue.localStorage.get('skip_studio_compat') == 'true') {
        //console.log('Skip Studio version compatibility, as instructed in local storage')
        return
      }

      function evalDateCompat (refd, d) {
        // check comparator operator if any (>, <, >= or <=)
        var res = /^\D+/.exec(refd)
        var op = null
        if (res) {
          var op = res[0]
          // adjust actual date string
          refd = refd.slice(op.length)
        } else {
          var op = '==='
        }
        var jsd = new Date(d)
        var jsrefd = new Date(refd)
        // "+" in front to allow comparison involving "=". https://stackoverflow.com/questions/492994/compare-two-dates-with-javascript
        //console.log(`eval: ${jsd} ${op} ${jsrefd}`)
        var exp = String.prototype.concat('+jsd ', op, ' +jsrefd')
        var isok = eval(String.prototype.concat('+jsd ', op, ' +jsrefd'))
        return isok
      }

      var studio_roots = this.getStudioWebappRoots()

      // start checks
      var self = this
      // this loads a list of compatible versions (webapp versions matchings biothings versions)
      var compat_url = studio_roots[0] + '/compat.json'
      // remove any double slash
      compat_url = compat_url.replace(/([^:]\/)\/+/g, '$1')
      //console.log(`Load compatibility list from ${compat_url}`)
      axios.get(compat_url)
        .then(response => {
          var compat = response.data
          //console.log('Compatibility options:')
          //console.log(compat)
          // find the first studio version compatible with current hub
          for (var i in compat) {
            var when = compat[i].when
            for (var k in when) {
              if (data[k]) {
                try {
                  var vers = data[k].split(' ').map(function (e) { var r = /\[(.*)\]/.exec(e); return r && r[1] || e })
                } catch (e) {
                  // object-like
                  var vers = [data[k].branch, data[k].commit, data[k].date]
                }
                var branch = vers[0]
                switch (vers.length) {
                  case 2:
                    var commit = vers[1]
                    var commitdate = null
                    break
                  case 3:
                    var commit = vers[1]
                    var commitdate = vers[2]
                    break
                  default:
                    var commit = null
                    var commitdate = null
                }
                var required_branch = when[k].branch
                var required_commit = when[k].commit
                var required_date = when[k].date
                //console.log(`Hub run ${k} branch:${branch} commit:${commit} commit-date:${commitdate}`)
                //console.log(`Checking compat branch:${required_branch} commit:${required_commit} commit-date:${required_date}`)
                // first check branch
                if (required_branch == branch) {
                  // then commit
                  if (required_commit) {
                    if (required_commit != commit) {
                      //console.log(`Commit mismatch, need ${required_commit} but got ${commit}`)
                      continue
                    } else {
                      // commit more restrictive than date, if match, keep that version
                      //console.log('Commits matches')
                      self.required_studio_version = compat[i].requires
                      break
                    }
                  }
                  // then branch
                  if (required_date) {
                    if (!commitdate) {
                      //console.log('Date compat needed but no commit date returned from Hub')
                      continue
                    }
                    // can be an expression ("more recent than", "older than", etc...)
                    var interval = required_date.split(',')
                    if (interval.length == 2) {
                      var fromd = interval[0]
                      var tod = interval[1]
                      var dateok = evalDateCompat(fromd, commitdate) && evalDateCompat(tod, commitdate)
                    } else {
                      var dateok = evalDateCompat(required_date, commitdate)
                    }
                    if (!dateok) {
                      //console.log(`Date mismatch, need ${required_date} but got ${commitdate}`)
                      continue
                    } else {
                      //console.log('Dates match')
                      self.required_studio_version = compat[i].requires
                      break
                    }
                  } else {
                    // no commit, no date, but branches match
                    self.required_studio_version = compat[i].requires
                    //console.log(`Branches match, required Studio version: ${self.required_studio_version}`)
                    break
                  }
                } else {
                  //console.log(`Branch mismatch, need ${required_branch} but got ${branch}`)
                }
              }
            }
            if (self.required_studio_version) {
              break // again to exit main for loop
            } else {
              //console.log('No match found or no required version specified')
            }
          }
        })
        .catch(err => {
          //console.log("Couldn't load compat.json file")
          //console.log(err)
        })
    },
    refreshConnection: function (url) {
      var self = this
      self.loading()
      axios.get(url)
        .then(response => {
          //console.log(response.data.result)
          this.checkCompat(response.data.result)
          this.conn = response.data.result
          this.$store.commit('saveConnection', {new_conn: response.data.result})
          this.conn.url = url
          Vue.config.hub_features = response.data.result.features
          self.setupUIByFeatures()
          self.loaded()
        })
        .catch(err => {
          //console.log(`Error connecting to ${url}`)
          //console.log(JSON.stringify(err))
          this.loaderror(err)
          bus.$emit('connection_failed', url, err)
        })
    },
    setupSocket (redirect = false) {
      var self = this
      var transports = null// ["jsonp-polling"];//["websocket","xhr-polling"];
      // re-init timestamp so we can monitor it again
      this.msg_timestamp = null
      // first check we can access a websocket
      hubapi.get('/ws/info')
        .then(response => {
          self.ws_connection = 'connecting'
          //console.log('WebSocket available')
          this.socket = new SockJS(axios.defaults.baseURL + '/ws?token=' + hubapi.getAccessToken(), transports)
          this.socket.onopen = function () {
            self.ws_connection = 'connected'
            this.ping_interval = PING_INTERVAL_MS
            self.pingServer()
            if (redirect) {
              window.location.assign(redirect)
            }
            bus.$emit('ws_connected', true)
          }
          this.socket.onmessage = function (evt) {
            var newts = Date.now()
            self.latency_value = newts - self.msg_timestamp
            self.socket_msg = evt.data
            self.dispatchEvent(evt.data)
            self.msg_timestamp = null
          }
          this.socket.onclose = function () {
            // bus.$emit("alert",{type: "alert", event: "hub_stop", msg: "Lost connection"})
            self.closeConnection()
          },
          this.socket.ontimeout = function (err) {
            //console.log('got error')
            //console.log(err)
          }
        })
        .catch(err => {
          //console.log("Can't connect using websocket")
          //console.log(err)
          // invalidate connection and use default
          self.ws_connection = 'disconnected'
          this.conn = this.default_conn
          this.$store.dispatch('resetDefaultConnection')
        })
    },
    closeConnection () {
      this.ws_connection = 'disconnected'
      this.socket.close()
      this.msg_timestamp = null
      bus.$emit('ws_connected', false)
    },
    pingServer () {
      // check if we got a reply before, it not, we have a connection issue
      if (this.msg_timestamp != null) {
        //console.log('Sent a ping but got no pong, disconnect')
        //console.log(router)
        this.closeConnection()
      }
      // Send the "pingServer" event to the server.
      this.msg_timestamp = Date.now()
      this.socket.send(JSON.stringify({ op: 'ping' }))
      if (this.ws_connection == 'connected') {
        setTimeout(this.pingServer, this.ping_interval)
        this.ping_interval = Math.min(this.ping_interval * 1.2, PING_INTERVAL_MS * 6)
      }
    },
    toggleCheckCompat (event) {
      var skip = $('#skip_compat').prop('checked')
      Vue.localStorage.set('skip_studio_compat', skip.toString())
      this.skip_studio_compat = skip
    },
    switchReadOnly () {
      this.readonly_switch = !this.readonly_switch
    },
    setupTerminal () {
      $('.terminal.item').popup({
        popup: $('.terminal.popup'),
        on: 'click',
        // ready to type a command
        onVisible: function () {
          $('#termcommand').focus()
        },
        closable: false,
        position: 'top left'
      })
    },
    setupLogs () {
      $('.logs.item').popup({
        popup: $('.logs.popup'),
        on: 'click',
        closable: false,
        position: 'top left',
        lastResort: 'top right'
      })
    },
    showLogs (event) {
      //console.log(event)
    },
    redirect: function (url, params) {
      //console.log(`Redirecting to ${url}, with param ${JSON.stringify(params)}`)
      router.push({ name: url, params: params })
    },
    showUpgrades () {
      this.loading()
      var self = this
      $('.ui.basic.upgrade.modal')
        .modal('setting', {
          detachable: false,
          closable: false,
          onApprove: function () {
            self.loaded()
          },
          onDeny: function () {
            self.loaded()
          }
        })
        .modal('show')
    }
  }
}


// In order to fix a modal's position error when showing modal after scrolling to bottom
// Override the default Fomantic UI's modal's useFlex setting
$.fn.modal.settings.useFlex = true;


</script>

<style>
    #app {
      font-family: 'Avenir', Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      color: #2c3e50;
      margin-top: 60px;
    }

    .main-background{
      background-color: #f1f1f1 !important;
    }

    .logo {
      margin-right: 0.5em !important;
    }

    .white {
        color: white !important;
    }

    h1, h2 {
      font-weight: normal;
    }

    ul {
      list-style-type: none;
      padding: 0;
    }

    li {
      display: inline-block;
      margin: 0 10px;
    }

    a {
      color: #42b983;
    }

    table .nowrap {
      white-space:  nowrap;
    }

    @keyframes pulse {
      0% {transform: scale(1, 1);}
      50% {transform: scale(1.2, 1.2);}
      100% {transform: scale(1, 1);}
    }

    .pulsing {
      animation: pulse 1s linear infinite;
    }

    .running { animation: 1s rotate360 infinite linear; }

    @keyframes pulse {
      0% {transform: scale(1, 1);}
      50% {transform: scale(1.2, 1.2);}
      100% {transform: scale(1, 1);}
    }
    .pulsing {
      animation: pulse 1s linear infinite;
    }

    @keyframes rotating {
  from {
    -ms-transform: rotate(0deg);
    -moz-transform: rotate(0deg);
    -webkit-transform: rotate(0deg);
    -o-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  to {
    -ms-transform: rotate(360deg);
    -moz-transform: rotate(360deg);
    -webkit-transform: rotate(360deg);
    -o-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
.rotating {
  -webkit-animation: rotating 2s linear infinite;
  -moz-animation: rotating 2s linear infinite;
  -ms-animation: rotating 2s linear infinite;
  -o-animation: rotating 2s linear infinite;
  animation: rotating 2s linear infinite;
}

.clickicon {
    cursor: pointer;
}

.upgrade {
    color: red;
}

html,
body,
#page_content {
  min-height: 100%;
  /* height: 100%; */
}

html,
body,
#app {
  min-height: 100%;
  /* height: 100%; */
}

.red {color: #c31616;}
.green {color: #0e7948;}

.ui.studio.container {
    width: 100%;
    margin-left: 1em !important;
    margin-right: 2em !important;
}

/*; very small buttons*/
.tinytiny {
    padding: .5em 1em .5em;
    font-size: .6em;
}

.segment.jobs {
    margin:0;
}

@import url('https://fonts.cdnfonts.com/css/jetbrains-mono');
.font-jetbrains-mono {
  font-family: 'JetBrains Mono', sans-serif;
}

.line-height-1 {
  line-height: 1;
}

.ui.checkbox {
  font-size: 1rem;
}
</style>
