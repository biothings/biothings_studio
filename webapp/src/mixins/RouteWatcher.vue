<script>

export default {
    name: 'RouteWatcher',   
    watch: {
    '$route': function(n, o) {
      this.loadData()
    },
  },
}

</script>
