import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'
import moment from 'moment'
import filters from './filters.js'
import router from './router.js'
import storage from './storage.js'
import store from './store/store.js'

var last = storage.get('last_conn')
if (last) {
  var conn = JSON.parse(last)
  axios.defaults.baseURL = conn.url
} else {
  // default to same host as the webapp's one, standard hub api port
  axios.defaults.baseURL = `http://${window.location.hostname}:7080`
}

console.log(`%c axios default URl: ${axios.defaults.baseURL}`, 'color:limegreen')

const app = createApp(App)
app.config.globalProperties.moment = moment
app.config.globalProperties.$filters = filters
app.use(store)
app.use(router)
// Vue 3 renders into #studio rather than replacing it, App's own root being #app
app.mount('#studio')
