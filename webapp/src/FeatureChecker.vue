<template>
</template>

<script>
import bus from './bus.js'
import hub from './hub.js'

export default {
  name: 'feature-checker',
  methods: {
    has_feature (name) {
      if (hub.features) {
        const hasit = hub.features.includes(name)
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
