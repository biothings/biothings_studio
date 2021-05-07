<template>
</template>

<script>
import bus from './bus.js'

export default {
  name: 'base-build',
  methods: {
    inspect: function (event) {
      if ($(event.target).attr('data-build_id') == this.build._id) { bus.$emit('do_inspect', this.build._id) }
    }
  }
}
</script>
