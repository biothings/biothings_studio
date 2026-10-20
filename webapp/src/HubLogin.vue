<template>
  <span>
    <!-- for hubs requiring a login to run commands or change data -->
    <!-- (wrapper: the modal below is moved out of this component when initialized) -->
    <span>
      <span v-if="conn && conn.login_required">
        <div class="ui middle aligned mini" data-position="bottom left"
          :data-tooltip="username ? `Logged in as ${username}, click to log out` : 'Log in to run commands on this hub'">
          <i class="clickicon icon" :class="username ? 'green user' : 'user outline'" @click="username ? logout() : open()"></i>
        </div>
      </span>
    </span>

    <div ref="modal" class="ui tiny hub-login modal" role="dialog" aria-modal="true" aria-labelledby="hub-login-title">
      <div class="header" id="hub-login-title">
        <i class="user icon"></i>Log in to {{ conn && conn.name }}
      </div>
      <div class="content">
        <p>{{ reason }}</p>
        <form id="hub-login-form" class="ui form" @submit.prevent="login">
          <div class="field">
            <label for="hub-login-username">Username</label>
            <input ref="username" id="hub-login-username" name="username" type="text" autocomplete="username"
              v-model.trim="form_username">
          </div>
          <div class="field">
            <label for="hub-login-password">Password</label>
            <input ref="password" id="hub-login-password" name="password" type="password" autocomplete="current-password"
              v-model="password">
          </div>
        </form>
        <div v-if="error" class="ui negative message">{{ error }}</div>
      </div>
      <div class="actions">
        <button type="button" class="ui cancel button">Cancel</button>
        <button type="submit" form="hub-login-form" class="ui green button" :class="{ loading: logging_in }"
          :disabled="logging_in">Log in</button>
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
      reason: '',
      error: null,
      logging_in: false
    }
  },
  computed: {
    ...mapGetters({ conn: 'conn' })
  },
  created () {
    bus.$on('logged_user', this.setUsername)
    bus.$on('login_required', this.commandRefused)
  },
  mounted () {
    // not detached from the page, the modal would be positioned within the navbar
    $(this.$refs.modal).modal({
      autofocus: false,
      onVisible: () => (this.form_username ? this.$refs.password : this.$refs.username).focus(),
      onHidden: () => {
        this.password = ''
        this.error = null
      }
    })
  },
  beforeUnmount () {
    bus.$off('logged_user', this.setUsername)
    bus.$off('login_required', this.commandRefused)
    $(this.$refs.modal).remove()
  },
  methods: {
    setUsername (username) {
      this.username = username
      if (username) {
        this.form_username = username // to log in again when the login expires
      }
    },
    commandRefused () {
      this.open('This command requires a login. Log in, then run it again.')
    },
    open (reason) {
      if (!this.conn || !this.conn.login_required || $(this.$refs.modal).modal('is active')) {
        return
      }
      this.reason = reason || 'Running commands on this hub requires a login.'
      this.error = null
      this.password = ''
      $(this.$refs.modal).modal('show')
    },
    login () {
      if (this.logging_in) {
        return
      }
      if (!this.form_username || !this.password) {
        this.error = 'Enter your username and password'
        return
      }
      this.logging_in = true
      this.error = null
      hubapi.login(this.form_username, this.password)
        .then(() => {
          this.logging_in = false
          $(this.$refs.modal).modal('hide')
        })
        .catch(err => {
          this.logging_in = false
          const error = err.response && err.response.data && err.response.data.error
          // eg. "HTTP 401: Invalid username or password"
          this.error = error ? error.replace(/^HTTP \d+: /, '') : `Can't reach the hub (${err.message})`
          this.$nextTick(() => this.$refs.password.select())
        })
    },
    logout () {
      hubapi.logout()
    }
  }
}
</script>
