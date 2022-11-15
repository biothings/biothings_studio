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


function flattenInspectionData(data, current_deep=0, parent_name, parent_type) {
    const ROOT_FIELD = "__root__"
    const STATS_FIELD = "_stats"
    const DICT_TYPE = "dict"
    const LIST_TYPE = "list"
    const TYPE_PREFIX = "__type__:"

    let field_values = []
    if (current_deep == 0) {
        field_values.push({
            field: ROOT_FIELD, type: DICT_TYPE, stats: data._stats
        })
    }

    for (const field_name in data) {
        if (field_name === STATS_FIELD) {
            continue
        }

        if (! field_name.startsWith(TYPE_PREFIX)) {
            parent_type = DICT_TYPE
            let new_parent_name = field_name
            if (parent_name) {
                new_parent_name = parent_name + '.' + field_name
            }
            const sub_field_values = flattenInspectionData(
                data[field_name],
                current_deep + 1,
                new_parent_name,
                parent_type
            )
            field_values = field_values.concat(sub_field_values)
            continue
        }

        const field_type = field_name.replace(TYPE_PREFIX, "")
        if (field_type === LIST_TYPE) {
            parent_type = LIST_TYPE

            const sub_field_values = flattenInspectionData(
                data[field_name],
                current_deep + 1,
                parent_name,
                parent_type
            )

            if (sub_field_values.length == 1 && sub_field_values[0].field === parent_name) {
                field_values.push({
                    field: parent_name,
                    type: parent_type + ' of ' + sub_field_values[0].type,
                    stats: data[field_name]._stats
                })
            }
            else {
                field_values.push({
                    field: parent_name,
                    type: parent_type,
                    stats: data[field_name]._stats,
                })
                field_values = field_values.concat(sub_field_values)
            }
        }
        else {
            field_values.push({
                field: parent_name, type: field_type, stats: data[field_name]._stats
            })
        }
    }

    return field_values
}

export {
    html2json,
    getVersionAsString,
    flattenInspectionData,
}
