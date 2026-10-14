import axios from 'axios'
import Vue from 'vue'
import bus from './bus.js'

// hubs requiring a login (users defined in their HUB_API_USERS) give a token on POST /login,
// to send in this header with the requests running commands or changing data
const TOKEN_HEADER = 'X-Biothings-Access-Token'

class ApiService {
  get (endpoint) {
    return axios.get(endpoint)
  }

  base (url) {
    // set base URL for all API calls, with the login to this hub if any
    axios.defaults.baseURL = url
    const login = this.getLogin()
    if (login) {
      axios.defaults.headers.common[TOKEN_HEADER] = login.token
    } else {
      delete axios.defaults.headers.common[TOKEN_HEADER]
    }
    bus.$emit('logged_user', login ? login.username : null)
  }

  login (username, password) {
    // log in to the current hub, its token is then sent with all API calls
    return axios.post('/login', { username: username, password: password })
      .then(response => {
        this.saveLogin(response.data.result)
        return response.data.result.username
      })
  }

  logout () {
    this.saveLogin(null)
  }

  getLogin () {
    // login to the current hub ({username, token, expires}), unless it expired
    const login = this.getLogins()[axios.defaults.baseURL]
    return login && new Date(login.expires) > new Date() ? login : null
  }

  getLogins () {
    // logins by hub URL
    return JSON.parse(Vue.localStorage.get('hub_logins') || '{}')
  }

  saveLogin (login) {
    const logins = this.getLogins()
    if (login) {
      logins[axios.defaults.baseURL] = login
    } else {
      delete logins[axios.defaults.baseURL]
    }
    Vue.localStorage.set('hub_logins', JSON.stringify(logins))
    this.base(axios.defaults.baseURL)
  }
}

const hubapi = new ApiService()

function isCurrentHub (config) {
  const hub = (axios.defaults.baseURL || '').replace(/\/$/, '')
  const url = /^https?:\/\//.test(config.url) ? config.url : (config.baseURL || '') + config.url
  return hub !== '' && url.startsWith(hub + '/')
}

function checkLogin (response) {
  // hubs requiring a login answer 401 to the commands sent without a valid one (eg. expired):
  // forget the login, and ask for a new one
  if (response && response.status === 401 && !/\/login$/.test(response.config.url) && isCurrentHub(response.config)) {
    hubapi.logout()
    bus.$emit('login_required')
  }
}

axios.interceptors.response.use(
  response => {
    checkLogin(response) // for requests accepting any status (eg. from the terminal)
    return response
  },
  error => {
    checkLogin(error.response)
    return Promise.reject(error)
  }
)

export default hubapi
