<template>
<div class="ui hubs-dashboard large modal">
  <div class="header">
    <i class="server circle icon"></i> Hubs Dashboard
  </div>

  <div class="content scrolling">
    <div class="ui flex justify-evenly flex-wrap">
        <HubInformation :hub_config="hub_config" :ref="hub_name"
          v-for="(hub_config, hub_name) in existings"
          :show="is_hub_shown(hub_name)"
          :key="hub_name + ticker"
        ></HubInformation>
    </div>
  </div>
  <div class="actions">
    <div class="ui top center dropdown button">
      <i class="wrench icon"></i> Settings
      <div class="menu">
        <div class="item" @click="getHubsInfos()">
          <i class="sync alternate icon"></i>
          Refresh
        </div>

        <div class="item" @click="switchToCreateNewConnection($event)">
          <i class="plus circle icon"></i>
          Create new connection
        </div>

        <div class="ui divider"></div>

        <div class="item">
          <i class="dropdown icon"></i>
          <span class="text">Toggle Hubs</span>
          <div class="menu">
            <div class="item" @click="showAllHubs($event)">Show All</div>
            <div class="item" @click="hideAllHubs($event)">Hide All</div>

            <div class="ui divider"></div>

            <div class="item" 
              v-for="(_, hub_name) in existings"
              :key="hub_name"
              @click="event => {toggleHub(hub_name)}"
            >
              <i :class="'icon ' + (is_hub_shown(hub_name) ? 'check' : 'uncheck')"></i>
              {{ hub_name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="ui black cancel button">
      <i class="remove icon"></i> Close
    </div>
  </div>
</div>

</template>


<script>
import Vue from 'vue'
import HubInformation from './HubInformation.vue'

export default {
  name: 'HubsDashboard',
  props: ["existings"],
  components: {HubInformation},
  data () {
    let settings = {
      allHubs: {},
      ...JSON.parse(Vue.localStorage.get('HubsDashboardSettings'))
    }
    return {
      settings: settings,
      ticker: 0
    }
  },
  mounted () {
    const self = this
    $(".hubs-dashboard.modal").modal("setting", {
      onShow: function() {
        self.getHubsInfos()
      }
    })
    $(".ui.dropdown").dropdown()

    if (/#\/dashboard/.test(window.location.hash)) {
      $(".hubs-dashboard.modal").modal("show")
    }
  },
  methods: {
    tick: function () {
      this.ticker++
    },
    store_settings: function () {
      Vue.localStorage.set('HubsDashboardSettings', JSON.stringify(this.settings))
    },
    getHubComponent: function (hub_name) {
      if (this.$refs && hub_name in this.$refs && this.$refs[hub_name].length > 0) {
        return this.$refs[hub_name][0]
      }
    },
    connect: function(hub_name) {
      console.log(hub_name)
      this.$parent.changeConnection(hub_name)
    },
    switchToCreateNewConnection: function (event) {
      this.$parent.newConnection()
    },
    is_hub_shown: function (hub_name) {
      return !(hub_name in this.settings.allHubs) || this.settings.allHubs[hub_name].show
    },
    toggleHub: function (hub_name, is_shown=null, store=true) {
      if (is_shown === null || is_shown === undefined) {
        is_shown = !this.is_hub_shown(hub_name)
      }

      if (!(hub_name in this.settings.allHubs)) {
        is_shown = false
        this.settings.allHubs[hub_name] = {}
      }

      this.settings.allHubs[hub_name].show = is_shown

      if (store) {
        this.store_settings()
      }

      this.tick()
    },
    showAllHubs: function (event) {
      const self = this
      Object.keys(this.existings).forEach(hub_name => {
        self.toggleHub(hub_name, true, false)
      })
      self.store_settings()
    },
    hideAllHubs: function (event) {
      const self = this
      Object.keys(this.existings).forEach(hub_name => {
        self.toggleHub(hub_name, false, false)
      })
      self.store_settings()
    },
    getHubsInfos: function() {
      const self = this
      Object.keys(this.existings).forEach(hub_name => {
        self.getHubComponent(hub_name)?.refresh()
      })
    }
  }
}
</script>


<style scoped>
.hubs-dashboard.ui.modal>.scrolling.content {
  max-height: calc(90vh - 10rem);
}

.hubs-dashboard .actions {
  display: flex;
  justify-content: space-between;
}

.ui.card:first-child {
  margin-top: auto;
}

.ui.card:last-child {
  margin-bottom: auto;
}
</style>