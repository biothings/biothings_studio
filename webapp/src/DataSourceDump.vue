<template>
    <div class="ui two grid">
        <div class="row">

            <div class="ten wide column">
                <table class="ui small very compact definition collapsing table">
                    <tbody>
                        <tr>
                            <td >Release</td>
                            <td>
                                {{source.download.release}}
                            </td>
                        </tr>
                        <tr>
                            <td >Status</td>
                            <td>
                                <i :class="source.download.status == 'failed' ? 'red' : 'green'">{{source.download.status}}</i>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <!--i class="folder icon"></i-->
                                Data folder
                            </td>
                            <td>
                                <a v-if="source.download.data_folder" :href="source.download.data_folder | replace('/data/biothings_studio','')">{{ source.download.data_folder }}</a>
                            </td>
                        </tr>
                        <tr v-if="source.download.error">
                            <td >Error</td>
                            <td>
                                <div class="error-message red">{{source.download.error}}</div>
                                <TracebackViewer :source="source"></TracebackViewer>
                            </td>
                        </tr>
                        <tr>
                            <td >Last download</td>
                            <td>{{source.download.started_at}} <i v-if="source.download.started_at">({{source.download.started_at | moment("from", "now")}})</i></td>
                        </tr>
                        <tr>
                            <td >Duration</td>
                            <td>{{source.download.time}}</td>
                        </tr>
                        <tr>
                            <td class="ui grey">Dumper</td>
                            <td>
                                {{source.download.dumper.name}}
                                <span v-if="source.download.dumper.manual">(manual)</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="six wide column">
                <div :class="['ui dump form',source._id, actionable]">
                    <div class="fields">
                        <div class="ten wide field">
                            <div class="ui checkbox">
                                <input type="checkbox" tabindex="0" class="hidden" id="force">
                                <label>Bypass check for new release availability, and force dump</label>
                            </div>
                        </div>
                        <div class="required six wide field">
                            <button :class="['ui labeled small icon button', $parent.download_status == 'downloading' ? 'disabled' : '']" @click="do_dump();">
                                <i class="download cloud icon"></i>
                                Dump
                            </button>
                            <button :class="['ui labeled small icon button teal mark-dump-success', $parent.download_status == 'downloading' ? 'disabled' : '']" @click="$event => show_mark_dump_success_modal()">
                                <i class="download cloud icon"></i>
                                Mark dump success
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="ui basic mark_dump_success modal">
            <!-- <div class="ui icon header">
                Mark datasource as dump successfully.
            </div> -->
            <div class="content">
                <p>Are you sure you want to mark the datasource as dump successful?</p>
                <p>You can tick on the below checkbox to see what will be updated before actually update to the database</p>
                <div class="ui checkbox inverted">
                    <input type="checkbox" name="dry_run" tabindex="0" class="hidden" checked="checked">
                    <label>Dry run?</label>
                </div>

                <div class="dry-run-result-wrapper" v-if="dry_run_result">
                    This is the data will be stored when mark success.
                    <pre class="dry-run-result">{{ JSON.stringify(dry_run_result, null, space=2) }}</pre>
                </div>
            </div>
            <div class="actions">
                <div class="ui red basic cancel inverted button">
                    <i class="remove icon"></i>
                    Cancel
                </div>
                <div class="ui green ok inverted button" @click="do_mark_success();">
                    <i class="checkmark icon"></i>
                    Mark Success
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Actionable from './Actionable.vue'
import TracebackViewer from './components/TracebackViewer.vue'

export default {
  name: 'data-source-dump',
  props: ['source'],
  data () {
    return {
      dry_run_result: null,
    }
  },
  mounted () {
    $('.ui.checkbox')
      .checkbox()
  },
  mixins: [Actionable],
  components: { TracebackViewer },
  methods: {
    do_dump () {
      var field = $(`.ui.dump.form.${this.source._id}`).form('get field', 'force')
      var force = null
      if (field) { force = field.is(':checked') }
      console.log(force)
      return this.$parent.dump(null, force)
    },
    show_mark_dump_success_modal () {
        $('.modal.mark_dump_success').modal('show')
    },
    do_mark_success () {
        const dry_run = $(".modal.mark_dump_success [name=dry_run]").is(":checked")
        this.dry_run_result = null
        return this.$parent.mark_dump_success(dry_run, this.dry_run_callback)
    },
    dry_run_callback (result) {
        this.dry_run_result = result
        setTimeout(() => {
            $('.modal.mark_dump_success').modal('show')
        }, 0);

    },
  }
}
</script>

<style scoped>
.error-message {
    max-width: 30vw;
    overflow-x: auto;
    overflow-wrap: normal;
    margin-bottom: 0.5rem;
}

.mark-dump-success {
    margin-top: 2rem;
}

.dry-run-result-wrapper {
    margin-top: 2rem;
}

.dry-run-result {
    max-height: 350px;
    overflow: auto;
    background-color: white;
    color: black;
}
</style>
