<template>
  <div class="ui fluid card">
    <div class="content">
      <div class="ui tiny red label right floated" v-if="api.status == 'running'">running</div>

      <!-- error -->
      <div class="ui" v-bind:data-tooltip="displayError()">
        <i class="right floated red alarm icon pulsing" v-if="api.status == 'failed'"></i>
      </div>

      <div class="ui green header m-0" v-if="api">
        <h3>{{ api._id }}</h3>
      </div>
      <div class="left aligned description">
        <div v-if="api.status == 'running'">
          <div class="ui bulleted list">
            <div class="item">Metadata: <a :href="url_metadata">{{ url_metadata }}</a></div>
            <div class="item">Query: <a :href="url_query">{{ url_query }}</a></div>
          </div>
        </div>
      </div>
      <div class="meta">
      </div>

      <div class="ui clearing divider"></div>

      <div class="left aligned description">
        <p class="center aligned">
          <b>{{ api.description }}</b>
        </p>
        <p>
        <table class="ui celled table">
          <tbody>
            <tr>
              <td><small>ElasticSearch host</small></td>
              <td><a :href="api.config.es_host"><small>{{ api.config.es_host }}</small></a></td>
            </tr>
            <tr>
              <td><small>Index</small></td>
              <td class="word-break">
                <small>{{ api.config.index }}</small>
              </td>
            </tr>
            <tr>
              <td><small>Document type</small></td>
              <td class="word-break">
                <small>{{ api.config.doc_type }}</small>
              </td>
            </tr>
            <tr>
              <td><small>API port</small></td>
              <td>
                <small>{{ api.config.port }}</small>
              </td>
            </tr>
          </tbody>
        </table>
        </p>
      </div>
    </div>

    <div class="extra content light-grey" :class="actionable">
      <div class="ui icon buttons left floated mini" v-if="api.status != 'running'">
        <button class="ui button" v-on:click="startAPI" data-tooltip="Start API">
          <i class="play icon"></i>
        </button>
      </div>
      <div class="ui icon buttons left floated mini" v-else>
        <button class="ui button" v-on:click="stopAPI" data-tooltip="Stop API">
          <i class="stop icon"></i>
        </button>
      </div>


      <div class="ui icon buttons floated mini" v-if="api.status == 'running'">
        <button class="ui button" v-on:click="testAPI" data-tooltip="Test API" v-if=!isTestRunning
          @click="showLogs = true">
          <i class="tools icon"></i>
        </button>
      </div>

      <div class="ui icon buttons floated mini" v-if="api.status == 'running'" style="margin-right: 10px;">
        <div v-if="isTestRunning" data-tooltip="Testing in progress...">
          <button class="ui button active loading" disabled="true">
            <i class="tools icon"></i>
          </button>
        </div>
      </div>

      <div class=" ui icon buttons floated mini" v-else>
        <button class="ui button" v-on:click="testAPI" data-tooltip="Test API" disabled="true">
          <i class="tools icon"></i>
        </button>
      </div>
      <div class="ui icon buttons floated mini" v-if="api.status == 'running'">
        <button class="ui button focus" @click="openApiLogViewer" data-tooltip="View API Test Logs">
          <i class="file alternate outline icon"></i>
        </button>
      </div>



      <div class="ui icon buttons right floated mini">
        <button class="ui button delete-btn" data-tooltip="Delete API">
          <i class="trash icon" :data-api_id="api._id" @click="deleteAPI($event)"></i>
        </button>
      </div>
    </div>

    <div class="ui basic deleteapi modal" :id="api._id">
      <div class="ui icon header">
        <i class="remove icon"></i>
        Delete API
      </div>
      <div class="content">
        <p>Are you sure you want to delete API <b>{{ api._id }}</b> ?</p>
      </div>
      <div class="actions">
        <div class="ui red basic cancel inverted button">
          <i class="remove icon"></i>
          No
        </div>
        <div class="ui green ok inverted button">
          <i class="checkmark icon"></i>
          Yes
        </div>
      </div>
    </div>

    <!-- ApiLogViewer Modal -->
    <div class="ui fullscreen-scrolling modal" id="apiLogViewerModal">
      <i class="close icon"></i>
      <div class="header">
        API Test Logs
      </div>
      <div class="scrolling content">
        <api-log-viewer></api-log-viewer>
      </div>
    </div>


  </div>
