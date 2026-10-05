<template>
  <div class="hub-terminal" @keydown.esc.stop>
    <div class="hub-terminal-header">
      <span class="hub-terminal-title"><i class="terminal icon"></i>Hub terminal</span>
      <span class="hub-terminal-status">
        <span v-if="mode === 'legacy'" class="term-badge term-badge-warning"
          data-tooltip="This hub runs an older BioThings version: commands are python calls, eg. dump_all()"
          data-position="bottom right">legacy mode</span>
        <a v-if="failedHooks.length" class="term-badge term-badge-error" @click="runLine('hooks')"
          :data-tooltip="'Failed to load: ' + failedHooks.map(hook => hook.name).join(', ')"
          data-position="bottom right">
          {{ failedHooks.length }} hook{{ failedHooks.length > 1 ? 's' : '' }} failed
        </a>
        <span v-if="runningCount" class="term-badge term-badge-running">{{ runningCount }} running</span>
        <button class="ui mini inverted basic icon button" data-tooltip="Help" data-position="bottom right"
          @click="runLine('help')"><i class="question icon"></i></button>
        <button class="ui mini inverted basic icon button" data-tooltip="Clear (Ctrl+L)" data-position="bottom right"
          @click="clear"><i class="eraser icon"></i></button>
      </span>
    </div>
    <div ref="output" class="hub-terminal-output" @click="focusPrompt">
      <terminal-line v-for="entry in entries" :key="entry.key" :entry="entry"></terminal-line>
      <terminal-prompt ref="prompt" :completions="completions" :history="history" @run="runLine"
        @clear="clear" :placeholder="confirming === null ? undefined : 'y to confirm, anything else cancels'">
      </terminal-prompt>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import Vue from 'vue'
import bus from './bus.js'
import TerminalLine from './TerminalLine.vue'
import TerminalPrompt from './TerminalPrompt.vue'

const MAX_ENTRIES = 1000
const MAX_HISTORY = 200
const HISTORY_KEY = 'hub_terminal_history'
const POLL_INTERVAL_MS = 3000
// commands handled by the terminal itself, not sent to the hub
const CLIENT_COMMANDS = ['clear', 'help', 'history']

// results without anything to display: null, or lists of nulls (eg. dump_all(), one null per job)
function isEmpty (value) {
  if (value === null || value === undefined) {
    return true
  }
  return Array.isArray(value) && value.length > 0 && value.every(isEmpty)
}

// text representation of a command result
function render (value) {
  if (isEmpty(value)) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value, null, 2)
}

function padEnd (text, size) {
  return text.length >= size ? text + ' ' : text + ' '.repeat(size - text.length)
}

