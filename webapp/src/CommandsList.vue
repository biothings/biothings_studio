<template>
    <div>
        <div class="ui header">
            <div class="ui toggle checkbox">
                <label>Show all</label>
                <input v-model="allcmds" type="checkbox" tabindex="0" class="hidden">
            </div>
        </div>
        <div class="overflowYScroll" v-if="Object.keys(commands).length">
          <table class="ui compact celled table">
              <tr v-for="(command, i) in orderedCommands" :key="command.is_done+i"
                  v-bind:class="[ command.is_done & command.failed ? 'negative' : '', command.is_done & !command.failed ? 'positive': '' ,'nowrap']"
                  >
                  <td>
                      <i v-if="command.is_done" v-bind:class="[ command.is_done & command.failed ? 'attention icon' : '', command.is_done & !command.failed ? 'icon checkmark': '' ]"></i>
                      <i v-else class="notched circle loading icon"></i>
                  </td>
                  <td class="right aligned">{{command.id}}</td>
                  <td>{{command.cmd | truncate(60)}}</td>
                  <td v-if="command.is_done">{{command.duration}}</td>
                  <td v-else>{{new Date(0).setUTCSeconds(command.started_at) | moment("from", "now")}}</td>
              </tr>
          </table>
        </div>
        <div v-else>No command to show</div>
    </div>
</template>

<script>
import axios from 'axios'
import bus from './bus.js'

export default {
  name: 'commands-list',
  props: [],
  mounted () {
    $('.commands.button').popup({ popup: $('.commands.popup'), on: 'click' })
    $('.ui.toggle.checkbox').checkbox()
    // sync
    this.refreshCommands()
  },
  created () {
    bus.$on('change_command', this.onCommandChanged)
  },
  beforeDestroy () {
    bus.$off('change_command', this.onCommandChanged)
  },
  ready () {
    console.log('command item ready')
  },
  data () {
    return {
      allcmds: false,
      commands: {}
    }
  },
  computed: {
    orderedCommands: function () {
      return _.orderBy(Object.values(this.commands), 'id', -1)
    }
  },
  watch: {
    allcmds: 'showAllToggled'
  },
  methods: {
    showAllToggled () {
      this.refreshCommands()
    },
    onCommandChanged (_id = null, op = null) {
      this.refreshCommands()
    },
    refreshCommands: function () {
      var url = axios.defaults.baseURL + '/commands'
      if (!this.allcmds) { url += '?running=1' }
      axios.get(url)
        .then(response => {
          this.commands = response.data.result
          bus.$emit('num_commands', Object.keys(this.commands).length)
        })
        .catch(err => {
          console.log('Error getting runnings commands: ' + err)
        })
    }

  }
}
</script>

<style>
table .nowrap {
    white-space:  nowrap;
}
.overflowYScroll{
  overflow-y: auto;
  max-height: 600px;
  padding-right: 2px;
}
div.item.event{
  line-height: normal;
}
</style>