</template>

<script>
import axios from 'axios'
import Loader from './Loader.vue'
import Actionable from './Actionable.vue'
import ApiLogViewer from './ApiLogViewer.vue';

export default {
  name: 'API',
  mixins: [Loader, Actionable],
  props: ['api'],
  mounted() {
    $('.menu .item')
      .tab()
  },
  beforeDestroy() {
    $(`#${this.api._id}.ui.basic.deleteapi.modal`).remove()
  },
  data() {
    return {
      errors: [],
      isTestRunning: false,
      showLogs: false
    }
  },
  components: {
    'api-log-viewer': ApiLogViewer
  },
  computed: {
    url_metadata: function () {
      return this.api.url + '/metadata'
    },
    url_query: function () {
      return this.api.url + '/query?q=*'
    },
  },
  methods: {
    displayError: function () {
      var errs = []
      if (this.api.err) { errs.push(this.api.err) }
      return errs.join('<br>')
    },
    deleteAPI: function (event) {
      console.log(event)
      var api_id = $(event.target).attr('data-api_id')
      // filter Api component to open correct modal
      console.log(`${api_id} ${this.api._id}`)
      if (!api_id || api_id !== this.api._id) {
        console.log('nope')
        return
      }
      var self = this
      $(`#${this.api._id.replace('.', '\\.')}.ui.basic.deleteapi.modal`)
        .modal('setting', {
          onApprove: function () {
            self.loading()
            axios.delete(axios.defaults.baseURL + '/api', { data: { api_id: self.api._id } })
              .then(response => {
                console.log(response.data.result)
                self.loaded()
                return true
              })
              .catch(err => {
                console.log(err)
                console.log('Error deleting api: ' + err.data.error)
                self.loaderror(err)
              })
          }
        })
        .modal('show')
    },
    testAPI: function () {
      this.isTestRunning = true
      this.loading()
      axios.post(axios.defaults.baseURL + `/api/${this.api._id}/test`)
        .then(response => {
          this.loaded()
          console.log(response.data.result)
        })
        .catch(err => {
          console.log(err)
          this.loaderror(err)
        })
        .finally(() => {
          this.isTestRunning = false
        })
    },
    openApiLogViewer() {
      $('#apiLogViewerModal').modal('show');
    },
    startStopAPI: function (mode) {
      this.loading()
      axios.put(axios.defaults.baseURL + `/api/${this.api._id}/${mode}`)
        .then(response => {
          this.loaded()
          console.log(response.data.result)
        })
        .catch(err => {
          console.log(err)
          console.log(`Error ${mode}ing api: ` + err.data.error)
          this.loaderror(err)
        })
    },
    startAPI: function () {
      return this.startStopAPI('start')
    },
    stopAPI: function () {
      return this.startStopAPI('stop')
    }
  }
}
</script>

<style scoped>
@keyframes pulse {
  0% {
    transform: scale(1, 1);
  }

  50% {
    transform: scale(1.2, 1.2);
  }

  100% {
    transform: scale(1, 1);
  }
}

.pulsing {
  animation: pulse 1s linear infinite;
}

a {
  color: #930000;
}

.word-break {
  word-break: break-word;
}

.close-button {
  padding: 5px 10px;
  margin-top: 3px;
}

.spinner {
  /* position: relative; */
  bottom: 15%;
  left: 15%;
  /* transform: translate(-110%, -110%); */
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 22px;
  /* or the size you want */
  height: 22px;
  /* or the size you want */
  -webkit-animation: spin 1s linear infinite;
  /* Safari */
  animation: spin 1s linear infinite;
}

/* Safari */
@-webkit-keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
  }

  100% {
    -webkit-transform: rotate(360deg);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
