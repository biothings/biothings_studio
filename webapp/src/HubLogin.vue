<template>
  <!-- for hubs requiring a login to run commands or change data -->
  <span>
    <span v-if="conn && conn.login_required">
      <div class="ui middle aligned mini" data-position="bottom left"
        :data-tooltip="username ? `Logged in as ${username}, click to log out` : 'Log in to run commands on this hub'">
        <i class="clickicon icon" :class="username ? 'green user' : 'user outline'" @click="username ? logout() : open()"></i>
      </div>
    </span>

    <div class="ui tiny hub-login modal">
      <div class="header">Log in to {{ conn && conn.name }}</div>
      <div class="content">
        <p>Running commands on this hub requires a login.</p>
        <div class="ui form">
          <div class="field">
            <label>Username</label>
            <input type="text" v-model="form_username" autocomplete="username" @keyup.enter="login">
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" v-model="password" autocomplete="current-password" @keyup.enter="login">
          </div>
        </div>
        <div v-if="error" class="ui red message">{{ error }}</div>
      </div>
      <div class="actions">
        <div class="ui cancel button">Cancel</div>
        <div class="ui green button" :class="{ loading: logging_in }" @click="login">Log in</div>
      </div>
    </div>
  </span>
</template>

<script>
import bus from './bus.js'
import hubapi from './hubapi.js'
import { mapGetters } from 'vuex'

export default {
  name: 'hub-login',
  data () {
    return {
      username: null, // logged user
      form_username: '',
      password: '',
      error: null,
      logging_in: false
    }
  },
  computed: {
    ...mapGetters({ conn: 'conn' })
  },
  created () {
    bus.$on('logged_user', this.setUsername)
    bus.$on('login_required', this.open)
  },
  beforeDestroy () {
    bus.$off('logged_user', this.setUsername)
    bus.$off('login_required', this.open)
  },
  methods: {
    setUsername (username) {
      this.username = username
    },
    open () {
      if (!this.conn || !this.conn.login_required) {
        return
      }
      this.error = null
      this.password = ''
      $('.ui.hub-login.modal').modal({ detachable: false, autofocus: true }).modal('show')
    },
    login () {
      if (this.logging_in) {
        return
      }
      this.logging_in = true
      this.error = null
      hubapi.login(this.form_username, this.password)
        .then(() => {
          this.logging_in = false
          this.password = ''
          $('.ui.hub-login.modal').modal('hide')
        })
        .catch(err => {
          this.logging_in = false
          const error = err.response && err.response.data && err.response.data.error
          // eg. "HTTP 401: Invalid username or password"
          this.error = error ? error.replace(/^HTTP \d+: /, '') : err.message
        })
    },
    logout () {
      hubapi.logout()
    }
  }
}
</script>

<style>
/* the modal stays in the navbar, whose text is white */
.hub-login.modal .content {
  color: rgba(0, 0, 0, 0.87);
}
</style>