export default {
  name: 'terminal',
  components: { TerminalLine, TerminalPrompt },
  created () {
    bus.$on('shell', this.onLegacyShell)
    bus.$on('change_command', this.onCommandChanged)
    bus.$on('terminal_opened', this.onOpened)
    this.history = this.loadHistory()
  },
  mounted () {
    this.loadCatalog()
  },
  beforeDestroy () {
    bus.$off('shell', this.onLegacyShell)
    bus.$off('change_command', this.onCommandChanged)
    bus.$off('terminal_opened', this.onOpened)
    this.stopPolling()
  },
  data () {
    return {
      entries: [],
      counter: 0,
      history: [],
      // "terminal": hub provides the terminal API, "legacy": older hub (only /shell), null: unknown yet
      mode: null,
      commands: [],
      hooks: [],
      hooksFolder: null,
      running: {}, // command ID => job entry
      poller: null,
      catalogUrl: null, // hub the catalog was loaded from
      confirming: null // command line waiting for a confirmation (the next line typed answers)
    }
  },
  computed: {
    commandsByName () {
      var byName = {}
      this.commands.forEach(cmd => { byName[cmd.name] = cmd })
      return byName
    },
    completions () {
      return this.commands.map(cmd => cmd.name).concat(CLIENT_COMMANDS).sort()
    },
    failedHooks () {
      return this.hooks.filter(hook => hook.error)
    },
    runningCount () {
      return Object.keys(this.running).length
    }
  },
  methods: {
    loadCatalog () {
      var url = axios.defaults.baseURL
      if (url !== this.catalogUrl) {
        // connected to another hub
        if (this.catalogUrl && this.entries.length) {
          this.addEntry('info', `Connected to ${url}`)
        }
        this.catalogUrl = url
        this.mode = null
        this.commands = []
        this.hooks = []
        // jobs from the previous hub can't be followed anymore
        Object.values(this.running).forEach(entry => { entry.status = 'unknown' })
        this.running = {}
        this.stopPolling()
      }
      return axios.get(url + '/terminal/commands')
        .then(response => {
          var catalog = response.data.result
          this.mode = 'terminal'
          this.commands = catalog.commands
          this.hooks = catalog.hooks
          this.hooksFolder = catalog.hooks_folder
        })
        .catch(err => {
          if (err.response && err.response.status === 404) {
            this.mode = 'legacy'
          } else if (!err.response) {
            // older hubs answer unknown endpoints without CORS headers, so from another origin
            // it looks like a network error: if the hub itself answers, the terminal API is missing
            return axios.get(axios.defaults.baseURL + '/')
              .then(() => { this.mode = 'legacy' })
              .catch(() => {})
          }
        })
    },
    onOpened () {
      // refresh, hooks may have changed since (hub restarted)
      this.loadCatalog()
      this.scrollToBottom()
    },
    focusPrompt () {
      // don't steal the focus while selecting text to copy it
      if (!window.getSelection().toString()) {
        this.$refs.prompt.focus()
      }
    },
    addEntry (kind, text, extra) {
      var entry = Object.assign({ key: this.counter++, kind: kind, text: text }, extra || {})
      this.entries.push(entry)
      if (this.entries.length > MAX_ENTRIES) {
        this.entries.splice(0, this.entries.length - MAX_ENTRIES)
      }
      this.scrollToBottom()
      return entry
    },
    scrollToBottom () {
      this.$nextTick(() => {
        var output = this.$refs.output
        if (output) {
          output.scrollTop = output.scrollHeight
        }
      })
    },
    clear () {
      this.entries = []
      this.confirming = null
    },
    loadHistory () {
      try {
        var history = JSON.parse(Vue.localStorage.get(HISTORY_KEY) || '[]')
        return Array.isArray(history) ? history : []
      } catch (e) {
        return []
      }
    },
    addHistory (line) {
      if (this.history[this.history.length - 1] !== line) {
        this.history.push(line)
      }
      if (this.history.length > MAX_HISTORY) {
        this.history.splice(0, this.history.length - MAX_HISTORY)
      }
      Vue.localStorage.set(HISTORY_KEY, JSON.stringify(this.history))
    },
    async runLine (line) {
      if (this.confirming !== null) {
        return this.answerConfirmation(line.trim())
      }
      line = line.trim()
      if (!line) {
        return
      }
      this.addHistory(line)
      if (this.mode === null || axios.defaults.baseURL !== this.catalogUrl) {
        await this.loadCatalog()
      }
      if (this.mode === 'legacy') {
        return this.runLegacy(line)
      }
      this.addEntry('input', line)
      var words = line.split(/\s+/)
      if (line === 'clear') {
        return this.clear()
      }
      if (line === 'history') {
        return this.addEntry('output', this.history.map((cmd, i) => padEnd(String(i + 1), 5) + cmd).join('\n'))
      }
      if (words[0] === 'help' && words.length <= 2 && this.mode === 'terminal') {
        return words.length === 1 ? this.showHelp() : this.showCommandHelp(words[1])
      }
      return this.send(line, false)
    },
    async send (line, confirmed) {
      try {
        var body = confirmed ? { cmd: line, confirmed: true } : { cmd: line }
        var response = await axios.post(axios.defaults.baseURL + '/terminal/run', body)
        this.showResponse(response.data.result)
      } catch (err) {
        var data = err.response && err.response.data
        if (err.response && err.response.status === 428 && data && data.confirm) {
          // commands deleting or changing data must be confirmed first
          this.addEntry('warning', data.confirm.join('\n'))
          this.addEntry('info', 'Run it? Type y to confirm, anything else cancels')
          this.confirming = line
        } else {
          this.showRequestError(err)
        }
      }
    },
    answerConfirmation (answer) {
      var line = this.confirming
      this.confirming = null
      this.addEntry('input', answer)
      if (/^y(es)?$/i.test(answer)) {
        return this.send(line, true)
      }
      this.addEntry('info', 'Cancelled')
    },
    showResponse (response) {
      // what the command logged while it was called (not sent by older hubs)
      var logs = response.logs || []
      if (logs.length) {
        this.addEntry('log', logs.join('\n'))
      }
      if (response.stdout) {
        this.addEntry('output', response.stdout.replace(/\n$/, ''))
      }
      if (response.stderr) {
        this.addEntry('error', response.stderr.replace(/\n$/, ''))
      }
      if (!response.is_done) {
        var entry = this.addEntry('job', response.cmd, {
          id: response.id,
          status: 'running',
          reason: null,
          duration: null,
          results: [],
          details: null,
          progress: [],
          started_at: response.started_at
        })
        if (/^(restart|stop)\(/.test(response.cmd)) {
          // the hub process goes away: this job can't be followed
          entry.status = 'unknown'
          entry.reason = response.cmd.startsWith('stop') ? 'hub stopping' : 'hub restarting'
          if (entry.reason === 'hub restarting') {
            this.waitForRestart()
          }
        } else {
          Vue.set(this.running, String(response.id), entry)
          this.startPolling()
        }
      } else if (response.failed) {
        this.addEntry('error', response.error, { details: response.traceback })
      } else {
        var text = render(response.result)
        if (text) {
          this.addEntry('output', text)
        } else if (!response.stdout && !logs.length) {
          this.addEntry('info', 'done')
        }
      }
    },
    showRequestError (err) {
      var data = err.response && err.response.data
      if (data && data.error) {
        var error = this.addEntry('error', data.error)
        if (data.usage) {
          this.addEntry('info', 'Usage: ' + data.usage)
        }
        return error
      }
      if (err.response) {
        return this.addEntry('error', `HTTP ${err.response.status}: ${err.response.statusText}`)
      }
      this.addEntry('error', `Can't reach the hub (${err.message})`)
    },
    // Commands running in background. Websocket events tell us when one has changed,
    // polling is a fallback in case events are missed (websocket disconnected...)
    onCommandChanged (id) {
      if (id !== undefined && id !== null && this.running[String(id)]) {
        this.fetchCommand(String(id))
      }
    },
    startPolling () {
      if (!this.poller) {
        this.poller = setInterval(() => {
          Object.keys(this.running).forEach(this.fetchCommand)
          if (!this.runningCount) {
            this.stopPolling()
          }
        }, POLL_INTERVAL_MS)
      }
    },
    stopPolling () {
      if (this.poller) {
        clearInterval(this.poller)
        this.poller = null
      }
    },
    fetchCommand (id) {
      return axios.get(axios.defaults.baseURL + '/command/' + id)
        .then(response => {
          var info = response.data.result
          var entry = this.running[id]
          if (!entry || !info) {
            return
          }
          if (!info.is_done) {
            // eg. "dump all": which sources are done, or failed (not sent by older hubs)
            var progress = info.progress || []
            if (progress.length !== entry.progress.length) {
              entry.progress = progress
              this.scrollToBottom()
            }
            return
          }
          Vue.delete(this.running, id)
          entry.status = info.failed ? 'failed' : 'done'
          entry.duration = info.duration
          entry.results = (info.results || []).map(render).filter(text => text)
          entry.details = info.failed ? info.traceback || null : null // traceback: not sent by older hubs
          this.scrollToBottom()
        })
        .catch(err => {
          var error = err.response && err.response.data && err.response.data.error
          if (error && /No such command/.test(error) && this.running[id]) {
            // the hub restarted meanwhile, it doesn't know this command anymore
            this.running[id].status = 'unknown'
            this.running[id].reason = 'hub restarted'
            Vue.delete(this.running, id)
          } else {
            console.log(`Can't get status of command ${id}: ${err}`)
          }
        })
    },
    // after "restart": wait for the hub to go down and come back, then reconnect Studio
    // (websocket, commands catalog) so everything is live again, without reloading the page
    async waitForRestart () {
      var sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
      var url = axios.defaults.baseURL
      var reachable = () => axios.get(url + '/', { timeout: 3000 }).then(() => true, () => false)
      var info = this.addEntry('info', 'Hub restarting...')
      var start = Date.now()
      while (Date.now() - start < 60000 && await reachable()) {
        await sleep(1000)
      }
      while (Date.now() - start < 300000 && !(await reachable())) {
        await sleep(2000)
      }
      if (axios.defaults.baseURL !== url) {
        return // connected to another hub meanwhile
      }
      if (!(await reachable())) {
        info.text = 'Hub still unreachable after restart, check its logs'
        return
      }
      info.text = `Hub restarted (${Math.round((Date.now() - start) / 1000)}s), reconnected`
      bus.$emit('reconnect')
      this.loadCatalog()
    },
    // help is built from the commands catalog provided by the hub
    showHelp () {
      var visible = this.commands.filter(cmd => !cmd.hidden)
      var size = Math.min(26, Math.max(...visible.map(cmd => cmd.name.length)) + 2)
      var lines = ['Built-in commands:']
      visible.filter(cmd => cmd.origin === 'builtin').sort((a, b) => a.name.localeCompare(b.name))
        .forEach(cmd => lines.push('  ' + padEnd(cmd.name, size) + cmd.summary))
      var hooks = visible.filter(cmd => cmd.origin === 'hook')
      lines.push('')
      if (hooks.length) {
        lines.push(`Hook commands (from ${this.hooksFolder}):`)
        hooks.forEach(cmd => lines.push('  ' + padEnd(cmd.name, size) + cmd.summary + ' [' + cmd.hook + ']'))
      } else {
        lines.push(`Hook commands: none, add python files to the hub's hooks folder (${this.hooksFolder}) to define some`)
      }
      if (this.failedHooks.length) {
        lines.push('  Failed to load: ' + this.failedHooks.map(hook => hook.name).join(', ') + ' (type hooks for details)')
      }
      var advanced = this.commands.filter(cmd => cmd.hidden).map(cmd => cmd.name).sort()
      if (advanced.length) {
        lines.push('', 'Advanced commands: ' + advanced.join(', '))
      }
      lines.push(
        '',
        'Type help <command> for details. Examples:',
        '  dump all                     same as dump_all()',
        '  dump mygene --force          same as dump("mygene", force=True)',
        '  dump mygene && upload mygene run one after the other',
        'Terminal: clear, history, Tab to complete, Up/Down for history, Ctrl+L to clear'
      )
      this.addEntry('output', lines.join('\n'))
    },
    showCommandHelp (name) {
      var cmd = this.commandsByName[name.replace(/-/g, '_')]
      if (!cmd) {
        var similar = this.commands.map(cmd => cmd.name).filter(other => other.includes(name) || name.includes(other))
        return this.addEntry('error', `Unknown command '${name}'` + (similar.length ? `, similar: ${similar.slice(0, 5).join(', ')}` : ''))
      }
      var origin = cmd.origin === 'hook' ? `hook file ${cmd.hook}` : 'built-in command'
      var lines = [`${cmd.name} (${origin})`]
      if (cmd.summary && !(cmd.doc || '').startsWith(cmd.summary)) {
        lines.push(cmd.summary)
      }
      lines.push('Usage:  ' + cmd.usage, 'Python: ' + cmd.signature)
      if (cmd.is_async) {
        lines.push('Runs in background (asynchronous command)')
      }
      if (cmd.confirm) { // not sent by older hubs
        lines.push('Asks for a confirmation before running' + (cmd.confirm === true ? '' : ", unless it's a dry run"))
      }
      if (cmd.examples && cmd.examples.length) {
        lines.push('Examples:')
        cmd.examples.forEach(example => lines.push('  ' + example))
      }
      if (cmd.doc) {
        lines.push('', cmd.doc)
      }
      this.addEntry('output', lines.join('\n'))
    },
    // older hubs: commands sent to /shell, outputs come back through the websocket
    runLegacy (line) {
      if (line === 'clear') {
        return this.clear()
      }
      axios.put(axios.defaults.baseURL + '/shell', { cmd: line })
        .catch(this.showRequestError)
    },
    onLegacyShell (evt) {
      if (this.mode === 'legacy') {
        this.addEntry(evt.type === 'input' ? 'input' : 'output', String(evt.cmd).replace(/\n$/, ''))
      }
    }
  }
}
</script>

<style scoped>
.hub-terminal {
  display: flex;
  flex-direction: column;
  width: 60vw;
  min-width: 420px;
  max-width: 95vw;
  height: 50vh;
  min-height: 240px;
  background: #1b1c1d;
  border-radius: 4px;
  overflow: hidden;
}

.hub-terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4em 0.6em;
  background: #2b2c2d;
  color: #ddd;
}

.hub-terminal-title {
  font-weight: bold;
}

.hub-terminal-status .button {
  margin-left: 0.3em !important;
}

.term-badge {
  display: inline-block;
  margin-left: 0.4em;
  padding: 0.2em 0.7em;
  border-radius: 1em;
  font-size: 0.85em;
  font-weight: bold;
  color: #1b1c1d;
  vertical-align: middle;
}

.term-badge-error {
  background: #ff695e;
  cursor: pointer;
}

.term-badge-error:hover {
  color: #1b1c1d;
  background: #ff8a80;
}

.term-badge-warning {
  background: #ffb957;
}

.term-badge-running {
  background: #ffe21f;
}

.hub-terminal-output {
  flex: 1;
  overflow-y: auto;
  padding: 0.5em 0.7em;
  font-family: 'JetBrains Mono', Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
  line-height: 1.35;
  cursor: text;
}
</style>
