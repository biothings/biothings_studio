module.exports = {
  publicPath: './',
  assetsDir: 'assets',
  configureWebpack: {
    module: {
      rules: [{
        // vue-loader 15 makes each component import its <style> blocks' default exports, which
        // only CSS modules have: webpack 5 warns about it for every component. That code is
        // vue-loader's (X.vue), not the component's own (X.vue?vue&type=script), still checked
        test: /\.vue$/,
        resourceQuery: { not: [/\?vue/] },
        parser: { importExportsPresence: false }
      }]
    }
  }
}
