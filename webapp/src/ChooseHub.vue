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
import hubapi from './hubapi.js'
import storage from './storage.js'
import HubsDashboard from './HubsDashboard.vue'
import ExistingConnections from './ExistingConnections.vue'
import Loader from './Loader.vue'

export default {
  name: 'choose-hub',
  props: [],
  mixins: [Loader],
  components: {
    ExistingConnections,
    HubsDashboard,
  },
  mounted() {
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
  },
  created() {
    bus.$on('connection_failed', this.failedConnection)
  },
  beforeUnmount() {
    $('.ui.basic.newhuburl.modal').remove()
    bus.$off('connection_failed', this.failedConnection)
  },
  data() {
    return {
      existings: {},
      connection_error: null,
      base_path: window.location.pathname || '/'
    }
  },
  methods: {
    buildConnections: function () {
    },
    getExistings: function () {
      var previous = storage.get('hub_connections')
      if (!previous) {
        previous = {}
      } else {
        previous = JSON.parse(previous)
      }
      this.existings = previous
    },

    refreshConnection: function (url) {
      var self = this
      if (!url.startsWith('http')) {
        url = `http://${url}`
      }
      self.loading()
      axios.get(url)
        .then(response => {
          var data = response.data.result
          self.getExistings()

          data.url = url.replace(/\/$/, '')
          if (!data.name) { data.name = self.$parent.$parent.default_conn.name }
          if (!data.icon) { data.icon = self.$parent.$parent.default_conn.icon }

          hubapi.base(data.url)

          self.existings[data.name] = data
          storage.set('hub_connections', JSON.stringify(self.existings))

          bus.$emit('connect', data, self.base_path)
          self.connection_error = null
          self.loaded()
        })
        .catch(err => {
          self.loaderror(err)
          self.connection_error = self.extractError(err)
          self.newConnection(url)
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
      if (!conn) {
        console.log(`Can't find connection details for ${value}`)
        return
      }

      var url = conn.url.replace(/\/$/, '')
      this.refreshConnection(url)
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

    openHubsDashboard: function () {
      $('.hubs-dashboard.modal').modal('show')
    }
  }
}
</script>

<style scoped>
@keyframes pulse {
  0% {
    transform: scale(1, 1);
  }

  50% {
    transform: scale(1.2, 1.2);
  }

  100% {
    transform: scale(1, 1);
  }
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

.largechoose {
  width: 30em;
}

.py-half-em {
  padding-top: 0.5em;
  padding-bottom: 0.5em
}

.newhuburl .open-hubs-dashboard {
  cursor: pointer;
}
</style>
