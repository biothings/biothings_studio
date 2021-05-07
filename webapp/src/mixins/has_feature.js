import bus from '../bus.js'
import Vue from 'vue'

export var has_feature = {
    methods:{
        has_feature (name) {
            if (Vue.config && Vue.config.hub_features) {
                var hasIt = Vue.config.hub_features.includes(name)
                if (hasIt) {
                    bus.$emit(`feature_${name}`)
                }
                return hasIt
            } else {
                return null
            }
        }
    }
}