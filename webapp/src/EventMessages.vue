<template>
	<div>
		<button class="ui compact labeled icon threads circular button tiny" id="events">
			<i :class="['bullhorn', notifnumcolor, 'icon']"></i>
			<a id="num_events" :class="notifnumcolor">{{events.length}}</a>
		</button>
        <div class="ui messages popup top left transition hidden">
          <div class="ui messages list" id="messages" v-if="events.length > 0">
            <div class="ui fluid right aligned container">
              <button class="mini ui button " @click="clearEvents()">
                  Clear
              </button>
            </div>
            <div class="overflowYScroll">
              <div class="item event" v-for="evt in events" :key="evt._id">
                <event-message v-bind:event="evt"></event-message>
              </div>
            </div>
			  </div>
			<div v-else nowrap>No new notifications</div>
		</div>
	</div>
</template>

<script>
import bus from './bus.js'

import EventMessage from './EventMessage.vue'

const MAX_EVENTS = 10

export default {
  name: 'event-messages',
  mounted () {
    $('.events.button').popup({
      popup: $('.events.popup'),
      on: 'click',
      onVisible: () => { this.hasnew = false },
      // default position and fallback if no space left
      position: 'bottom left',
      lastResort: 'left',
    })
  },
  components: { EventMessage },
  created () {
    bus.$on('change_event', this.onEventChanged)
    bus.$on('event_deleted', this.eventDeleted)
  },
  beforeDestroy () {
    // hacky to remove modal from div outside of app, preventing having more than one
    // modal displayed when getting back to that page. https://github.com/Semantic-Org/Semantic-UI/issues/4049
    bus.$off('change_event', this.onEventChanged)
    bus.$off('event_deleted', this.eventDeleted)
  },
  data () {
    return {
      events: [],
      hasnew: false
    }
  },
  computed: {
    notifnumcolor: function () {
      return this.hasnew ? 'red' : 'grey';
    }
  },
  methods: {
    clearEvents: function () {
      this.events = []
    },
    eventDeleted: function (evtid) {
      var evt = this.events.find(o => o._id == evtid)
      var idx = this.events.indexOf(evt)
      if (idx > -1) { this.events.splice(idx, 1) }
    },
    onEventChanged: function (_id = null, op = null, data = null) {
      if (data != null) {
        // too generic, skip unless important (critical is a special by-passing level there)
        if (data.level != 'CRITICAL' && data.name == 'hub') {
          return
        }
        this.events.unshift(data)
        this.hasnew = true
        while (this.events.length > MAX_EVENTS) { this.events.pop() }
      }
    }
  }
}
</script>

<style>
.ui.sidebar {
    overflow: visible !important;
}
.item.event {
    min-width: 25em;
}
.flex{
  display: flex;
}
.justify-center{
  justify-content: center;
}
.justify-around{
  justify-content: space-around;
}
.justify-between{
  justify-content: space-between;
}
.items-center{
  align-items: center;
}
.flex-wrap{
  flex-wrap: wrap;
}
.w-full{
  width: 100%;
}
</style>
