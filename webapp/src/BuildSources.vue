<template>
    <table class="ui small very compact blue table">
        <thead>
            <tr>
                <th>Datasource</th>
                <th>Version</th>
            </tr>
        </thead>
        <tbody v-if="build._meta">
            <tr v-for="(info,src) in build._meta.src" :key="src + Math.floor(Math.random() * 90 + 10)">
                <td v-if="info.url"><a :href="info.url">{{src}}</a></td>
                <td style="word-break: break-all;" v-else>{{src}}</td>
                <td style="word-break: break-all;">{{info.version}}</td>
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
  name: 'build-sources',
  props: ['build'],
}
</script>
