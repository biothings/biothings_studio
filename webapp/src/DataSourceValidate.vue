<template>
    <span>
        <span v-if="source.upload && source.upload.sources">
            <!-- Multiple sources tab menu (if >1 source) -->
            <span v-if="Object.keys(source.upload.sources).length > 1">
                <div id="srcs" class="ui top attached tabular menu">
                    <a :class="['green item', i === 0 ? 'active' : '']" :data-tab="'validate_' + subsrc"
                        v-for="(subsrc_data, subsrc, i) in source.upload.sources" :key="i + 'x'">
                        {{ subsrc }}
                        <button class="reset ui button" v-if="source.upload.sources[subsrc].uploader === null"
                            @click="reset(subsrc)" data-tooltip="Datasource broken, click to remove">
                            <i class="close icon"></i>
                        </button>
                        <i class="red exclamation circle icon pulsing" v-if="subsrc_data.status === 'failed'"></i>
                    </a>
                </div>
            </span>

            <!-- If source.validate exists and has at least one validated source -->
            <div v-if="
                source.validate &&
                source.validate.sources &&
                Object.keys(source.validate.sources).length > 0
            ">
                <!-- Display each validated source info -->
                <div :class="['ui bottom attached tab segment', i === 0 ? 'active' : '']"
                    :data-tab="'validate_' + subsrc" v-for="(info, subsrc, i) in source.validate.sources" :key="i">
                    <div class="ui two grid">
                        <div class="row">
                            <!-- Left column: validation details -->
                            <div class="ten wide column">
                                <table class="ui small very compact definition collapsing table">
                                    <tbody>
                                        <tr>
                                            <td>Release</td>
                                            <td>{{ info.release }}</td>
                                        </tr>
                                        <tr>
                                            <td>Data folder</td>
                                            <td>
                                                <a v-if="info.data_folder"
                                                    :href="info.data_folder | replace('/data/biothings_studio', '')">
                                                    {{ info.data_folder }}
                                                </a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Status</td>
                                            <td>
                                                <i :class="info.status === 'failed' ? 'red' : 'green'">
                                                    {{ info.status }}
                                                </i>
                                            </td>
                                        </tr>
                                        <tr v-if="info.error">
                                            <td>Error</td>
                                            <td>
                                                <div class="error-message red">{{ info.error }}</div>
                                                <TracebackViewer :source="source"></TracebackViewer>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Last Validated</td>
                                            <td>
                                                {{ info.started_at }}
                                                <i v-if="info.started_at">
                                                    ({{ info.started_at | moment('from', 'now') }})
                                                </i>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Duration</td>
                                            <td>{{ info.time }}</td>
                                        </tr>
                                        <tr>
                                            <td class="ui grey">Uploader</td>
                                            <td v-if="info.uploader">
                                                {{ info.uploader.name }}
                                                <span v-if="info.uploader.dummy">
                                                    (dummy)
                                                </span>
                                            </td>
                                            <td v-else>
                                                <div class="red">
                                                    No uploader found, datasource may be broken
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="six wide column" v-if="info.uploader">
                                <div :class="['ui form upload', actionable, subsrc]">
                                    <div class="fields"
                                        style="display: flex; justify-content: flex-end; align-items: flex-start;">
                                        <div class="required field" style="margin-right: 1rem;">
                                            <label>Select Model</label>
                                            <div class="ui selection dropdown custom-dropdown-width">
                                                <input type="hidden" name="modelOption" />
                                                <i class="dropdown icon"></i>
                                                <div class="default text">Select Model</div>
                                                <div class="menu">
                                                    <div class="item"
                                                        v-for="modelFile in $parent.validations[subsrc] || []"
                                                        :key="modelFile" :data-value="modelFile"
                                                        :class="{ active: selectedModels[subsrc] === modelFile }"
                                                        @click="setSelectedModel(subsrc, modelFile)">
                                                        {{ modelFile }}
                                                        <span v-if="modelFile.replace('_model.py', '') === subsrc"
                                                            class="ui grey">
                                                            (default)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="field" style="display: flex; flex-direction: column;">
                                            <button class="ui labeled small icon button same-width-btn"
                                                @click="do_validate(subsrc)">
                                                <i class="database icon"></i>
                                                Validate
                                            </button>
                                            <button class="ui labeled small icon button same-width-btn"
                                                @click="do_generate_model(subsrc)" style="margin-top: 0.5rem;">
                                                <i class="cubes icon"></i>
                                                Generate Model
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    <br />

                    <LogViewer type="upload" :item="source" :sub_item_name="subsrc" :key="'uploadlogs_' + subsrc" />
                </div>
            </div>
            <!-- If there is no validated data -->
            <div v-else>
                <div :class="['ui bottom attached tab segment', i === 0 ? 'active' : '']"
                    :data-tab="'validate_' + subsrc" v-for="(info, subsrc, i) in source.upload.sources" :key="i">
                    <div class="ui warning message">
                        <i class="warning icon"></i>
                        There is no validation information yet. Please click "Validate" below to validate this
                        datasource.
                    </div>
                    <div class="ui two grid">
                        <div class="row">
                            <div class="ten wide column">
                                <table class="ui small very compact definition collapsing table">
                                    <tbody>
                                        <tr>
                                            <td>Release</td>
                                            <td class="no-data"></td>
                                        </tr>
                                        <tr>
                                            <td>Data folder</td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td>Status</td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td>Error</td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td>Last Validated</td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td>Duration</td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td class="ui grey">Uploader</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="six wide column" v-if="info.uploader">
                                <div :class="['ui form upload', actionable, subsrc]">
                                    <div class="fields"
                                        style="display: flex; justify-content: flex-end; align-items: flex-start;">
                                        <div class="required field" style="margin-right: 1rem;">
                                            <label>Select Model</label>
                                            <div class="ui selection dropdown custom-dropdown-width">
                                                <input type="hidden" name="modelOption" />
                                                <i class="dropdown icon"></i>
                                                <div class="default text">Select Model</div>
                                                <div class="menu">
                                                    <div class="item"
                                                        v-for="modelFile in $parent.validations[subsrc] || []"
                                                        :key="modelFile" :data-value="modelFile"
                                                        :class="{ active: selectedModels[subsrc] === modelFile }"
                                                        @click="setSelectedModel(subsrc, modelFile)">
                                                        {{ modelFile }}
                                                        <span v-if="modelFile.replace('_model.py', '') === subsrc"
                                                            class="ui grey">
                                                            (default)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="field" style="display: flex; flex-direction: column;">
                                            <button class="ui labeled small icon button same-width-btn"
                                                @click="do_validate(subsrc)">
                                                <i class="database icon"></i>
                                                Validate
                                            </button>
                                            <button class="ui labeled small icon button same-width-btn"
                                                @click="do_generate_model(subsrc)" style="margin-top: 0.5rem;">
                                                <i class="cubes icon"></i>
                                                Generate Model
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </span>

        <!-- No sources uploaded -->
        <div v-else>
            No uploader found for this source.
        </div>
    </span>
