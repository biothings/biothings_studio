<template>
    <div :class="['ui tiny',color,'message']" class=" w-full" style="margin-bottom:0;">
      <i class="close icon" :data-id="event._id"></i>
      <div :class="['ui',color,'horizontal label']">
        {{event.name}}
      </div>
      <template v-if="event.msg.length > 100">
        <details>
          <summary>see details</summary>
          <div class="w-full">
            <div class="flex justify-between flex-wrap items-center w-full">
              <span>{{event.msg}}</span> <i>{{event.asctime}}</i>
            </div>
          </div>
        </details>
      </template>
      <template v-else>
        <div class="flex justify-between flex-wrap items-center w-full">
          <span>{{event.msg}}</span> <i>{{event.asctime}}</i>
        </div>
      </template>
      
    </div>
</template>

<script>
import bus from './bus.js'

export default {
  name: 'event-message',
  props: ['event'],
  mounted () {
    var self = this
    $('.message .close')
      .on('click', function () {
        var evtid = $(this).attr('data-id')
        // filter proper event
        if (evtid == self.event._id) {
          $(this)
            .closest('.message')
            .transition('fade')
          console.log(evtid)
          bus.$emit('event_deleted', evtid)
        }
      })
  },
  computed: {
    color: function () {
      switch (this.event.level.toUpperCase()) {
        case 'CRITICAL':
          return 'violet'
          break
        case 'ERROR':
          return 'red'
          break
        case 'WARNING':
          return 'orange'
          break
        case 'INFO':
          return 'green'
          break
        case 'DEBUG':
          return 'blue'
          break
        default:
          return 'black'
      }
    }
  },
}
</script>
