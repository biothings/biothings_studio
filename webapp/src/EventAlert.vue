<template>
    <span v-if="event">
        <span class="content" v-if="event.event == 'hub_restart'">
            <alert-restart v-bind:event="event"></alert-restart>
        </span>
        <span class="content" v-else-if="event.event == 'hub_stop'">
            <alert-stop v-bind:event="event"></alert-stop>
        </span>
    </span>
</template>

<script>
import bus from './bus.js'
import AlertStop from './AlertStop.vue'
import AlertRestart from './AlertRestart.vue'

export default {
  name: 'event-alert',
  created () {
    bus.$on('alert', this.onAlert)
  },
  data () {
    return {
      event: null
    }
  },
  components: { AlertStop, AlertRestart },
  methods: {
    onAlert: function (evt) {
      console.log('on alert')
      console.log(evt)
      this.event = evt
    }
  }
}
</script>
