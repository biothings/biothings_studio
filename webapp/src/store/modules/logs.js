import axios from 'axios'

const getLogDate = (type, date) => {
    //ideal format is YYYYMMDD
    if (type == 'build') {
        //covid_who_clinical_trials_202105270830_udmfle16
        let pieces = date.split('_')
        let found = pieces.filter(item => /^\d+$/.test(item))
        found = found[0] && found[0].length > 8 ? found[0].substring(0, 8) : found[0]
        return found.length == 8 ? found : false
    } else {
        //2021-05-27-07:15 or 2021-05-27
        let pieces = date.split('-')
        pieces.length == 4 ? pieces.splice(-1, 1) : false
        pieces = pieces.join('')
        return pieces.length == 8 ? pieces : false
    }
}

export const logs = {
    state: {
        logs:[],
        logName: ''
    },
    mutations: {
        saveLogs(state, payload){
            state.logs = payload.logs
        },
        saveLogName(state, payload){
            state.logName = payload.logName
        }
    },
    actions: {
        getLogsFor ({ commit}, payload) {
            let fileName = payload.fileName
            console.log(`%c 🔖 Getting -${payload.type}- logs for <${fileName}>`, 'color:violet')
            console.log('%c 💾 FILE >> ' + fileName, 'color:pink')
            commit('saveLogName', {logName: fileName})

            try {
                axios.get(axios.defaults.baseURL + '/log/' + fileName).then(res=>{
                    // console.log('LOGS RES', res.data.length)
                    let lines = res.data.split("\n")
                    if (lines.length && lines[0].length) {
                        commit('saveLogs', {logs: lines})
                    } else {
                        commit('saveLogs', {logs: ['👌 [OK] Nothing to report, everything looks good!']})
                    }
                }).catch(err=>{
                    commit('saveLogs', {logs: [`😿 [NOT AVAILABLE] -${payload.type}- logs are not available for for <${fileName}>`]});
                    console.log(`%c 🔖 Failed to get -${payload.type}- logs for <${fileName}> due to ${err}`, 'color:coral')
                });
            } catch (error) {
                console.log(`%c 🔖 Failed to get -${payload.type}- logs for <${fileName}> due to ${error}`, 'color:coral')
                commit('saveLogs', {logs: [`😿 [NOT AVAILABLE] No -${payload.type}- logs for <${fileName}>`]})
            }
        },
    },
    getters: {
        logs: state => {
            return state.logs
        },
        logName: state => {
            return state.logName
        },
    }
}