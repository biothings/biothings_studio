<template>
    <div class="ui small feed" v-if="build.jobs">
        <div class="event">
            <i class="ui hourglass start icon"></i>
            <div class="content">
                <div class="summary">
                    Build starts
                    <div class="date">
                        {{build.started_at | moment('MMM Do YYYY, h:mm:ss a')}}
                    </div>
                </div>
            </div>
        </div>

        <div class="event" v-for="(job, i) in build.jobs" :key="job.status+i">
            <i class="ui green checkmark icon" v-if="job.status == 'success'"></i>
            <i class="ui orange exclamation circle icon" v-else-if="job.status == 'canceled'"></i>
            <i class="ui red warning sign icon" v-else-if="job.status == 'failed'"></i>
            <i class="ui pulsing unhide icon" v-else-if="job.status == 'inspecting'"></i>
            <i class="ui pulsing exchange icon" v-else-if="job.status == 'diffing'"></i>
            <i class="ui pulsing bookmark icon" v-else-if="job.status == 'indexing'"></i>
            <i class="ui pulsing cube icon" v-else></i>
            <div class="content">
                <div class="summary">
                    {{displayStep(job, i)}}
                    <div class="date">
                        {{job.time}}
                    </div>
                </div>
                <div class="meta" v-if="job.sources">
                    <i class="database icon"></i>{{job.sources.join(", ")}}
                </div>
                <div class="meta" v-if="job.err">
                    <i class="warning icon"></i>{{job.err}}
                </div>
            </div>

        </div>
    </div>
</template>

<script>
export default {
  name: 'build-logs',
  props: ['build'],
  methods: {
    indexModeForJob: function (job, index) {
      if (job.mode) {
        return job.mode
      }
      if (job.step != 'index' || !this.build.jobs) {
        return null
      }
      for (var i = index - 1; i >= 0; i--) {
        var previous = this.build.jobs[i]
        if (previous.step == 'pre-index') {
          return previous.mode || null
        }
        if (previous.step == 'index' || previous.step == 'post-index') {
          break
        }
      }
      return null
    },
    displayStep: function (job, index) {
      var mode = this.indexModeForJob(job, index)
      if (mode) {
        return `${job.step} (${mode})`
      }
      return job.step
    },
  },
}
</script>
