import bus from '../bus.js'
import hub from '../hub.js'

export var has_feature = {
    methods:{
        has_feature (name) {
            if (hub.features) {
                const hasIt = hub.features.includes(name)
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