</template>

<script>
import Loader from './Loader.vue'
import Actionable from './Actionable.vue'
import TracebackViewer from './components/TracebackViewer.vue'
import AsyncCommandLauncher from './AsyncCommandLauncher.vue'
import LogViewer from './components/LogViewer.vue'

export default {
    name: 'data-source-validate',
    props: ['source'],
    mixins: [AsyncCommandLauncher, Loader, Actionable],
    mounted() {
        this.setup()
        if (this.source.upload && this.source.upload.sources) {
            Object.keys(this.source.upload.sources).forEach(subsrc => {
                this.$parent.getValidations(subsrc)
            })
        }
    },
    components: {
        TracebackViewer,
        LogViewer,
    },
    data() {
        return {
            release: null,
            selectedModels: {},
        }
    },
    methods: {
        setup: function () {
            $('.menu .item').tab()
        },
        setSelectedModel(subsrc, modelFile) {
            this.$set(this.selectedModels, subsrc, modelFile)
        },
        do_generate_model: function (subsrc = null) {
            console.log('do_generate_model', subsrc)
            return this.$parent.createValidation(subsrc = subsrc)
        },
        do_validate(subsrc) {
            const model = this.selectedModels[subsrc] || null
            return this.$parent.validate(subsrc, model)
        },
    }
}
</script>

<style scoped>
#srcs i.red {
    margin-left: 0.3rem;
}

.reset.button {
    font-size: 0.5em !important;
    margin-left: 1em !important;
}

.reset>i {
    margin: 0em !important;
}

.update-source-meta {
    margin-top: 2rem;
}


.error-message {
    max-width: 30vw;
    overflow-x: auto;
    overflow-wrap: normal;
    margin-bottom: 0.5rem;
}

.no-data {
    min-width: 200px
}

.custom-dropdown-width {
    min-width: 200px !important;
}

.custom-dropdown-width .menu {
    min-width: 200px !important;
}

.custom-dropdown-width .menu .item {
    min-width: 200px !important;
}
</style>
