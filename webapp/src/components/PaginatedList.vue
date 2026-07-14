<template>
    <div class="ui main container">
        <div class="ui secondary menu paginated-list-toolbar" v-if="hasContent && isSources">
            <div class="item result-count">
                <small>
                    Showing <b>{{ filteredCount }}</b>
                    <span v-if="filteredCount !== totalCount">&nbsp;of <b>{{ totalCount }}</b></span>
                    &nbsp;{{ type }}
                </small>
            </div>
            <div class="right menu">
                <div class="item">
                    <button
                        class="ui mini labeled icon button"
                        :class="{ basic: !showSourceErrorsOnly, 'source-errors-filter-active': showSourceErrorsOnly }"
                        data-tooltip="Show sources with plugin, dump, upload, inspect, or validation errors"
                        data-position="top center"
                        @click.prevent="toggleSourceErrorsOnly">
                        <i class="exclamation circle icon"></i>
                        Errors
                    </button>
                </div>
                <div class="item">
                    <div class="ui compact mini icon buttons">
                        <button
                            class="ui button"
                            :class="{ active: sourceLayout === 'card', pink: sourceLayout === 'card' }"
                            data-tooltip="Card layout"
                            @click.prevent="setSourceLayout('card')">
                            <i class="th large icon"></i>
                        </button>
                        <button
                            class="ui button"
                            :class="{ active: sourceLayout === 'compact', pink: sourceLayout === 'compact' }"
                            data-tooltip="Compact layout"
                            @click.prevent="setSourceLayout('compact')">
                            <i class="table icon"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div
            v-if="sourceStatusTooltip.visible"
            class="floating-source-status-tooltip"
            :style="{ top: sourceStatusTooltip.top + 'px', left: sourceStatusTooltip.left + 'px' }">
            {{ sourceStatusTooltip.text }}
        </div>

        <div :key="resultsKey" :class="listClass" style="padding: 10px 5px 20px 5px;">
            <!-- SOURCES -->
            <template v-if="isSources && sourceLayout === 'card'">
                <DataSource
                    v-for="(source, index) in arrayResults"
                    :key="'source-card-' + sourceKey(source, index)"
                    :psource="source">
                </DataSource>
            </template>
            <template v-if="isSources && sourceLayout === 'compact'">
                <div class="source-table-shell" v-if="arrayResults.length">
                    <table class="ui very compact selectable single line table source-table">
                        <thead>
                            <tr>
                                <th class="center aligned status-column">Status</th>
                                <th>Source</th>
                                <th>Release</th>
                                <th class="right aligned">Documents</th>
                                <th class="center aligned">Dump</th>
                                <th class="center aligned">Upload</th>
                                <th class="center aligned">Inspect</th>
                                <th>Updated</th>
                                <th class="center aligned actions-column">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(source, index) in arrayResults" :key="'source-row-' + sourceKey(source, index)">
                                <td class="center aligned">
                                    <span
                                        class="source-status-trigger"
                                        :aria-label="sourceErrorTooltip(source)"
                                        tabindex="0"
                                        @mouseenter="showSourceStatusTooltip(source, $event)"
                                        @mouseleave="hideSourceStatusTooltip"
                                        @focus="showSourceStatusTooltip(source, $event)"
                                        @blur="hideSourceStatusTooltip">
                                        <i :class="sourceStatusIcon(source)"></i>
                                    </span>
                                </td>
                                <td class="source-name-cell">
                                    <router-link :to="'/source/' + source._id" class="source-name">
                                        {{ source.name }}
                                    </router-link>
                                    <i
                                        v-if="source.data_plugin && source.data_plugin.plugin.loader === 'advanced'"
                                        title="Advanced Plugin"
                                        class="plugin small gem outline icon advanced"></i>
                                    <div class="source-subtext" v-if="source.data_plugin && source.data_plugin.error">
                                        {{ source.data_plugin.error }}
                                    </div>
                                </td>
                                <td class="source-muted source-release-cell" :title="sourceRelease(source)">
                                    {{ truncateRelease(sourceRelease(source)) }}
                                </td>
                                <td class="right aligned source-docs">{{ source.count | currency('', 0) }}</td>
                                <td class="center aligned">
                                    <span :class="statusLabelClass(sourceDownloadStatus(source))">
                                        {{ sourceDownloadStatus(source) }}
                                    </span>
                                </td>
                                <td class="center aligned">
                                    <span :class="statusLabelClass(sourceStepStatus(source, 'upload'))">
                                        {{ sourceStepStatus(source, 'upload') }}
                                    </span>
                                </td>
                                <td class="center aligned">
                                    <span :class="statusLabelClass(sourceStepStatus(source, 'inspect'))">
                                        {{ sourceStepStatus(source, 'inspect') }}
                                    </span>
                                </td>
                                <td class="source-muted">
                                    <span v-if="source.download && source.download.started_at">
                                        {{ source.download.started_at | moment('from', 'now') }}
                                    </span>
                                    <span v-else>Never</span>
                                </td>
                                <td class="center aligned">
                                    <div class="ui icon buttons mini compact-actions" :class="actionable">
                                        <button
                                            class="ui button"
                                            :class="{ yellow: sourceDownloadStatus(source) === 'downloading', disabled: sourceDumpDisabled(source) }"
                                            :disabled="sourceDumpDisabled(source)"
                                            :data-tooltip="sourceDumpTooltip(source)"
                                            @click.prevent="dumpSource(source)"
                                            v-if="source.download">
                                            <i class="download cloud icon"></i>
                                        </button>
                                        <button
                                            class="ui button"
                                            :class="{ yellow: sourceStepStatus(source, 'upload') === 'uploading', disabled: sourceStepStatus(source, 'upload') === 'uploading' }"
                                            :disabled="sourceStepStatus(source, 'upload') === 'uploading'"
                                            data-tooltip="Upload Data"
                                            @click.prevent="uploadSource(source)"
                                            v-if="source.upload">
                                            <i class="database icon"></i>
                                        </button>
                                        <button
                                            class="ui button"
                                            :class="{ yellow: sourceStepStatus(source, 'inspect') === 'inspecting' }"
                                            data-tooltip="Inspect Data"
                                            @click.prevent="inspectSource(source)">
                                            <i class="unhide icon"></i>
                                        </button>
                                        <button
                                            class="ui button delete-btn"
                                            data-tooltip="Unregister Source"
                                            @click.prevent="showUnregisterSource(source)"
                                            v-if="source.data_plugin">
                                            <i class="trash icon"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </template>
            <!-- APIS -->
            <template v-if="type == 'APIs'">
                <API v-for="api in arrayResults" :key="api._id" :api="api"></API>
            </template>
            <!-- Builds -->
            <template v-if="type == 'Builds'">
                <Build v-for="build in arrayResults" :key="build._id" :pbuild="build" :color="build_colors[build.build_config.name]"></Build>
            </template>
        </div>
        <InspectForm
            v-if="activeInspectSourceId && isSources && sourceLayout === 'compact'"
            :key="'active-inspect-' + activeInspectSourceId"
            :_id="activeInspectSourceId">
        </InspectForm>
        <div
            v-if="unregisterSource"
            id="paginated-source-unregister-modal"
            class="ui basic paginated-source-unregister modal">
            <input
                class="plugin_url"
                type="hidden"
                :value="unregisterSource.data_plugin && unregisterSource.data_plugin.plugin.url" />
            <div class="ui icon header">
                <i class="remove icon"></i>
                Unregister data plugin
            </div>
            <div class="content">
                <p>
                    Are you sure you want to unregister and delete data plugin
                    <b>{{ unregisterSource.name }}</b> ?
                </p>
            </div>
            <div class="actions">
                <div class="ui red basic cancel inverted button">
                    <i class="remove icon"></i>
                    No
                </div>
                <div class="ui green ok inverted button">
                    <i class="checkmark icon"></i>
                    Yes
                </div>
            </div>
        </div>
        <div v-if="hasContent && !filteredCount" class="ui placeholder segment">
            <div class="ui grey header">
                No {{ type }} match the current filters.
            </div>
        </div>
        <!-- PAGINATION CONTROLS -->
        <div class="ui container menu pagination" v-if="hasContent && filteredCount">
            <ul class="item m-0">
                <li>
                    <button class="ui button mini" :class="{'disabled' : page <= 1}"  @click.prevent="prevPage()">
                        <i class="arrow circle left icon"></i> Previous 
                    </button>
                </li>
                <template v-if="groupPages">
                    <li v-show="!startCapLimitReached">
                        <a  class="ui button mini p-1" @click.prevent="previousGroup()">Previous 10</a>
                    </li>
                </template>
                <template v-for="n in pages">
                    <li v-if="n >= startCap && n <= endCap" :key="n">
                        <button 
                        :class="{ 'page-active': page == n, 'blue': page == n, 'white-text': page == n  }"
                        class="ui button mini p-1" 
                        @click.prevent="page = n" v-text="n"></button>
                    </li>
                </template>
                <template v-if="groupPages">
                    <li v-show="!endCapLimitReached">
                        <a  class="ui button mini p-1" @click.prevent="nextGroup()">Next 10</a>
                    </li>
                </template>
                <li>
                    <button class="ui button mini" :class="{'disabled' : page >= pages}" @click.prevent="nextPage()">
                        Next <i class="arrow circle right icon"></i>
                    </button>
                </li>
            </ul>
            <div class="item">
                <select class="ui select dropdown m-0" v-model="perPage" @change="resetPagination" id="perPage">
                    <option value="" disabled>Shown Per Page</option>
                    <option value="10" :selected="perPage == 10">10 per page</option>
                    <option value="20" :selected="perPage == 20">20 per page</option>
                    <option value="50" :selected="perPage == 50">50 per page</option>
                    <option value="100" :selected="perPage == 100">100 per page</option>
                </select>
            </div>
            <div class="item">
                <select class="ui select dropdown m-0" v-model="sortBy" @change="handleSorting" id="SortBy">
                    <option value="" disabled>Sort</option>
                    <option value="A-Z">A-Z</option>
                    <option value="Z-A">Z-A</option>
                </select>
            </div>
        </div>
        <div v-else-if="!hasContent" class="ui placeholder segment">
            <div class="ui grey header">
                No {{type}} to list.
            </div>
        </div>
