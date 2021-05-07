<template>
    <div class="ui main container">
        <div id="data-source-grid" class="ui grid" style="padding: 10px 5px 20px 5px;">
            <!-- SOURCES -->
            <template v-if="type == 'Sources'">
                <div v-for="(source, index) in arrayResults" class="four wide column" :key="index">
                    <DataSource :psource="source"></DataSource>
                </div>
            </template>
            <!-- APIS -->
            <template v-if="type == 'APIs'">
                <div v-for="(api, index) in arrayResults" class="five wide column" :key="index">
                    <API :api="api"></API>
                </div>
            </template>
            <!-- Builds -->
            <template v-if="type == 'Builds'">
                <div v-for="(build, index) in arrayResults" class="five wide column" :key="index">
                    <Build :pbuild="build" :color="build_colors[build.build_config.name]"></Build>
                </div>
            </template>
        </div>
        <!-- PAGINATION CONTROLS -->
        <div class="ui container menu pagination" v-if="content && content.length">
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
                        <a  class="ui button mini p-1" @click.prevent="nextGroup()">next 10</a>
                    </li>
                </template>
                <li>
                    <button class="ui button mini" :class="{'disabled' : page >= pages}" @click.prevent="nextPage()">
                        Next <i class="arrow circle right icon"></i>
                    </button>
                </li>
            </ul>
            <div class="item">
                <select class="ui select dropdown m-0" v-model="perPage" @change="calculatePages" id="perPage">
                    <option value="" disabled>Shown Per Page</option>
                    <option value="10" selected>10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="100">100 per page</option>
                </select>
            </div>
        </div>
        <div v-else class="ui placeholder segment">
            <div class="ui grey header">
                No {{type}} to list.
            </div>
        </div>
</div>
</template>

<script>
import DataSource from '../DataSource.vue';
import API from '../API.vue';
import Build from '../Build.vue';

export default {
    name: 'PaginatedList',
    components:{
       DataSource,
       API,
       Build
    },
    data: function(){
        return{
            expandArray:false,
            perPage: 10,
            page: 1,
            pages: 1,
            startCap:0,
            endCap:10,
            groupPages: false,
            pageLimit: 10,
            startCapLimitReached: true,
            endCapLimitReached: false,
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
    },
    methods:{
        calculatePages: function () {
          var self= this;
          self.pages = Math.ceil(self.content.length / self.perPage);
  
          if (self.pages > self.pageLimit) {
            self.groupPages =  true;
          }
        },
        previousGroup: function(){
          var self = this;
  
          if (!self.startCapLimitReached) {
            if (self.startCap-10 > 0) {
              self.page = self.startCap-10
              self.startCap = self.startCap-10
              self.endCap = self.endCap-10
              self.endCapLimitReached = false;
            }else {
              self.page = 1
              self.startCap = 0
              self.endCap = 10
              self.startCapLimitReached = true;
              self.endCapLimitReached = false;
            }
          }
        },
        nextGroup: function(){
          var self = this;
  
          if (!self.endCapLimitReached) {
            if (self.endCap+10 < self.pages) {
              self.page = self.startCap+10
              self.startCap = self.startCap+10
              self.endCap = self.endCap+10
              self.startCapLimitReached = false;
            }else {
              self.page = self.startCap+10
              self.startCap = self.startCap+10
              self.endCap = self.pages
              self.endCapLimitReached = true;
              self.startCapLimitReached = false;
            }
          }
        },
        prevPage: function () {
          var self= this;
          if (self.page > 1)
              self.page -= 1
        },
        nextPage: function () {
          var self= this;
          if (self.page < self.pages)
              self.page += 1
        },
    },
    computed: {
        arrayResults: function () {
            var start = (this.page - 1) * this.perPage,
                end = start + this.perPage;
            return this.content && this.content.slice(start, end);
        }
    },
    mounted: function(){
        this.calculatePages();
         $('.ui.select.dropdown').dropdown()
    },
    watch:{
        content:{
            handler(){
                this.calculatePages();
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
</style>