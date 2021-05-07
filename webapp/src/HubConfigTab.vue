<template>
    <div>
        <div class="ui info message">All values must be in JSON format</div>
        <div class="config-cont">
          <table class="ui basic table">
              <tbody>
                  <hub-config-param v-bind:param="param" v-for="(param, i) in params" :key="i+'y'" v-bind:allow_edits="allow_edits"></hub-config-param>
              </tbody>
          </table>
        </div>
    </div>
</template>

<script>
import HubConfigParam from './HubConfigParam.vue'

export default {
  name: 'hub-config-tab',
  props: ['section', 'params', 'allow_edits'],
  components: { HubConfigParam },
  updated () {
    $('.menu .item').tab()
    $('.menu .item').tab('change tab', 'General')
  },
}
</script>
<style>
.config-cont{
  max-height: 60vh;
  overflow-y: scroll;
}
</style>
