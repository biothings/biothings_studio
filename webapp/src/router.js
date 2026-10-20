import { createRouter, createWebHashHistory } from 'vue-router'

// The routes depend on the hub's features: App.vue adds them once connected (setupUIByFeatures)
export default createRouter({
  history: createWebHashHistory(),
  routes: [],
  linkActiveClass: 'active'
})
