<template>
    <div class="ui basic quick-search modal tiny">
      <div class="center aligned content">
        <div class="ui search scrolling fluid">
          <div>
            <div class="ui icon input">
              <input class="prompt" type="text" placeholder="Search ...">
              <i class="search icon"></i>
            </div>
            <button class="refresh-cache ui button small tertiary primary"
                    :class="countLoading > 0 ? 'loading disabled': ''" @click="loadData"
                    data-tooltip="When refresh, the app will fetch data source, build, release, api data
                    from the backend api, and update cache with the new one. The cache will be updated every 5 minutes."
                    data-variation="tiny basic"  data-inverted=""
                    >
              <i class="sync alternate icon"></i>Refresh cache
            </button>
          </div>
          <small><i class="lightbulb icon"></i>Open "Quick Search" with "Ctrl + Shift + P"</small>
          <div class="results"></div>
        </div>
      </div>
    </div>
</template>

<script>

import axios from 'axios'
import FeatureChecker from './FeatureChecker.vue'
import Loader from './Loader.vue'
import Actionable from './Actionable.vue'

export default {
  name: 'quick-search',
  mixins: [FeatureChecker, Loader, Actionable],
  mounted () {
    this.loadData()
    setInterval(this.loadData, 60 * 1000 * 5)
  },
  data () {
    return {
      datasources: [],
      builds: [],
      releases: [],
      apis: [],
      countLoading: 0,
    }
  },
  watch: {
    datasources (newValue, oldValue) {
      this.updateSearchSources()
    },
    builds (newValue, oldValue) {
      this.updateSearchSources()
    },
    releases (newValue, oldValue) {
      this.updateSearchSources()
    },
    apis (newValue, oldValue) {
      this.updateSearchSources()
    },
  },
  methods: {
    loadData () {
      const self = this

      self.countLoading = 4
      self.datasources = []
      self.builds = []
      self.releases = []
      self.apis = []

      // Loading datasources
      axios.get(axios.defaults.baseURL + '/sources')
      .then(response => {
        function displayable (src) {
          // if base is an autoupdate dumper, it means it's a "internal" datasource used to managed data releases
          if (src.download && src.download.dumper && src.download.dumper.bases) {
            return !src.download.dumper.bases.includes('biothings.hub.autoupdate.dumper.BiothingsDumper')
          }
          return true
        }
        self.datasources = response.data.result.filter(displayable)
        self.countLoading--
      })
      .catch(err => {
        console.log('Error getting sources information: ' + err)
        self.countLoading--
      })

      // loading builds
      axios.get(axios.defaults.baseURL + '/builds')
        .then(response => {
          self.builds = response.data.result
          self.countLoading--
        })
        .catch(err => {
          console.log('Error getting builds information: ' + err)
          self.countLoading--
        })

      // loading releases
      axios.get(axios.defaults.baseURL + '/standalone/list')
        .then(response => {
          self.releases = response.data.result
          self.countLoading--
        })
        .catch(err => {
          console.log('Error getting list of biothings version_urls: ' + err)
          self.countLoading--
        })

      // loading apis
      axios.get(axios.defaults.baseURL + '/api/list')
        .then(response => {
          self.apis = response.data.result
          self.countLoading--
        })
        .catch(err => {
          console.log('Error getting APIs information: ' + err)
          self.countLoading--
        })
    },
    updateSearchSources () {
      const self = this
      const data = []

      self.datasources.map(source => data.push({
        category: 'Data Source', title: source._id, link: `/source/${source._id}`
      }))
      self.builds.map(build => data.push({
        category: 'Buid', title: build._id, link: `/build/${build._id}`
      }))
      self.releases.map(release => data.push({
        category: 'Release', title: release.name, link: `/standalone?source=${release.name}`
      }))
      self.apis.map(api => data.push({
        category: 'Api', title: api._id , link: '/apis'
      }))

      $('.quick-search .ui.search')
        .search("destroy")
        .search({
          type: 'category',
          source: data,
          maxResults: 0,
          onSelect: this.onSearchSelect,
        })
      ;
    },
    onSearchSelect (result, respones) {
      const link = result.link
      this.$router.push(link)
      $('.quick-search.modal').modal('hide')
      $('.quick-search .ui.search').search("set value")
    },
  }
}
</script>

<style>
.quick-search.modal {
  margin-top: -50vh !important;
}

.ui.category.search>.results .category .result:hover .title,
.ui.search>.results .result:hover .title {
  color:brown !important
}

.ui.tertiary.button.refresh-cache {
  margin-left: 0.5rem !important;
}

</style>
