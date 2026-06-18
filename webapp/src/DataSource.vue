<template>
    <div id="data-source" :class="compact ? 'data-source-compact' : 'ui card'">
        <template v-if="compact">
            <div class="compact-source-main">
                <div class="compact-source-title">
                    <router-link :to="'/source/' + source._id" class="compact-source-name">
                        {{ source.name }}
                    </router-link>
                    <span class="compact-source-error-badge" :data-tooltip="operationErrorSummary"
                        data-position="top center" v-if="hasOperationError">
                        <i class="exclamation circle icon"></i>{{ operationErrorSummary }}
                    </span>
                    <span class="compact-source-indicators">
                        <i v-if="source.data_plugin && source.data_plugin.plugin.loader === 'advanced'"
                            title="Advanced Plugin" class="plugin small gem outline icon advanced"></i>
                        <i class="lock icon blue" data-tooltip="Locked" data-position="top center"
                            v-if="source.locked"></i>
                        <i class="database icon pulsing" data-tooltip="Uploading" data-position="top center"
                            v-if="upload_status === 'uploading'"></i>
                        <i class="cloud download icon pulsing" data-tooltip="Downloading" data-position="top center"
                            v-if="download_status === 'downloading'"></i>
                        <i class="unhide icon pulsing" data-tooltip="Inspecting" data-position="top center"
                            v-if="inspect_status === 'inspecting'"></i>
                        <i class="red alarm icon" :data-tooltip="source.data_plugin.error" data-position="top center"
                            v-if="source.data_plugin && source.data_plugin.error"></i>
                    </span>
                </div>
                <div class="compact-source-meta">
                    <span class="compact-source-time" v-if="source.download && source.download.started_at">
                        <i class="clock icon outline"></i>{{ source.download.started_at | moment('from', 'now') }}
                    </span>
                    <span class="compact-source-time" v-else>Never updated</span>
                    <span class="compact-source-count">
                        <i class="file outline icon"></i>{{ source.count | currency('', 0) }} docs
                    </span>
                    <span class="compact-source-release" :title="release">{{ release }}</span>
                </div>
            </div>

            <div class="compact-source-actions" :class="actionable">
                <template v-if="!(source.data_plugin && source.data_plugin.error)">
                    <button class="ui icon mini button" :class="{
                        yellow: download_status === 'downloading',
                        disabled:
                            source.download &&
                            source.download.dumper &&
                            source.download.dumper.disabled
                    }" :disabled="download_status === 'downloading' ||
                        (source.download &&
                            source.download.dumper &&
                            source.download.dumper.disabled)
                        " v-if="source.download" @click="do_dump" :data-tooltip="source.download && source.download.dumper && source.download.dumper.disabled
                            ? 'Dumper disabled'
                            : 'Download Data'
                            " data-position="top center">
                        <i class="download cloud icon"></i>
                    </button>
                    <button class="ui icon mini button" data-tooltip="Upload Data" data-position="top center"
                        @click="do_upload" :class="{ yellow: upload_status === 'uploading' }" v-if="source.upload">
                        <i class="database icon"></i>
                    </button>
                    <button class="ui icon mini button" data-tooltip="Inspect Data" data-position="top center"
                        @click="inspect" :class="{ yellow: inspect_status === 'inspecting' }">
                        <i class="unhide icon"></i>
                    </button>
                </template>
                <button class="ui icon mini button delete-btn" data-tooltip="Delete Source" data-position="top center"
                    @click="unregister" v-if="source.data_plugin">
                    <i class="trash icon"></i>
                </button>
            </div>
        </template>

        <template v-else>
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
                <div class="right floated" :data-tooltip="operationErrorSummary" data-position="bottom left">
                    <i class="red exclamation circle icon pulsing" v-if="hasOperationError"></i>

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
        </template>

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
                    <i class="remove icon"></i>
                    No
                </div>
                <div class="ui green ok inverted button" :id="source.name + '_unregister_yes'">
                    <i class="checkmark icon"></i>
                    Yes
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
    props: {
        psource: {
            type: Object,
            required: true
        },
        compact: {
            type: Boolean,
            default: false
        }
    },
    components: { InspectForm },
    mixins: [BaseDataSource, Actionable],
    mounted() {
        this.initSemanticUi()
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
        },
        operationErrorTypes: function () {
            var errs = []
            if (this.download_error || this.download_status === 'failed') { errs.push('Dump') }
            if (this.upload_error.length || this.upload_status === 'failed') { errs.push('Upload') }
            if (this.inspect_error.length || this.inspect_status === 'failed') { errs.push('Inspect') }
            if (this.validate_error.length || this.validate_status === 'failed') { errs.push('Validate') }
            return errs
        },
        operationErrorSummary: function () {
            return this.operationErrorTypes.join(' - ') + ' error'
        },
        hasOperationError: function () {
            return this.operationErrorTypes.length > 0
        }
    },
    watch: {
        compact: function () {
            this.$nextTick(this.initSemanticUi)
        }
    },
    methods: {
        initSemanticUi: function () {
            $('select.dropdown').dropdown()
            $(this.$el).find('[data-tooltip]').popup()
        },
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

.data-source-compact {
    align-items: center;
    background: #ffffff;
    border: 1px solid rgba(34, 36, 38, .12);
    border-radius: .28571429rem;
    box-shadow: 0 1px 2px 0 rgba(34, 36, 38, .05);
    display: grid;
    gap: .6rem;
    grid-template-columns: minmax(0, 1fr) auto;
    margin: .25rem;
    min-height: 3rem;
    padding: .45rem .55rem;
}

.data-source-compact:hover {
    box-shadow: 0 0 8px rgb(190, 190, 190);
}

.compact-source-main {
    flex: 1 1 auto;
    min-width: 0;
}

.compact-source-title {
    align-items: center;
    display: flex;
    gap: .25rem;
    min-width: 0;
}

.compact-source-name {
    color: #e03997;
    display: block;
    flex: 0 1 auto;
    font-weight: 700;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.compact-source-error-badge {
    align-items: center;
    background: #fff6f6;
    border: 1px solid #e0b4b4;
    border-radius: .28571429rem;
    color: #db2828;
    display: inline-flex;
    flex: 0 0 auto;
    font-size: .78rem;
    font-weight: 700;
    gap: .2rem;
    line-height: 1;
    max-width: 8.5rem;
    overflow: hidden;
    padding: .22rem .38rem;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.compact-source-error-badge .icon {
    margin: 0 !important;
}

.compact-source-indicators {
    align-items: center;
    display: flex;
    flex: 0 0 auto;
    gap: .1rem;
}

.compact-source-indicators .icon {
    margin: 0 !important;
}

.compact-source-indicators .plugin.icon {
    padding-left: 0 !important;
}

.compact-source-meta {
    align-items: center;
    color: rgba(0, 0, 0, .55);
    display: grid;
    font-size: .78rem;
    gap: .45rem;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    min-width: 0;
    white-space: nowrap;
}

.compact-source-time {
    overflow: hidden;
    text-overflow: ellipsis;
}

.compact-source-count {
    font-weight: 600;
}

.compact-source-release {
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
}

.compact-source-actions {
    display: flex;
    flex: 0 0 auto;
    gap: .2rem;
    justify-self: end;
}

.compact-source-actions .ui.mini.button {
    margin: 0 !important;
    padding: .45rem .55rem;
}

@media only screen and (max-width: 767px) {
    .data-source-compact {
        align-items: flex-start;
        grid-template-columns: 1fr;
    }

    .compact-source-actions {
        justify-self: start;
        width: 100%;
    }
}
</style>
