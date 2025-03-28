<template>
    <span>
        <span v-if="source.upload && source.upload.sources">
            <!-- If there's more than one subsrc, show the tab menu -->
            <span v-if="Object.keys(source.upload.sources).length > 1">
                <div id="validate-srcs" class="ui top attached tabular menu">
                    <a v-for="(subsrc_data, subsrc, i) in source.upload.sources" :key="subsrc"
                        :class="['green item', i === 0 ? 'active' : '']" :data-tab="'validate_' + subsrc">
                        {{ subsrc }}
                        <button class="reset ui button" v-if="subsrc_data.uploader === null" @click="reset(subsrc)"
                            data-tooltip="Datasource broken, click to remove">
                            <i class="close icon"></i>
                        </button>
                        <i class="red exclamation circle icon pulsing" v-if="subsrc_data.status === 'failed'"></i>
                    </a>
                </div>
            </span>

            <!-- TAB CONTENT (unified) -->
            <div v-for="(subsrc_data, subsrc, i) in source.upload.sources" :key="subsrc"
                :class="['ui bottom attached tab segment', i === 0 ? 'active' : '']" :data-tab="'validate_' + subsrc">
                <!-- If this subsrc IS validated, show validation details -->
                <div v-if="
                    source.validate &&
                    source.validate.sources &&
                    source.validate.sources[subsrc]
                ">
                    <div class="ui two grid">
                        <div class="row">
                            <!-- Left column: validation details -->
                            <div class="ten wide column">
                                <table class="ui small very compact definition collapsing table">
                                    <tbody>
                                        <tr>
                                            <td>Release</td>
                                            <td>{{ source.validate.sources[subsrc].release }}</td>
                                        </tr>
                                        <tr>
                                            <td>Data folder</td>
                                            <td>
                                                <a v-if="source.validate.sources[subsrc].data_folder" :href="source.validate.sources[subsrc].data_folder
                                                    | replace('/data/biothings_studio', '')
                                                    ">
                                                    {{ source.validate.sources[subsrc].data_folder }}
                                                </a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Status</td>
                                            <td>
                                                <i :class="source.validate.sources[subsrc].status === 'failed'
                                                    ? 'red'
                                                    : 'green'
                                                    ">
                                                    {{ source.validate.sources[subsrc].status }}
                                                </i>
                                            </td>
                                        </tr>
                                        <tr v-if="source.validate.sources[subsrc].error">
                                            <td>Error</td>
                                            <td>
                                                <div class="error-message red">
                                                    {{ source.validate.sources[subsrc].error }}
                                                </div>
                                                <TracebackViewer :source="source" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Last Validated</td>
                                            <td>
                                                {{ source.validate.sources[subsrc].started_at }}
                                                <i v-if="source.validate.sources[subsrc].started_at">
                                                    ({{ source.validate.sources[subsrc].started_at |
                                                        moment('from', 'now') }})
                                                </i>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Duration</td>
                                            <td>{{ source.validate.sources[subsrc].time }}</td>
                                        </tr>
                                        <tr>
                                            <td class="ui grey">Uploader</td>
                                            <td v-if="source.validate.sources[subsrc].uploader">
                                                {{ source.validate.sources[subsrc].uploader.name }}
                                                <span v-if="source.validate.sources[subsrc].uploader.dummy">
                                                    (dummy)
                                                </span>
                                            </td>
                                            <td v-else>
                                                <div class="red">
                                                    No uploader found, datasource may be broken
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Model File</td>
                                            <td>{{ source.validate.sources[subsrc].model_file }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <!-- Right column: model selection, etc. -->
                            <div class="six wide column" v-if="source.validate.sources[subsrc].uploader">
                                <div :class="['ui form upload', actionable, subsrc]">
                                    <div class="fields"
                                        style="display: flex; justify-content: flex-end; align-items: flex-start;">
                                        <div class="required field" style="margin-right: 1rem;">
                                            <label>Select Model</label>
                                            <div class="ui selection dropdown custom-dropdown-width"
                                                :ref="'dropdown_' + subsrc" :data-subsrc="subsrc">
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
                                            <button :class="[
                                                'ui labeled small icon button same-width-btn',
                                                (source.validate.sources[subsrc].status === 'validating' || isGeneratingModel[subsrc]) ? 'disabled' : ''
                                            ]" @click="do_validate(subsrc)"
                                                :disabled="isGeneratingModel[subsrc] || source.validate.sources[subsrc].status === 'validating'">
                                                <i class="database icon"></i>
                                                Validate
                                            </button>
                                            <button class="ui labeled small icon button same-width-btn"
                                                @click="onClickGenerateModel(subsrc)" style="margin-top: 0.5rem;"
                                                :disabled="isGeneratingModel[subsrc]">
                                                <i class="cubes icon"></i>
                                                <span v-if="!isGeneratingModel[subsrc]">Generate Pydantic Model</span>
                                                <span v-else>
                                                    <i class="notched circle loading icon"></i>
                                                    Generating...
                                                </span>
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

                <!-- Else: no validated data yet for this subsrc -->
                <div v-else>
                    <div class="ui warning message">
                        <i class="warning icon"></i>
                        There is no validation information yet.
                        Please click "Validate" below to validate this datasource.
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
                                        <tr>
                                            <td class="ui grey">Model File</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="six wide column" v-if="subsrc_data.uploader">
                                <div :class="['ui form upload', actionable, subsrc]">
                                    <div class="fields"
                                        style="display: flex; justify-content: flex-end; align-items: flex-start;">
                                        <div class="field" style="margin-right: 1rem;">
                                            <label>Select Model</label>
                                            <div class="ui selection dropdown custom-dropdown-width"
                                                :ref="'dropdown_' + subsrc" :data-subsrc="subsrc">
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
                                            <button :class="[
                                                'ui labeled small icon button same-width-btn',
                                                (isSourceValidating(subsrc) || isGeneratingModel[subsrc]) ? 'disabled' : ''
                                            ]" @click="do_validate(subsrc)"
                                                :disabled="isGeneratingModel[subsrc] || isSourceValidating(subsrc)">
                                                <i class="database icon"></i>
                                                Validate
                                            </button>
                                            <button class="ui labeled small icon button same-width-btn"
                                                @click="onClickGenerateModel(subsrc)" style="margin-top: 0.5rem;"
                                                :disabled="isGeneratingModel[subsrc]">
                                                <i class="cubes icon"></i>
                                                <span v-if="!isGeneratingModel[subsrc]">Generate Pydantic Model</span>
                                                <span v-else>
                                                    <i class="notched circle loading icon"></i>
                                                    Generating...
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div><!-- /v-else (no validated data) -->
            </div><!-- /v-for (tab content) -->
        </span>

        <!-- If no sources at all -->
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
        this.setup();
        if (this.source.upload && this.source.upload.sources) {
            Object.keys(this.source.upload.sources).forEach(subsrc => {
                // Call the parent’s method that retrieves model files for this subsrc
                this.$parent.getValidations(subsrc).then((modelList) => {
                    // modelList is now `response.data.result`
                    const defaultModel = modelList.find(m => m.replace('_model.py', '') === subsrc)
                    if (defaultModel) {
                        this.setSelectedModel(subsrc, defaultModel)
                        this.$nextTick(() => {
                            $(this.$refs['dropdown_' + subsrc]).dropdown('set selected', defaultModel)
                        })
                    }
                })
            });
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
            isGeneratingModel: {},
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
            return this.$parent.createValidation(subsrc = subsrc)
        },
        do_validate(subsrc) {
            const model = this.selectedModels[subsrc] || null
            return this.$parent.validate(subsrc, model)
        },
        onClickGenerateModel(subsrc) {
            this.$set(this.isGeneratingModel, subsrc, true)
            this.$parent.createValidation(subsrc)
                .then(modelList => {
                    // modelList = this.$parent.validations[subsrc] array
                    const newModel = `${subsrc}_model.py`
                    if (modelList.includes(newModel)) {
                        this.setSelectedModel(subsrc, newModel)
                        this.$nextTick(() => {
                            $(this.$refs['dropdown_' + subsrc]).dropdown('set selected', newModel)
                        })
                    }
                })
                .catch(err => {
                    console.error('Model generation error:', err)
                })
                .finally(() => {
                    this.$set(this.isGeneratingModel, subsrc, false)
                })

        },
        isSourceValidating(subsrc) {
            return (
                this.source.validate &&
                this.source.validate.sources &&
                this.source.validate.sources[subsrc] &&
                this.source.validate.sources[subsrc].status === 'validating'
            )
        },

    }
}
</script>

<style scoped>
#validate-srcs i.red {
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
    /* keep a min-width, but allow expansion if needed */
    min-width: 200px !important;
}

/* Let the text wrap within dropdown items */
.custom-dropdown-width .menu .item {
    /* Make sure whitespace can wrap */
    white-space: normal !important;
    /* Handle breaking long words/strings */
    word-wrap: break-word !important;
    overflow-wrap: anywhere !important;
    /* optionally set a max-width if you want to prevent it from becoming too wide */
    /* max-width: 400px !important; */
}
</style>
