<template>
</template>

<script>
import bus from './bus.js'
import Vue from 'vue'

export default {
  name: 'feature-checker',
  methods: {
    has_feature (name) {
      if (Vue.config && Vue.config.hub_features) {
        var hasit = Vue.config.hub_features.includes(name)
        if (hasit) {
          bus.$emit(`feature_${name}`)
        }
        return hasit
      } else {
        return null
      }
    }
  }
}
</script>
