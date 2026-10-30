module.exports = {
  root: true,

  env: {
    browser: true,
    node: true
  },

  // loaded by index.html, outside the bundle
  globals: {
    $: 'readonly',
    SockJS: 'readonly'
  },

  extends: [
    'plugin:vue/vue3-essential',
    '@vue/standard'
  ],

  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  },

  overrides: [
    {
      // files indented with 4 spaces rather than Standard's 2, checked with its indent rule at 4
      files: [
        'src/ApiLogViewer.vue',
        'src/BuildMapping.vue',
        'src/DataSource.vue',
        'src/DataSourceDump.vue',
        'src/DataSourceUpload.vue',
        'src/DataSourceValidate.vue',
        'src/components/LogViewer.vue',
        'src/components/NavBar.vue',
        'src/components/PaginatedList.vue',
        'src/components/Statistic.vue',
        'src/components/TracebackViewer.vue',
        'src/mixins/has_feature.js',
        'src/store/modules/logs.js',
        'src/store/store.js',
        'src/utils/utils.js'
      ],
      rules: {
        indent: ['error', 4, { SwitchCase: 1, ignoredNodes: ['TemplateLiteral *'], offsetTernaryExpressions: true }]
      }
    }
  ]
}
