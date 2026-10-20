// The webapp's settings in the browser's localStorage, which vue-localstorage gave Vue 2 as
// Vue.localStorage: get() returns null for a missing or empty value, and both ignore a
// localStorage the browser doesn't allow
function get (key) {
  try {
    return window.localStorage.getItem(key) || null
  } catch (err) {
    return null
  }
}

function set (key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch (err) {
    console.error(`Can't store ${key} in localStorage:`, err)
  }
}

export default { get, set }
