<template>
    <table class="ui small very compact grey table">
        <thead>
            <tr>
                <th>Stats</th>
                <th>Count</th>
            </tr>
        </thead>
        <tbody v-if="build._meta">
            <tr v-for="(count,stat) in build._meta.stats" :key="count+stat">
                <td >{{stat}}</td>
                <td v-if="typeof(count) == 'number'">{{count | currency("",0)}}</td>
                <td v-else>
                    <a v-on:click="showStatsInModal" :data-stats="JSON.stringify(count)" >View</a>
                </td>
            </tr>
        </tbody>
        <tfoot v-else>
            <tr><th>No data</th>
                <th></th>
            </tr>
        </tfoot>
    </table>
</template>

<script>

export default {
  name: 'build-stats',
  props: ['build'],
  methods: {
    showStatsInModal: event => {
        const stats_detail = $(event.target).data('stats')
        $("body").modal('alert', `<pre>${JSON.stringify(stats_detail, null, 2)}</pre>`)
    },
  }
}
</script>
