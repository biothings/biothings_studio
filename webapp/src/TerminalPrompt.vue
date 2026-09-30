<template>
  <div class="term-prompt-area">
    <div class="term-prompt-line">
      <span class="term-prompt">hub&gt;&nbsp;</span>
      <input id="termcommand" ref="input" v-model="line" class="term-command" type="text" autocomplete="off"
        autocapitalize="off" spellcheck="false" :placeholder="placeholder" @keydown="onKeydown" />
    </div>
    <div v-if="suggestions.length" class="term-suggestions">{{ suggestions.join('   ') }}</div>
  </div>
</template>

<script>
// longest prefix shared by all the given strings
function commonPrefix (words) {
  return words.reduce((prefix, word) => {
    while (!word.startsWith(prefix)) {
      prefix = prefix.slice(0, -1)
    }
    return prefix
  })
}

export default {
  name: 'terminal-prompt',
  props: {
    // command names, for Tab completion
    completions: { type: Array, default: () => [] },
    // previously typed command lines, oldest first
    history: { type: Array, default: () => [] },
    placeholder: { type: String, default: 'Type a command, or help...' }
  },
  data () {
    return {
      line: '',
      draft: '', // line being typed while browsing history
      historyIndex: null,
      suggestions: []
    }
  },
  watch: {
    line () {
      this.suggestions = []
    }
  },
  methods: {
    focus () {
      this.$refs.input.focus()
    },
    onKeydown (evt) {
      if (evt.key === 'Enter') {
        var line = this.line
        this.line = ''
        this.historyIndex = null
        this.$emit('run', line)
      } else if (evt.key === 'ArrowUp' || evt.key === 'ArrowDown') {
        evt.preventDefault()
        this.browseHistory(evt.key === 'ArrowUp' ? -1 : 1)
      } else if (evt.key === 'Tab') {
        evt.preventDefault()
        this.complete()
      } else if (evt.ctrlKey && evt.key.toLowerCase() === 'l') {
        evt.preventDefault()
        this.$emit('clear')
      } else if (evt.ctrlKey && evt.key.toLowerCase() === 'c' && !window.getSelection().toString()) {
        this.line = ''
        this.historyIndex = null
      } else if (evt.key === 'Escape') {
        this.suggestions = []
      }
    },
    browseHistory (step) {
      if (!this.history.length) {
        return
      }
      if (this.historyIndex === null) {
        if (step > 0) {
          return
        }
        this.draft = this.line
        this.historyIndex = this.history.length
      }
      var index = this.historyIndex + step
      if (index < 0) {
        return
      }
      if (index >= this.history.length) {
        this.historyIndex = null
        this.line = this.draft
      } else {
        this.historyIndex = index
        this.line = this.history[index]
      }
      this.$nextTick(() => {
        var input = this.$refs.input
        input.selectionStart = input.selectionEnd = input.value.length
      })
    },
    complete () {
      // complete the command name (first word), accepting hyphens for underscores
      var match = /^(\s*)(\S*)$/.exec(this.line)
      if (!match) {
        return
      }
      var typed = match[2].replace(/-/g, '_')
      var candidates = this.completions.filter(name => name.startsWith(typed))
      if (!candidates.length) {
        return
      }
      var completed = candidates.length === 1 ? candidates[0] + ' ' : commonPrefix(candidates)
      this.line = match[1] + completed
      this.$nextTick(() => {
        this.suggestions = candidates.length > 1 ? candidates : []
      })
    }
  }
}
</script>

<style scoped>
.term-prompt-line {
  display: flex;
  align-items: baseline;
}

.term-prompt {
  color: #21ba45;
  font-weight: bold;
  white-space: pre;
}

.term-command {
  flex: 1;
  background: transparent;
  border: 0;
  outline: none;
  color: white;
  font-family: inherit;
  font-size: inherit;
  font-weight: bold;
  padding: 0;
}

.term-command::placeholder {
  color: #666;
  font-weight: normal;
}

.term-suggestions {
  color: #8a8a8a;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