</div>
</template>

<script>
import axios from 'axios'
import bus from '../bus.js'
import Actionable from '../Actionable.vue'

export default {
    name: 'PaginatedList',
    components:{
        'DataSource': () => import('../DataSource.vue'),
        'API': () => import('../Api.vue'),
        'Build': () => import('../Build.vue'),
        InspectForm: () => import('../InspectForm.vue')
    },
    mixins: [Actionable],
    data: function(){
        return{
            expandArray:false,
            page: 1,
            pages: 1,
            startCap:1,
            endCap:10,
            perPage: 10,
            groupPages: false,
            pageLimit: 10,
            startCapLimitReached: true,
            endCapLimitReached: false,
            sortBy:'',
            showSourceErrorsOnly: false,
            sourceLayout: 'card',
            sourceStatusTooltip: {
                visible: false,
                text: '',
                top: 0,
                left: 0
            },
            activeInspectSourceId: null,
            unregisterSource: null
        }
    },
    props:{
        content: {
            type: Array,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        build_colors: {
            type: Object,
            default: ()=>{
                return {}
            }
        },
        perPageProp: {
            type: Number,
            default: 10
        },
    },
    methods:{
        handleSorting(){
            this.resetPagination()
        },
        calculatePages: function () {
          var self= this
          var perPage = parseInt(self.perPage) || self.perPageProp || 10
          var total = self.sortedContent.length
          self.pages = Math.max(Math.ceil(total / perPage), 1)
          if (self.page > self.pages) {
            self.page = self.pages
          }
          self.setPaginationWindow()
        },
        resetPagination: function () {
          this.hideSourceStatusTooltip()
          this.page = 1
          this.calculatePages()
        },
        setPaginationWindow: function () {
          var self = this
          self.groupPages = self.pages > self.pageLimit
          self.startCap = Math.floor((self.page - 1) / self.pageLimit) * self.pageLimit + 1
          self.endCap = Math.min(self.startCap + self.pageLimit - 1, self.pages)
          self.startCapLimitReached = self.startCap <= 1
          self.endCapLimitReached = self.endCap >= self.pages
        },
        previousGroup: function(){
          var self = this
  
          if (!self.startCapLimitReached) {
            if (self.startCap - self.pageLimit > 0) {
              self.page = self.startCap - self.pageLimit
            } else {
              self.page = 1
            }
            self.setPaginationWindow()
          }
        },
        nextGroup: function(){
          var self = this
  
          if (!self.endCapLimitReached) {
            self.page = Math.min(self.endCap + 1, self.pages)
            self.setPaginationWindow()
          }
        },
        prevPage: function () {
          var self= this
          if (self.page > 1) {
              self.page -= 1
              self.setPaginationWindow()
          }
        },
        nextPage: function () {
          var self= this
          if (self.page < self.pages) {
              self.page += 1
              self.setPaginationWindow()
          }
        },
        toggleSourceErrorsOnly: function () {
          this.hideSourceStatusTooltip()
          this.showSourceErrorsOnly = !this.showSourceErrorsOnly
          this.resetPagination()
        },
        setSourceLayout: function (layout) {
          this.hideSourceStatusTooltip()
          this.sourceLayout = layout
          if (layout !== 'compact') {
            this.activeInspectSourceId = null
            this.unregisterSource = null
          }
        },
        getSortValue: function (item) {
          if (this.type == 'Sources') {
            return item.name || item._id || ''
          } else if (this.type == 'Builds') {
            return item.target_name || ''
          } else if (this.type == 'APIs') {
            return item._id || ''
          }
          return ''
        },
        sourceKey: function (source, index) {
          var key = source && (source._id || source.name || source.target_name)
          return String(key || 'source') + '-' + index
        },
        sourceStepStatus: function (source, subkey) {
          var status = 'unknown'
          if (source && source.hasOwnProperty(subkey) && source[subkey].sources) {
            for (var subsrc in source[subkey].sources) {
              if (['failed', 'inspecting', 'uploading', 'validating'].indexOf(source[subkey].sources[subsrc].status) != -1) {
                status = source[subkey].sources[subsrc].status
                break
              } else {
                status = source[subkey].sources[subsrc].status
              }
            }
          }
          return status
        },
        sourceDownloadStatus: function (source) {
          if (source.download && source.download.status) {
            return source.download.status
          }
          return 'unknown'
        },
        sourceStepErrors: function (source, subkey) {
          var errors = []
          if (source && source.hasOwnProperty(subkey) && source[subkey].sources) {
            for (var subsrc in source[subkey].sources) {
              if (source[subkey].sources[subsrc].error) {
                errors.push(source[subkey].sources[subsrc].error)
              }
            }
          }
          return errors
        },
        sourceInspectErrors: function (source) {
          var errors = this.sourceStepErrors(source, 'inspect')
          if (source.inspect && source.inspect.sources) {
            for (var subsrc in source.inspect.sources) {
              if (source.inspect.sources[subsrc].inspect) {
                var results = source.inspect.sources[subsrc].inspect.results || {}
                for (var mode in results) {
                  if (results[mode].errors) {
                    Array.prototype.push.apply(errors, results[mode].errors)
                  }
                }
              }
            }
          }
          return errors
        },
        sourceErrorLabels: function (source) {
          var errs = []
          if (source.data_plugin && source.data_plugin.error) {
            errs.push('Plugin')
          }
          if (this.sourceDownloadStatus(source) === 'failed' || (source.download && source.download.error)) {
            errs.push('Dump')
          }
          if (this.sourceStepStatus(source, 'upload') === 'failed' || this.sourceStepErrors(source, 'upload').length) {
            errs.push('Upload')
          }
          if (this.sourceStepStatus(source, 'inspect') === 'failed' || this.sourceInspectErrors(source).length) {
            errs.push('Inspect')
          }
          if (this.sourceStepStatus(source, 'validate') === 'failed' || this.sourceStepErrors(source, 'validate').length) {
            errs.push('Validate')
          }
          return errs
        },
        sourceHasErrors: function (source) {
          return this.sourceErrorLabels(source).length > 0
        },
        sourceErrorTooltip: function (source) {
          var labels = this.sourceErrorLabels(source)
          if (labels.length) {
            return labels.join(' - ') + ' error'
          }
          if (source.locked) {
            return 'Locked'
          }
          return 'No errors'
        },
        showSourceStatusTooltip: function (source, event) {
          var rect = event.currentTarget.getBoundingClientRect()
          this.sourceStatusTooltip = {
            visible: true,
            text: this.sourceErrorTooltip(source),
            top: rect.top - 8,
            left: Math.max(12, rect.left - 8)
          }
        },
        hideSourceStatusTooltip: function () {
          this.sourceStatusTooltip.visible = false
        },
        sourceStatusIcon: function (source) {
          if (this.sourceHasErrors(source)) {
            return 'red exclamation circle icon pulsing'
          }
          if (source.locked) {
            return 'blue lock icon'
          }
          if (['downloading', 'uploading', 'inspecting', 'validating'].indexOf(this.sourceDownloadStatus(source)) !== -1 ||
            ['uploading', 'inspecting', 'validating'].indexOf(this.sourceStepStatus(source, 'upload')) !== -1 ||
            ['uploading', 'inspecting', 'validating'].indexOf(this.sourceStepStatus(source, 'inspect')) !== -1 ||
            ['uploading', 'inspecting', 'validating'].indexOf(this.sourceStepStatus(source, 'validate')) !== -1) {
            return 'blue sync alternate icon pulsing'
          }
          return 'green check circle icon'
        },
        statusLabelClass: function (status) {
          var color = 'grey'
          if (status === 'failed') {
            color = 'red'
          } else if (['downloading', 'uploading', 'inspecting', 'validating'].indexOf(status) !== -1) {
            color = 'yellow'
          } else if (['success', 'uploaded', 'downloaded', 'inspected'].indexOf(status) !== -1) {
            color = 'green'
          }
          return ['ui', color, 'mini', 'label', 'source-status-label']
        },
        sourceRelease: function (source) {
          if (source.download) {
            return source.download.release || 'Unknown'
          } else if (source.upload && source.upload.sources) {
            var versions = []
            for (var subsrc in source.upload.sources) {
              if (source.upload.sources[subsrc].release) {
                versions.push(source.upload.sources[subsrc].release)
              }
            }
            if (versions.length > 1) {
              return 'Multiple versions'
            } else if (versions.length == 1) {
              return versions[0]
            }
          }
          return 'Unknown'
        },
        truncateRelease: function (release) {
          var value = String(release || 'Unknown')
          var dateMatch = value.match(/\d{4}-\d{2}-\d{2}/)
          if (dateMatch) {
            var dateEnd = dateMatch.index + dateMatch[0].length
            var displayEnd = Math.min(dateEnd + 8, value.length)
            var displayValue = value.slice(0, displayEnd).replace(/[-_.]+$/, '')
            return value.length > displayEnd ? displayValue + '...' : value
          }
          var maxLength = 24
          return value.length > maxLength ? value.slice(0, maxLength).replace(/[-_.]+$/, '') + '...' : value
        },
        sourceDumpDisabled: function (source) {
          return this.sourceDownloadStatus(source) === 'downloading' ||
            Boolean(source.download && source.download.dumper && source.download.dumper.disabled)
        },
        sourceDumpTooltip: function (source) {
          if (source.download && source.download.dumper && source.download.dumper.disabled) {
            return 'Dumper disabled'
          }
          return 'Download Data'
        },
        dumpSource: function (source) {
          if (this.sourceDumpDisabled(source)) {
            return
          }
          axios.put(axios.defaults.baseURL + `/source/${source.name}/dump`, {})
            .then(response => {
              console.log(response.data.result)
            })
            .catch(err => {
              console.log('Error getting job manager information: ' + err)
            })
        },
        uploadSource: function (source) {
          if (this.sourceStepStatus(source, 'upload') === 'uploading') {
            return
          }
          axios.put(axios.defaults.baseURL + `/source/${source.name}/upload`, {})
            .then(response => {
              console.log(response.data.result)
            })
            .catch(err => {
              console.log('Error getting job manager information: ' + err)
            })
        },
        inspectSource: function (source) {
          this.activeInspectSourceId = source._id
          this.$nextTick(function () {
            bus.$emit('do_inspect', ['src', source._id])
          })
        },
        showUnregisterSource: function (source) {
          var self = this
          var url = source.data_plugin && source.data_plugin.plugin.url
          self.unregisterSource = source
          self.$nextTick(function () {
            $('#paginated-source-unregister-modal')
              .modal('setting', {
                detachable: false,
                onHidden: function () {
                  self.unregisterSource = null
                },
                onApprove: function () {
                  axios.delete(axios.defaults.baseURL + '/dataplugin/unregister_url', { data: { url: url } })
                    .then(response => {
                      console.log(response.data.result)
                      return true
                    })
                    .catch(err => {
                      console.log(err)
                      console.log('Error unregistering repository URL: ' + err.data.error)
                    })
                }
              })
              .modal('show')
          })
        },
    },
    computed: {
        isSources: function () {
            return this.type == 'Sources'
        },
        hasContent: function () {
            return Boolean(this.content && this.content.length)
        },
        totalCount: function () {
            return this.content ? this.content.length : 0
        },
        filteredCount: function () {
            return this.sortedContent.length
        },
        listClass: function () {
            if (this.isSources && this.sourceLayout === 'compact') {
                return 'paginated-list-results compact-source-results'
            }
            return 'paginated-list-results ui flex justify-evenly flex-wrap'
        },
        resultsKey: function () {
            return [
                this.type,
                this.isSources ? this.sourceLayout : 'default',
                this.showSourceErrorsOnly ? 'errors' : 'all',
                this.page,
                this.perPage,
                this.sortBy,
                this.sortedContent.length
            ].join('-')
        },
        filteredContent: function () {
            var content = this.content ? this.content.slice() : []
            if (this.isSources && this.showSourceErrorsOnly) {
                content = content.filter(source => this.sourceHasErrors(source))
            }
            return content
        },
        sortedContent: function () {
            var content = this.filteredContent.slice()
            if (this.sortBy == 'A-Z' || this.sortBy == 'Z-A') {
                content.sort((a, b) => {
                    var textA = String(this.getSortValue(a)).toUpperCase()
                    var textB = String(this.getSortValue(b)).toUpperCase()
                    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0
                })
                if (this.sortBy == 'Z-A') {
                    content.reverse()
                }
            }
            return content
        },
        arrayResults: function () {
            var perPage = parseInt(this.perPage) || this.perPageProp || 10
            var start = (this.page - 1) * perPage,
                end = start + perPage;
            return this.sortedContent.slice(start, end);
        },
    },
    mounted: function(){
        this.perPage = this.perPageProp ? this.perPageProp : 10;
        this.calculatePages();
        //  console.log('SEL', this.perPage)
    },
    beforeDestroy: function () {
        $('.paginated-source-unregister.modal').remove()
    },
    watch:{
        content:{
            handler(){
                this.resetPagination();
            },
            deep: true
        },
    }
}
</script>

<style scoped>
    .page-active{
        background-color: rgb(153, 184, 16) !important;
        color: white !important;
    }
    .pagination{
        margin-bottom: 100px !important;
    }
    .paginated-list-toolbar {
        align-items: center;
        border-bottom: 1px solid rgba(34, 36, 38, .08) !important;
        margin-bottom: .5rem !important;
    }
    .paginated-list-toolbar .result-count {
        color: rgba(0, 0, 0, .55);
    }
    .source-errors-filter-active {
        background: #fff7ed !important;
        color: #9a3412 !important;
        box-shadow: 0 0 0 1px #fdba74 inset !important;
    }
    .source-errors-filter-active:hover,
    .source-errors-filter-active:focus {
        background: #ffedd5 !important;
        color: #7c2d12 !important;
    }
    .compact-source-results {
        display: block;
        width: 100%;
    }
    .source-table-shell {
        width: 100%;
        overflow-x: auto;
        border: 1px solid rgba(34, 36, 38, .10);
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 1px 2px rgba(34, 36, 38, .06);
    }
    .source-table {
        margin: 0 !important;
        border: 0 !important;
    }
    .source-table thead th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: #f8fafc !important;
        color: rgba(0, 0, 0, .62) !important;
        font-size: .78rem;
        text-transform: uppercase;
        letter-spacing: 0;
    }
    .source-table td {
        vertical-align: middle;
    }
    .source-status-trigger {
        display: inline-block;
        line-height: 1;
        outline: none;
    }
    .floating-source-status-tooltip {
        position: fixed;
        z-index: 5000;
        max-width: min(360px, calc(100vw - 24px));
        transform: translateY(-100%);
        padding: .65rem .8rem;
        border: 1px solid rgba(34, 36, 38, .15);
        border-radius: 6px;
        background: #fff;
        color: rgba(0, 0, 0, .82);
        box-shadow: 0 2px 4px rgba(34, 36, 38, .12), 0 2px 10px rgba(34, 36, 38, .15);
        font-size: .9rem;
        line-height: 1.35;
        white-space: normal;
        pointer-events: none;
        text-align: left;
    }
    .source-name-cell {
        min-width: 220px;
        max-width: 360px;
    }
    .source-name {
        color: #a40762;
        font-weight: 700;
    }
    .source-subtext {
        margin-top: .25rem;
        color: #a00202;
        font-size: .78rem;
        white-space: normal;
        word-break: break-word;
    }
    .source-muted {
        color: rgba(0, 0, 0, .58);
    }
    .source-release-cell {
        max-width: 170px;
        white-space: nowrap;
    }
    .source-docs {
        font-variant-numeric: tabular-nums;
    }
    .source-status-label {
        min-width: 72px;
        text-align: center;
    }
    .status-column {
        width: 70px;
    }
    .actions-column {
        width: 180px;
    }
    .compact-actions {
        white-space: nowrap;
    }
    .card{
        flex-basis: 300px;
        max-width: 300px !important;
        margin: 10px;
    }
</style>
