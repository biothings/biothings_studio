<template>
    <span>
        <div class="scrolling menu" v-if="Object.keys(existings).length">
            <div class="item hubconnect"
                v-for="v in existings"
                :key="v.name"
                @click="onClickHubConnect($event, v.name)"
                
            >
                <table class="ui small compact table hubconnect">
                    <tbody>
                        <tr>
                            <td class="collapsing tdhubicon">
                                <img class="hubicon" :src="v.icon"></img>
                            </td>
                            <td class="collapsing twelve wide">
                                <b>{{v.name}}</b>
                            </td>
                            <td class="collapsing hubconnect">
                                <a :href="v.url">
                                    <i class="external alternate icon">
                                    </i>
                                </a>
                            </td>
                            <td class="collapsing hubconnect">
                                <button class="ui small icon button" @click="editConnection($event,v)">
                                    <i class="grey edit icon right floated"></i>
                                </button>
                            </td>
                            <td class="collapsing hubconnect">
                                <button class="ui small icon button" @click="deleteConnection($event,v)">
                                    <i class="grey trash alternate outline icon right floated"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </span>
</template>

<script>
import Vue from 'vue'

export default {
  props: ['existings'],
  methods: {
    deleteConnection (event, conn) {
      // avoid onChange to be triggered
      event.stopPropagation()
      console.log(event)
      console.log(`Delete connection named "${conn.name}"`)
      delete this.$parent.existings[conn.name]
      Vue.localStorage.set('hub_connections', JSON.stringify(this.$parent.existings))
      console.log(this.existings)
      this.$parent.getExistings()
    },
    editConnection (event, conn) {
      // avoid onChange to be triggered
      event.stopPropagation()
      console.log(event)
      this.$parent.newConnection(conn.url)
    },
    onClickHubConnect (event, value) {
        event.stopPropagation()
        this.$parent.changeConnection(value)
    }
  }
};

</script>

<style scoped>
  a {
      color: #218cbc !important;
  }

  .hubicon { width:2.5em !important;}
  .ui.table.hubconnect {border: 0px !important;}
  .ui.menu .ui.dropdown .menu>.item.hubconnect {padding: 0 !important;}
  .ui.compact.table.hubconnect td {padding: .3em .0em .0em 0em;}
  .ui.compact.table.hubconnect {border-radius: unset; cursor: pointer;}
  .tdhubicon {padding: 0.3em 1em 0.3em 0.3em !important;}
  .scrolling.menu {max-height: 15em; width: 62.5%; overflow: auto;}
</style>
