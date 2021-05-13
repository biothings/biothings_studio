<template>
    <div class="ui main container">
        <div id="data-source-grid" class="ui flex justify-start flex-wrap" style="padding: 10px 5px 20px 5px;">
            <!-- SOURCES -->
            <template v-if="type == 'Sources'">
                <DataSource v-for="(source, index) in arrayResults" :key="index" :psource="source"></DataSource>
            </template>
            <!-- APIS -->
            <template v-if="type == 'APIs'">
                <API v-for="(api, index) in arrayResults" :key="index" :api="api"></API>
            </template>
            <!-- Builds -->
            <template v-if="type == 'Builds'">
                <Build v-for="(build, index) in arrayResults" :key="index" :pbuild="build" :color="build_colors[build.build_config.name]"></Build>
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
                    <option value="10" :selected="perPage == 10">10 per page</option>
                    <option value="20" :selected="perPage == 20">20 per page</option>
                    <option value="50" :selected="perPage == 50">50 per page</option>
                    <option value="100" :selected="perPage == 100">100 per page</option>
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

export default {
    name: 'PaginatedList',
    components:{
       'DataSource': () => import('../DataSource.vue'),
       'API': () => import('../API.vue'),
       'Build': () => import('../Build.vue')
    },
    data: function(){
        return{
            expandArray:false,
            page: 1,
            pages: 1,
            startCap:0,
            endCap:10,
            perPage: 10,
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
        perPageProp: {
            type: Number,
            default: 10
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
        },
    },
    mounted: function(){
        this.calculatePages();
         $('.ui.select.dropdown').dropdown()
         this.perPage = this.perPageProp ? this.perPageProp : 10;
        //  console.log('SEL', this.perPage)
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
    .card{
        flex-basis: 300px;
        max-width: 300px !important;
        margin: 10px;
    }
</style>