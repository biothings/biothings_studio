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


function validateInspectionData(data) {
    /* This method will check and flag any field name which:
    - contains whitespace
    - contains upper cased letter or special characters (lower-cased is recommended, in some cases the upper-case field names are acceptable, so we should raise it as a warning and let user to confirm it's necessary)
    - when the type inspection detects more than one types (but a mixed or single value and an array of same type of values are acceptable, or the case of mixed integer and float should be acceptable too)
    */
    const SPACE_PATTERN = /\s/
    const INVALID_CHARACTERS_PATTERN = /[^a-zA-Z0-9_.]/
    const NUMBERIC_FIELDS = ['int', 'float']

    const field_validations = {}

    for (const field_values of data) {
        const field_name = field_values.field
        const type = field_values.type

        if (!(field_name in field_validations)) {
            field_validations[field_name] = {
                messages: new Set(),
                types: new Set(),
                hasMultipleTypes: false,
            }
        }

        if (field_validations[field_name]["hasMultipleTypes"] && field_validations[field_name]["messages"].size > 0) {
            continue
        }

        if (field_name.search(SPACE_PATTERN) > -1) {
            field_validations[field_name]["messages"].add("field name contains whitespace.")
        }
        if (field_name !== field_name.toLowerCase()) {
            field_validations[field_name]["messages"].add("field name contains uppercase.")
        }
        if (field_name.search(INVALID_CHARACTERS_PATTERN) > -1) {
            field_validations[field_name]["messages"]
            .add("field name contains special character. Only alphanumeric, dot, or underscore are valid.")
        }

        for (const existing_type of field_validations[field_name]["types"]) {
            const normalized_type = type.replace('list of ', '')
            const normalized_existing_type = existing_type.replace('list of ', '')

            if (normalized_type === normalized_existing_type) {
                continue
            }

            if (NUMBERIC_FIELDS.indexOf(normalized_type) > -1 && NUMBERIC_FIELDS.indexOf(normalized_existing_type) > -1) {
                continue
            }

            field_validations[field_name]["hasMultipleTypes"] = true
            field_validations[field_name]["messages"].add("field name has more than one type.")
        }

        field_validations[field_name]["types"].add(type)
    }

    return field_validations
}


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
    validateInspectionData,
}
