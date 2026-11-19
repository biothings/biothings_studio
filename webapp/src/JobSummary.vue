<template>
  <div class="ui center aligned tiny m-auto">
    <!-- commands -->
    <button
        class="ui compact labeled icon commands button tiny" :class="[!num_commands?'':'yellow']">
        <i class="settings icon"></i>
        {{num_commands}}
    </button>
    <div class="ui commands popup transition hidden">
        <commands-list></commands-list>
    </div>
    <!-- jobs (processes) -->
    <button
        class="ui compact labeled icon processes button tiny"
        >
        <i class="rocket icon"></i>
        {{job_manager.queue ? job_manager.queue.process.running.length : '?'}}/{{job_manager.queue ? job_manager.queue.process.max : '?'}}
    </button>
    <div class="ui processes popup transition hidden">
        <processes-list v-bind:processes="processes"></processes-list>
    </div>
    <!-- jobs (threads) -->
    <button
        class="ui compact labeled icon threads button tiny">
      <i class="lightning icon"></i>
      {{job_manager.queue ? job_manager.queue.thread.running.length : '?'}}/{{job_manager.queue ? job_manager.queue.thread.max : '?' }}
    </button>
    <div class="ui threads popup transition hidden">
        <threads-list v-bind:threads="threads"></threads-list>
    </div>
    <!-- jobs (pendings) -->
    <button class="ui compact labeled icon button tiny"
      data-tooltip="Number of queued jobs"
      data-position="bottom left"
      v-if="job_manager.queue">
      <i class="hourglass start icon"></i>
      {{job_manager.queue.thread.pending.length + job_manager.queue.process.pending.length }}
    </button>
    <!-- memory -->
    <button class="ui compact labeled icon button tiny"
      data-tooltip="Amount of memory hub is currently using"
      data-position="bottom left"
      v-if="job_manager.queue">
      <i class="right microchip icon"></i>
      {{ $filters.pretty_size(job_manager.memory)}}
    </button>
    <!-- free-threading (an icon only: a label would wrap the menu on two lines) -->
    <button class="ui compact icon button tiny free-threading" :class="free_threading.color"
      :data-tooltip="free_threading.tooltip"
      data-position="bottom right"
      v-if="free_threading">
      <i class="icon" :class="free_threading.icon"></i>
    </button>
  </div>
</template>

<script>
import axios from 'axios'
import CommandsList from './CommandsList.vue'
import ProcessesList from './ProcessesList.vue'
import ThreadsList from './ThreadsList.vue'
import bus from './bus.js'

const POLL_JOBS_INTERVAL = 3000 // when needed, poll job manager every X ms

export default {
  name: 'job-summary',
  mounted () {
    this.getJobSummary()
    // setup menu, looking only inside this component (other components can use the same classes)
    const $el = $(this.$el)
    $el.find('.processes.button').popup({
      popup: $el.find('.processes.popup'),
      on: 'click',
      // default position and fallback if no space left
      position: 'bottom left',
      lastResort: 'left',
      onVisible: () => { this.onJobsOpened(true) },
      onHide: () => { this.onJobsOpened(false) }
    })
    $el.find('.threads.button').popup({
      popup: $el.find('.threads.popup'),
      on: 'click',
      // default position and fallback if no space left
      position: 'bottom left',
      lastResort: 'left',
      onVisible: () => { this.onJobsOpened(true) },
      onHide: () => { this.onJobsOpened(false) }
    })
  },
  created () {
    bus.$on('num_commands', this.updateNumCommands)
  },
  beforeUnmount () {
    bus.$off('num_commands', this.updateNumCommands)
  },
  data () {
    return {
      num_commands: 0,
      job_manager: {},
      processes: {},
      threads: {},
      show_allcmds: false,
      jobs_interval: null
      // errors: [],
    }
  },
  computed: {
    // whether the hub runs CPU-bound jobs in threads instead of processes (HUB_FREE_THREADED_WORKERS),
    // and whether its GIL is enabled; null, showing nothing, when both are as usual or the hub doesn't
    // tell (older biothings versions)
    free_threading () {
      const workers = this.job_manager.free_threaded_workers
      const gil = this.job_manager.gil_enabled
      if (workers && gil === false) {
        return {
          color: 'teal',
          icon: 'stream',
          tooltip: 'Free-threaded workers: the GIL is disabled, so CPU-bound jobs (merges, diffs, uploads) ' +
            'run in parallel in threads of the hub, counted with the threads rather than the processes'
        }
      }
      if (workers && gil === true) {
        return {
          color: 'orange',
          icon: 'exclamation triangle',
          tooltip: 'Free-threaded workers, but the GIL was enabled again by importing an extension module ' +
            'without free-threading support: the Python code of CPU-bound jobs no longer runs in parallel. ' +
            'They are counted with the threads rather than the processes'
        }
      }
      if (!workers && gil === false) {
        return {
          color: '',
          icon: 'stream',
          tooltip: 'Free-threaded Python, with the GIL disabled, but CPU-bound jobs run in forked processes ' +
            '(HUB_FREE_THREADED_WORKERS is off)'
        }
      }
      return null
    }
  },
  watch: {
    num_commands: function (newv, oldv) {
      if (newv == 0) {
        // console.log('Stop polling jobs'),
        this.stopPollJobs()
      }
      if (oldv == 0 && newv > 0) {
        // console.log('Start polling jobs'),
        this.startPollJobs()
      }
    }
  },
  components: { CommandsList, ProcessesList, ThreadsList },
  methods: {
    updateNumCommands: function (num) {
      this.num_commands = num
      this.getJobSummary()
    },
    startPollJobs: function () {
      if (this.jobs_interval == null) { this.jobs_interval = setInterval(this.getJobSummary, POLL_JOBS_INTERVAL) }
    },
    stopPollJobs: function () {
      clearInterval(this.jobs_interval)
      this.jobs_interval = null
    },
    getJobSummary: function () {
      axios.get(axios.defaults.baseURL + '/job_manager')
        .then(response => {
          this.job_manager = response.data.result
          this.processes = this.job_manager.queue.process
          this.threads = this.job_manager.queue.thread
        })
        .catch(err => {
          console.log('Error getting job manager information: ' + err)
        })
    },
    onJobsOpened: function (do_poll) {
      // console.log(do_poll)
      if (do_poll) {
        // we force the poll
        this.getJobSummary()
        this.startPollJobs()
      } else if (this.num_commands == 0) {
        // but we let component to decide whether to continue polling or not
        this.stopPollJobs()
      }
    }
  }
}
</script>

<style scoped>
/* wrapped on a few lines, rather than one line as wide as the text */
.free-threading[data-tooltip]:after {
  white-space: normal;
  width: 24rem;
  max-width: 90vw;
}
</style>
