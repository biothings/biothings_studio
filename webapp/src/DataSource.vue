<template>
    <div id="data-source" class="ui card">
        <div class="content">

            <!-- locked -->
            <i class="right floated lock icon blue" v-if="source.locked"></i>


            <!-- in progress -->
            <i class="right floated database icon pulsing" v-if="upload_status === 'uploading'"></i>
            <i class="right floated cloud download icon pulsing" v-if="download_status === 'downloading'"></i>
            <i class="right floated unhide icon pulsing" v-if="inspect_status === 'inspecting'"></i>





            <div class="left aligned header word-wrap" v-if="source.name">
                <router-link :to="'/source/' + source._id" class="ui pink header">
                    <h3>
                        {{ source.name }}
                        <i v-if="source.data_plugin && source.data_plugin.plugin.loader === 'advanced'"
                            title="Advanced Plugin" class="plugin small gem outline icon advanced"></i>
                    </h3>
                </router-link>
                <!-- error -->
                <div class="right floated" :data-tooltip="getAllErrors()" data-position="bottom left">
                    <i class="red exclamation circle icon pulsing"
                        v-if="[download_status, upload_status, inspect_status].indexOf('failed') !== -1"></i>

                </div>
            </div>

            <div class="meta" style="overflow:hidden">
                <div v-if="source.download && source.download.started_at">
                    <small class="time"><i class="clock icon outline"></i> Updated
                        {{ source.download.started_at | moment('from', 'now') }}</small>
                </div>
                <div v-else>
                    <small class="time">Never updated</small>
                </div>
                <div><small class="category">{{ release }}</small></div>


            </div>

            <div class="left aligned description">
                <div>
                    <div class="ui clearing divider"></div>
                    <div class="green text">
                        <i class="file outline icon"></i>
                        {{ source.count | currency('', 0) }} documents
                    </div>
                </div>
            </div>
        </div>

        <div class="extra content light-grey" :class="actionable">
            <span v-if="source.data_plugin && source.data_plugin.error">
                <div class="plugin-error">
                    <i class="red alarm icon"></i>
                    {{ source.data_plugin.error }}
                </div>
            </span>
            <span v-else>
                <!-- DOWNLOAD -->
                <div class="ui icon buttons left floated mini">
                    <div class="tooltip-wrapper" :data-tooltip="source.download && source.download.dumper && source.download.dumper.disabled
                        ? 'Dumper disabled'
                        : 'Download Data'
                        " data-position="top center">
                        <button class="ui button m-1" :class="{
                            yellow: download_status === 'downloading',
                            disabled:
                                source.download &&
                                source.download.dumper &&
                                source.download.dumper.disabled
                        }" :disabled="download_status === 'downloading' ||
                            (source.download &&
                                source.download.dumper &&
                                source.download.dumper.disabled)
                            " v-if="source.download" @click="do_dump">
                            <i class="download cloud icon labeled" data-content="Dump"></i>
                        </button>
                    </div>
                </div>

                <!-- UPLOAD -->
                <div class="ui icon buttons left floated mini">
                    <button class="ui button m-1" data-tooltip="Upload Data" @click="do_upload"
                        :class="{ yellow: upload_status === 'uploading' }" v-if="source.upload">
                        <i class="database icon labeled" data-content="Upload"></i>
                    </button>
                </div>

                <!-- INSPECT -->
                <div class="ui icon buttons left floated mini">
                    <button class="ui button m-1" data-tooltip="Inspect Data" @click="inspect"
                        :class="{ yellow: inspect_status === 'inspecting' }">
                        <i class="unhide icon labeled" data-content="Inspect"></i>
                    </button>
                </div>
            </span>

            <!-- DELETE -->
            <div class="ui icon buttons right floated mini">
                <button class="ui button delete-btn" data-tooltip="Delete Source" @click="unregister"
                    v-if="source.data_plugin">
                    <i class="trash icon labeled" data-content="Unregister"></i>
                </button>
            </div>
        </div>

        <!-- Inspect form -->
        <inspect-form :_id="source._id" :select_data_provider="true"></inspect-form>

        <!-- Unregister modal -->
        <div v-if="source.data_plugin" :class="[source.name, 'ui basic unregister modal']">
            <input class="plugin_url" type="hidden" :value="source.data_plugin.plugin.url" />
            <div class="ui icon header">
                <i class="remove icon"></i>
                Unregister data plugin
            </div>
            <div class="content">
                <p>
                    Are you sure you want to unregister and delete data plugin
                    <b>{{ source.name }}</b> ?
                </p>
            </div>
            <div class="actions">
                <div class="ui red basic cancel inverted button">
                    @@ -104,72 +129,72 @@
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import InspectForm from './InspectForm.vue'
import BaseDataSource from './BaseDataSource.vue'
import Actionable from './Actionable.vue'

export default {
    name: 'data-source',
    props: ['psource'],
    components: { InspectForm },
    mixins: [BaseDataSource, Actionable],
    mounted() {
        $('select.dropdown').dropdown()
        $(this.$el).find('[data-tooltip]').popup();
    },
    data() {
        return {
            // this object is set by API call, whereas 'psource' prop
            // is set by the parent
            source_from_api: null
        }
    },
    computed: {
        source: function () {
            // select source from API call preferably
            return this.source_from_api || this.psource
        }
    },
    methods: {
        do_dump: function () {
            // just "eat" mouse event to clean final call
            return this.dump()
        },
        do_upload: function () {
            // just "eat" mouse event to clean final call
            return this.upload()
        }
    }
}
</script>

<style>
a {
    color: #0b0089;
}

.plugin-error {
    color: #a00202;
    word-wrap: break-word;
}

.plugin.icon {
    padding-left: 1em !important;
}

.advanced {
    color: rgb(165, 195, 250) !important;
}

.manifest {
    color: lightgrey !important;
}

.m-1 {
    margin: .15rem !important;
}

.tooltip-wrapper {
    display: inline-block;
    /* keeps layout identical */
}
</style>
