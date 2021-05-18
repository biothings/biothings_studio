<template>
    <div class="ui mini alert modal">
        <div class="header">
            {{event.msg}}
        </div>
        <div class="content">
            <p>You have been disconnected</p>
        </div>
        <div class="actions" >
            <div class="ui positive right labeled icon button">
                OK
                <i class="checkmark icon"></i>
            </div>
        </div>
    </div>
</template>

<script>
import bus from './bus.js'

export default {
  name: 'alert-stop',
  props: ['event'],
  mounted () {
    $('.mini.alert.modal')
      .modal('setting', 'closable', false)
      .modal('show')
  },
  beforeDestroy () {
    bus.$on('alert', this.onAlert)
  },
}
</script>

<style>
</style>
