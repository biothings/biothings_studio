// The app-wide event bus. Vue 3 instances have no $on/$off/$emit, so this replaces the empty
// Vue 2 instance it was, keeping its methods: a handler throwing is logged without stopping the
// other handlers or the code emitting the event, and handlers added or removed during an
// event only apply to the next ones
class EventBus {
  constructor () {
    this.handlers = {}
  }

  $on (event, handler) {
    (this.handlers[event] = this.handlers[event] || []).push(handler)
  }

  $off (event, handler) {
    const handlers = this.handlers[event] || []
    const i = handlers.lastIndexOf(handler)
    if (i >= 0) {
      handlers.splice(i, 1)
    }
  }

  $emit (event, ...args) {
    for (const handler of [...(this.handlers[event] || [])]) {
      try {
        handler(...args)
      } catch (err) {
        console.error(`Error in event handler for "${event}":`, err)
      }
    }
  }
}

export default new EventBus()
