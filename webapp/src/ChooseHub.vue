<template>
    <span>
        <div class="choosehub ui floating dropdown black circular button p-1">
            <div data-tooltip="Create Connection" data-position="bottom left">
              <i class="icon plus m-0"></i>
            </div>

            <div class="menu largechoose">
                <div class="item" data-value="open-hubs-dashboard">
                  <i class="server circle icon"></i>
                  <b>Open Hubs Dashboard</b>
                </div>
                <div class="divider"></div>
                <div class="item" data-value="new">
                    <i class="plus circle icon"></i>
                    <b>Create new connection</b>
                </div>
                <div class="divider" v-if="Object.keys(existings).length"></div>
                <div class="header" v-if="Object.keys(existings).length">
                    Existing connections
                </div>
                <ExistingConnections :existings="existings"></ExistingConnections>
            </div>
        </div>

        <div class="ui basic newhuburl modal">
            <h3 class="ui icon open-hubs-dashboard" @click="openHubsDashboard">
              <i class="server icon"></i>
              Open Hubs Dashboard
            </h3>
            <h3 class="ui icon">
                <i class="plug icon"></i>
                Create a new connection
            </h3>
            <div class="ui newhuburl form">
                <div class="fields">
                    <div class="required ten wide field">
                        <input type="text" id="huburl" placeholder="Hub address" autofocus v-on:keypress="handleKeyPressOnHubURL">
                    </div>
                </div>
                <div v-if="connection_error" class="connectionerror ui red basic label">
                    <div>Unable to connect to Hub API because:</div>
                    <pre v-html="connection_error"></pre>

                </div>
            </div>
            <br>
            <div class="ui inverted accordion advanced">
                <div class="title">
                    <i class="dropdown icon"></i>
                    Advanced
                </div>
                <div class="content">
                    <div v-if="signin_error" class="ui red basic label signin-error" v-html="signin_error"></div>
                    <span v-if="logged_username">
                        <div>
                            <span>Currently logged as <b class="logged-user">{{logged_username}}</b></span>
                            <a class="signout" @click="signOut">Sign out</a>
                        </div>
                        <br>
                    </span>
                <form class="ui inverted form login" method="post" v-else onsubmit="return false">
                    <div class="field">
                        <label>Username</label>
                        <input type="text" name="username" placeholder="Email">
                    </div>
                    <div class="field">
                        <label>Password</label>
                        <input type="password" name="password" placeholder="Password">
                    </div>
                    <button class="ui button" type="submit" @click="signIn">Login</button>
                </form>
              </div>
            </div>

            <br>

            <div class="ui inverted">
              <div class="ui title py-half-em" v-if="Object.keys(existings).length">
                  Existing connections
              </div>
              <ExistingConnections :existings="existings"></ExistingConnections>
            </div>

          <div class="actions">
            <div class="ui red basic cancel inverted button">
                <i class="remove icon"></i>
                Cancel
            </div>
            <div class="ui green ok inverted button" id="huburl_ok">
                <i class="checkmark icon"></i>
                OK
            </div>
          </div>
        </div>

        <HubsDashboard :existings="existings"></HubsDashboard>
    </span>

</template>

<script>
import axios from 'axios'
import bus from './bus.js'
import auth from './auth.js'
import hubapi from './hubapi.js'
import Vue from 'vue'
import HubsDashboard from './HubsDashboard.vue'
import ExistingConnections from './ExistingConnections.vue'
import Loader from './Loader.vue'

