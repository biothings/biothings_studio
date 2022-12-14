<template>
<div class="ui hubs-dashboard large modal">
  <div class="header">Hubs Dashboard</div>

  <div class="content scrolling">
    <div class="ui flex justify-evenly flex-wrap" v-if="hubs_infos">
      <div class="ui card"
          v-for="(hub_info, hub_name) in hubs_infos"
          :key="hub_name + ticker"
          @click="changeConnection($event, hub_name)"
      >
        <div class="content">
          <div class="header">
            <img class="hub-icon" :src="hub_info.icon" >
            <span class="hub-name">{{ hub_name }}</span>
          </div>

          <div class="description">
            <table class="ui table very compact">
              <tbody>
                <tr class="text red" v-if="hub_info.errors">
                  <td>Errors</td>
                  <td>{{ hub_info.errors.join('; ') }}</td>
                </tr>
                <tr class="text info" v-if="hub_info.whatsnew">
                  <td>Whats New</td>
                  <td>{{ hub_info.whatsnew }}</td>
                </tr>
                <tr>
                  <td># of sources</td>
                  <td>{{ hub_info.source.total }}</td>
                </tr>
                <tr>
                  <td># of documents</td>
                  <td>{{ hub_info.source.documents }}</td>
                </tr>
                <tr>
                  <td># of builts</td>
                  <td>{{ hub_info.build.total }}</td>
                </tr>
                <tr>
                  <td># of active proceses</td>
                  <td>{{ hub_info.running_processes }}</td>
                </tr>
                <tr>
                  <td># of active threads</td>
                  <td>{{ hub_info.running_threads }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="actions">
      <div class="ui black cancel button">
        Close
      </div>
      <div class="ui primary button" @click="switchToSimpleMode($event)">
        Switch to simple mode
      </div>
    </div>
</div>

</template>


<script>
import axios from 'axios'
import Vue from 'vue'
import Loader from './Loader.vue'

export default {
  name: 'HubsDashboard',
  props: ["existings"],
  mixins: [],
  components: {},
  data () {
    return {
      hubs_infos: {},
      ticker: 0,
    }
  },
  mounted () {
    const self = this
    $(".modal").modal('setting', {
      onShow: function() {
        self.getHubsInfos()
      }
    })
  },
  methods: {
    changeConnection: function(event, hub_name) {
      console.log(hub_name)
      this.$parent.changeConnection(hub_name)
    },
    switchToSimpleMode: function (event) {
      this.$parent.newConnection()
    },
    getHubInfo: function (hub_config) {
      const self = this

      self.hubs_infos[hub_config.name] = {
        name: hub_config.name,
        icon: hub_config.icon,
        url: hub_config.url,
        whatsnew: hub_config.whatsnew,
        errors: hub_config.errors,
        source: {total: 0, documents: 0},
        build: {total: 0},
        running_processes: 0,
        running_threads: 0,
      }

      axios.get(hub_config.url + '/status')
        .then(response => {
          self.hubs_infos[hub_config.name].source = response.data.result.source
          self.hubs_infos[hub_config.name].build = response.data.result.build
          this.ticker += 1
        })
        .catch(err => {
          console.log(`Error getting hub ${hub_config.name}'s status: ${err}`)
        })

      axios.get(hub_config.url + '/job_manager')
        .then(response => {
          self.hubs_infos[hub_config.name].active_processes = response.data.result.processes?.running
          self.hubs_infos[hub_config.name].active_threads = response.data.result.threads?.running
          this.ticker += 1
        })
        .catch(err => {
          console.log(`Error getting hub ${hub_config.name}'s job manager: ${err}`)
        })
    },
    getHubsInfos: function() {
      this.hubs_infos = {}
      Object.values(this.existings).forEach(this.getHubInfo)
    }
  }
}
</script>


<style scoped>
.hub-icon {
  width: 1.5rem;
  margin-right: 0.5rem;
}

.hubs-dashboard.ui.modal>.scrolling.content {
  max-height: calc(90vh - 5rem);
}

</style>