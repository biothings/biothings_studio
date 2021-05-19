<template>
    <div class="container home">
        <div style="text-align:center;">
            <img :src="icon" width="100">
            <h3 class="grey heading" v-if="conn && conn.name"> {{ conn.name }}</h3>
            <div class="flex justify-center" v-if="status">
                <Statistic :status="status" type="source" color="pink"></Statistic>
                <Statistic :status="status" type="documents" color="green"></Statistic>
                <Statistic :status="status" type="build" color="orange"></Statistic>
            </div>
        </div>
        <div class="ui grey message container">
            <h4 class="ui blue header">What's new</h4>
            <div class="ui blue segment">
                <span v-if="Object.keys(whatsnew).length">
                    <div class="column centered">

                        <div class="ui feed">
                            <div class="event" v-for="(newd,conf) in whatsnew" :key="newd.old_build.name">
                                <div class="label">
                                    <i class="cubes icon"></i>
                                </div>
                                <div class="content">
                                    <div class="summary">
                                        <a class="user">
                                            {{conf}}
                                        </a> can be rebuilt, it contains <a>{{Object.keys(newd.sources).length}} updated datasource(s)</a>.
                                        <br>
                                        <div class="date">
                                            Previous build was <i>{{ newd.old_build.name }}</i>, built on {{ newd.old_build.built_at | moment('lll') }}
                                        </div>
                                    </div>
                                    <div class="mymeta" v-for="(srcd,src) in newd.sources" :key="srcd.old.version">
                                        <i class="database icon"></i><b>{{src}}</b>: {{srcd.old.version}} <i class="small arrow right icon"></i> {{srcd.new.version}}
                                        <i>({{srcd.new.downloaded_at | moment("from","now")}})</i>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div class="four column centered row">
                    </div>
                </span>
                <h5 class="center" v-else>Not much, nothing happened recently...</h5>
            </div>

        </div>
    </div>
</template>

<script>
import Loader from '../Loader.vue'
import axios from 'axios'
import Statistic from '../components/Statistic.vue'
//store
import {mapGetters} from 'vuex';

export default {
  name: 'status',
  mixins: [Loader],
  mounted () {
    this.refreshStatus()
    this.refreshWhatsNew()
  },
  components:{
      Statistic
  },
  computed:{
        ...mapGetters({
            icon: 'icon',
            conn: 'conn'
        }),
  },
  data () {
    return {
      status: {},
      whatsnew: {},
      errors: []
    }
  },
  methods: {
    refreshStatus: function () {
      this.loading()
      axios.get(axios.defaults.baseURL + '/status')
        .then(response => {
          this.status = response.data.result
        //   console.log('%c 💙 Status: ' + JSON.stringify(this.status, null, 2), 'color:lightblue')
          this.loaded()
        })
        .catch(err => {
          console.log('Error getting sources information: ' + err)
          this.loaderror(err)
        })
    },
    refreshWhatsNew: function () {
      axios.get(axios.defaults.baseURL + '/whatsnew')
        .then(response => {
          this.whatsnew = response.data.result
        })
        .catch(err => {
          console.log('Error getting sources information: ' + err)
        })
    }
  }
}
</script>

<style>
.mymeta {
    color: rgba(0,0,0,.5);
    font-size: .85em;
}
.home{
    min-height: 80vh;
    flex-direction: column;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