export default {
  name: 'choose-hub',
  props: [],
  mixins: [Loader],
  components:{
    ExistingConnections,
    HubsDashboard,
  },
  mounted () {
    this.getExistings()
    var self = this
    $('.choosehub.ui.floating.dropdown').dropdown({
      onChange: function (value, text, $selectedItem) {
        if (value == 'new') {
          self.newConnection()
        }
        if (value == 'open-hubs-dashboard') {
          self.openHubsDashboard()
        }
      }
    })
    $('.ui.accordion.advanced').accordion()
  },
  created () {
    bus.$on('connection_failed', this.failedConnection)
    bus.$on('logged', this.logged)
    bus.$on('logerror', this.logerror)
    bus.$on('logged_user', this.setLoggedUser)
  },
  beforeDestroy () {
    $('.ui.basic.newhuburl.modal').remove()
    bus.$off('connection_failed', this.failedConnection)
    bus.$off('logged', this.logged)
    bus.$off('logerror', this.logerror)
    bus.$off('logged_user', this.setLoggedUser)
  },
  data () {
    return {
      existings: {},
      connection_error: null,
      signin_error: null,
      logged_username: null,
      tokens: {},
      base_path: window.location.pathname || '/'
    }
  },
  methods: {
    buildConnections: function () {
    },
    getExistings: function () {
      var previous = Vue.localStorage.get('hub_connections')
      if (!previous) { previous = {} } else
      // previous = JSON.parse(JSON.parse(previous));
      { previous = JSON.parse(previous) }
      this.existings = previous
    },
    refreshConnection: function (url) {
      var self = this
      if (!url.startsWith('http')) {
        url = `http://${url}`
      }
      self.loading()
      hubapi.base(url)
      axios.get(url)
        .then(response => {
          var data = response.data.result
          self.getExistings()
          data.url = url.replace(/\/$/, '')
          if (!data.name) { data.name = self.$parent.default_conn.name }
          if (!data.icon) { data.icon = self.$parent.default_conn.icon }
          self.existings[data.name] = data
          Vue.localStorage.set('hub_connections', JSON.stringify(self.existings))
          // update base URL for all API calls
          // auto-connect to newly created connection, and redirect to home
          bus.$emit('connect', data, this.base_path)
          self.connection_error = null
          self.loaded()
        })
        .catch(err => {
          self.loaderror(err)
          this.failedConnection(url, err)
        })
    },
    failedConnection: function (url, error) {
      this.connection_error = this.extractError(error)
      this.newConnection(url)
    },
    newConnection: function (url = null) {
      var self = this
      if (url) {
        $('.ui.newhuburl.form').form('get field', 'huburl').val(url)
      }
      // reset errors
      self.signin_error = null

      $('.ui.basic.newhuburl.modal')
        .modal('setting', {
          detachable: false,
          closable: false,
          onApprove: function () {
            self.connection_error = null
            var url = $('.ui.newhuburl.form').form('get field', 'huburl').val()
            self.refreshConnection(url)
          }
        })
        .modal('show')
    },
    changeConnection: function (value) {
      var conn = this.existings[value]
      var url = conn.url.replace(/\/$/, '')
      this.refreshConnection(url)
      if (conn) { bus.$emit('connect', conn, '/') } else { console.log(`Can't find connection details for ${value}`) }
    },
    signIn () {
      this.signin_error = null
      const username = $('.ui.form.login').form('get field', 'username').val()
      const password = $('.ui.form.login').form('get field', 'password').val()
      auth.signIn(username, password)
      return false
    },
    logged: function (username, tokens) {
      this.tokens = tokens // TODO: use Secure Cookie
      document.cookie = 'biothings-access-token=' + tokens.accessToken.jwtToken
      document.cookie = 'biothings-id-token=' + tokens.idToken.jwtToken
      document.cookie = 'biothings-refresh-token=' + tokens.refreshToken.token
      document.cookie = 'biothings-current-user=' + username
      this.setLoggedUser(username)
      // reset errors
      this.signin_error = null
    },
    logerror: function (user, error, reason) {
      this.signin_error = error
      if (reason) { this.signin_error += ': ' + reason }
      // not logged anymore
      this.logger_user = null
      this.tokens = {}
    },
    setLoggedUser (username) {
      this.logged_username = username
    },
    signOut: function () {
      auth.refreshAccessToken()
      auth.signOut()
      hubapi.clearLoggedUser()
    },
    handleKeyPressOnHubURL: function (event) {
      if (event.key !== "Enter") {
        return
      }

      const url = $("#huburl").val()

      if (!url || url.length == 0) {
        return
      }

      this.refreshConnection(url)
    },
    openHubsDashboard: function() {
      $('.hubs-dashboard.modal').modal('show')
    }
  }
}
</script>

<style scoped>
  @keyframes pulse {
    0% {transform: scale(1, 1);}
    50% {transform: scale(1.2, 1.2);}
    100% {transform: scale(1, 1);}
  }

  .pulsing {
    animation: pulse 1s linear infinite;
  }

  .conftag {
    margin-bottom: 1em !important;
  }

  a {
      color: #218cbc !important;
  }

  .largechoose {width:30em;}
  .signout {font-weight: bold; cursor: pointer; padding-left: 1em;}
  .logged-user {color:lightgrey;}
  .signin-error {margin-bottom: 1em;}

  .py-half-em {padding-top: 0.5em; padding-bottom: 0.5em}

  .newhuburl .open-hubs-dashboard {
    cursor: pointer;
  }
</style>
