function html2json (html) {
    // remove html tags to get a clean json doc
    html = html || '{}'
    html = html.replace(/<.*?>/g, '') // non-greedy to keep content between tags
    try {
        return JSON.parse(html)
    } catch (err) {
        console.log(`Error parsing mapping: ${err}`)
        console.log(html)
        throw err
    }
};

function getVersionAsString (obj) {
    try {
        if (typeof obj === 'object') {
            return `${obj.branch} [${obj.commit}] [${obj.date}]`
        } else {
            return obj
        }
    } catch (err) {
        console.log(`Error parsing version: ${err}`)
        return ''
    }
};

export {
    html2json,
    getVersionAsString
}