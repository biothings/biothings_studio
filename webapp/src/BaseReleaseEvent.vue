<template>

</template>

<script>
import axios from 'axios'
import Loader from './Loader.vue'
import Actionable from './Actionable.vue'

export default {
  name: 'base-release-event',
  mixins: [Loader, Actionable],
  props: ['release', 'build', 'type'],
  beforeDestroy () {
    $(`.ui.basic.publishrelease.modal.${this.release_id}`).remove()
  },
  components: { },
  data () {
    return {
      selected_release_env: null,
      release_envs: {},
      publish_error: null,
      selected_current: null,
      selected_previous: null
    }
  },
  methods: {
    getReleaseEnvironments: function () {
      var self = this
      self.loading()
      axios.get(axios.defaults.baseURL + '/release_manager')
        .then(response => {
          self.release_envs = response.data.result.env
          $('.ui.releaseenv.dropdown').dropdown()
          self.loaded()
        })
        .catch(err => {
          console.log('Error getting publisher environments: ')
          console.log(err)
          self.loaderror(err)
          self.error = err
        })
    }
  }
}
</script>

<style scoped>
.tinytiny {
    padding: .5em 1em .5em;
    font-size: .6rem;
}
.relnotecontent {
    font-size: .8em;
    overflow: visible !important;
}
.envdetails {
    font-size: .8em;
    overflow: visible !important;
}
.darkbluey {
    background-color: #3c515d !important;
}
</style>
