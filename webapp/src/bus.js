// The app-wide event bus. Vue 3 instances have no $on/$off/$emit, so this replaces the empty
// Vue 2 instance it was, keeping its methods: a handler throwing is logged without stopping the
// other handlers or the code emitting the event, and handlers added or removed during an
// event only apply to the next ones
const handlers = {}

function $on (event, handler) {
  (handlers[event] = handlers[event] || []).push(handler)
}

function $off (event, handler) {
  const eventHandlers = handlers[event] || []
  const i = eventHandlers.lastIndexOf(handler)
  if (i >= 0) {
    eventHandlers.splice(i, 1)
  }
}

function $emit (event, ...args) {
  for (const handler of [...(handlers[event] || [])]) {
    try {
      handler(...args)
    } catch (err) {
      console.error(`Error in event handler for "${event}":`, err)
    }
  }
}

export default { $on, $off, $emit }
