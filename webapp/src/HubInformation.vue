<template>

  <div :class="'ui card hub-info' + (show ? '' : ' hidden')">
    <div class="content">
      <div class="header">
        <a class="popup ml-1"
          v-if="!hub_info.online"
          data-html="This hub is not accessible now."
          data-position="top center"
        >
          <i class="red exclamation triangle icon"></i>
        </a>
        <a class="popup ml-1"
          v-if="hub_info.errors && hub_info.errors.length > 0"
          :data-html="hub_info.errors.join('<br>')"
          data-position="top center"
        >
          <i class="red exclamation triangle icon"></i>
        </a>

        <a class="popup ml-1"
          v-if="hub_info.whatsnew && Object.keys(hub_info.whatsnew).length > 0"
          :data-html="`<pre>${JSON.stringify(hub_info.whatsnew, null, 2)}</pre>`"
          data-position="top center"
        >
          <i class="blue bell icon"></i>
        </a>
        <span @click="connect"
          class="popup hub-name-wrapper"
          :data-html="'Click to connect to <b>' + hub_info.name + '</b>'"
          data-position="top center"
        >
          <img class="hub-icon" :src="hub_info.icon" >
          <span class="hub-name">{{ hub_info.name }}</span>
        </span>

        <div class="meta">
          <small>Last updated: {{ moment(hub_info.last_updated).format('MM/DD/YYYY HH:mm:ss a') }}</small>
        </div>
      </div>

      <div class="description">
        <div :class="hub_info.fetching_counter > 0? 'ui active dimmer' : '' "><div class="ui loader"></div></div>
        <table class="ui table very compact">
          <tbody>
            <tr>
              <td># of sources</td>
              <td>{{ hub_info.source.total | formatInteger }}</td>
            </tr>
            <tr>
              <td># of documents</td>
              <td>{{ hub_info.source.documents | formatNumber }}</td>
            </tr>
            <tr>
              <td># of builts</td>
              <td>{{ hub_info.build.total | formatInteger }}</td>
            </tr>
            <tr>
              <td># of active proceses</td>
              <td>{{ hub_info.running_processes | formatInteger }}</td>
            </tr>
            <tr>
              <td># of active threads</td>
              <td>{{ hub_info.running_threads | formatInteger }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="extra content light-grey">
      <button class="ui button mini icon" @click="hide" data-tooltip="Hide this hub">
        <i class="eye icon"></i>
      </button>

      <button class="ui button mini right floated" @click="(event) => {refresh()}">
        <i class="sync alternate icon"></i>
        Refresh
      </button>
    </div>
  </div>

</template>


<script>
import axios from 'axios'

export default {
  name: 'HubInformation',
  props: ["hub_config", "show"],
  data () {
    return {
      hub_info: {
        name: this.hub_config.name,
        icon: this.hub_config.icon,
        url: this.hub_config.url,
        whatsnew: this.hub_config.whatsnew || {},
        errors: this.hub_config.errors || [],
        source: {total: 0, documents: 0},
        build: {total: 0},
        running_processes: 0,
        running_threads: 0,
        online: true,
        fetching_counter: 0,
        last_updated: null,
      },
      ticker: 0,
    }
  },
  updated () {
    $(".hub-info .popup").popup()
  },
  methods: {
    tick: function() {
      this.ticker += 1
    },
    hide: function () {
      this.$parent.toggleHub(this.hub_info.name, false)
    },
    connect: function () {
      this.$parent.connect(this.hub_info.name)
    },
    refresh: function () {
      const self = this

      self.hub_info.last_updated = new Date()
      self.hub_info.fetching_counter = 3 // 3 tasks: whatsnew, status, job manager

      setTimeout(() => {
        // Fetch hub's whatsnew
        axios.get(self.hub_config.url + '/whatsnew')
        .then(response => {
          self.hub_info.whatsnew = response.data.result
          self.hub_info.online = true
          self.hub_info.fetching_counter -= 1
          self.tick()
        })
        .catch(err => {
          if (err && err.message === "Network Error") {
            self.hub_info.online = false
          }
          else {
            self.hub_info.errors.push("Failed to get whats new.")
          }

          self.hub_info.fetching_counter -= 1
          self.tick()

          console.log(`Error getting hub ${self.hub_config.name}'s whatsnew: ${err}`)
        })

      // Fetch hub's status
      axios.get(self.hub_config.url + '/status')
        .then(response => {
          self.hub_info.source = response.data.result.source
          self.hub_info.build = response.data.result.build
          self.hub_info.online = true
          self.hub_info.fetching_counter -= 1
          self.tick()
        })
        .catch(err => {
          if (err && err.message === "Network Error") {
            self.hub_info.online = false
          }
          else {
            self.hub_info.errors.push("Failed to get status information.")
          }

          self.hub_info.fetching_counter -= 1
          self.tick()

          console.log(`Error getting hub ${self.hub_config.name}'s status: ${err}`)
        })

      // Fetch hub's job information
      axios.get(self.hub_config.url + '/job_manager')
        .then(response => {
          self.hub_info.active_processes = response.data.result.processes?.running
          self.hub_info.active_threads = response.data.result.threads?.running
          self.hub_info.online = true
          self.hub_info.fetching_counter -= 1
          self.tick()
        })
        .catch(err => {
          if (err && err.message === "Network Error") {
            self.hub_info.online = false
          }
          else {
            self.hub_info.errors.push("Failed to get job information.")
          }

          self.hub_info.fetching_counter -= 1
          self.tick()

          console.log(`Error getting hub ${self.hub_config.name}'s job manager: ${err}`)
        })
      }, 1000)
    },
  }
}
</script>


<style scoped>
.ml-1 {
  margin-left: 0.3rem;
}

.hub-icon {
  width: 1.5rem;
  margin-right: 0.5rem;
}

.hub-info.hidden {
  display: none;
}

.hub-info .header {
  font-size: 1.1rem;
  white-space: nowrap;
  overflow-x: hidden;
  text-overflow: ellipsis;
}

.hub-info .header .hub-name-wrapper {
  cursor: pointer;
}

</style>