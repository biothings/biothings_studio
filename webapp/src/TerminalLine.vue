<template>
  <div class="term-entry">
    <div v-if="entry.kind === 'input'" class="term-input"><span class="term-prompt">hub&gt; </span>{{ entry.text }}</div>
    <div v-else-if="entry.kind === 'job'" :class="['term-job', 'term-job-' + entry.status]">
      <i :class="icon"></i>
      <span class="term-job-id">[#{{ entry.id }}]</span> {{ entry.text }}
      <span class="term-job-status">{{ statusText }}</span>
      <pre v-for="(result, i) in entry.results" :key="i" class="term-text">{{ result }}</pre>
    </div>
    <div v-else-if="entry.kind === 'error'">
      <pre class="term-text term-error">{{ entry.text }}</pre>
      <template v-if="entry.details">
        <a class="term-details-toggle" @click.stop="showDetails = !showDetails">
          {{ showDetails ? 'hide' : 'show' }} traceback
        </a>
        <pre v-if="showDetails" class="term-text term-details">{{ entry.details }}</pre>
      </template>
    </div>
    <pre v-else :class="['term-text', 'term-' + entry.kind]">{{ entry.text }}</pre>
  </div>
</template>

<script>
export default {
  name: 'terminal-line',
  props: ['entry'],
  data () {
    return {
      showDetails: false
    }
  },
  computed: {
    icon () {
      return {
        running: 'notched circle loading icon',
        done: 'check icon term-icon-done',
        failed: 'times icon term-icon-failed',
        unknown: 'question circle outline icon'
      }[this.entry.status]
    },
    statusText () {
      if (this.entry.status === 'running') {
        return 'running in background'
      }
      if (this.entry.status === 'unknown') {
        return `not followed anymore (${this.entry.reason || 'connected to another hub'})`
      }
      return this.entry.status + (this.entry.duration ? ` in ${this.entry.duration}` : '')
    }
  }
}
</script>

<style scoped>
.term-entry {
  margin: 0 0 0.15em 0;
}

.term-text {
  font-family: inherit;
  margin: 0;
  padding: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #c8c8c8;
}

.term-input {
  color: white;
  font-weight: bold;
  white-space: pre-wrap;
  word-break: break-word;
}

.term-prompt {
  color: #21ba45;
}

.term-error {
  color: #ff695e;
}

.term-info {
  color: #8a8a8a;
  font-style: italic;
}

.term-log {
  color: #8a8a8a;
}

.term-warning {
  color: #f2c037;
}

.term-job {
  color: #e0e0e0;
}

.term-job-id {
  color: #54c8ff;
}

.term-icon-done {
  color: #21ba45;
}

.term-icon-failed {
  color: #ff695e;
}

.term-job-status {
  color: #8a8a8a;
  font-style: italic;
}

.term-job-failed .term-text {
  color: #ff695e;
}

.term-details-toggle {
  color: #8a8a8a;
  cursor: pointer;
  font-size: 0.9em;
  text-decoration: underline;
}

.term-details {
  color: #a0a0a0;
  border-left: 2px solid #555;
  padding-left: 0.6em;
}
</style>
