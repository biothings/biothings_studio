<template>
    <div :class="['ui', color, 'statistic']">
        <div class="value">
            <i :class="[ icon, 'icon']"></i> 
            <template v-if="type == 'documents' ">{{ value | formatNumber }}</template>
            <template v-else>{{ value }}</template>
        </div>
        <div class="label p-1 m-1">
            {{ name }}
        </div>
    </div>
</template>

<script>
export default {
    name:'Statistic',
    props: {
        color: {
            type: String,
            default: 'blue'
        },
        type: {
            type: String,
            required: true
        },
        status: {
            type: Object,
            required: true
        },
    },
    computed:{
        icon: function(){
            switch (this.type) {
                case 'source':
                    return 'database'
                case 'build':
                    return 'cubes'
                case 'documents':
                    return 'file'
                default:
                    return 'circle'
            }
        },
        name: function(){
            switch (this.type) {
                case 'source':
                    return 'Sources'
                case 'build':
                    return 'Builds'
                case 'documents':
                    return 'Documents'
                default:
                    return ''
            }
        },
        value: function(){
            if(this.type == 'documents'){
                return this.status?.['source']?.[this.type] || ''
            }
            else{
                return Object.prototype.hasOwnProperty.call(this.status, this.type) ? this.status[this.type].total : ''
            }
        }
    }
}
</script>

<style>
    
</style>