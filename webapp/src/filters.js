import moment from 'moment'
import numeral from 'numeral'

// Vue 3 has no filters: templates call these as $filters.name(value, ...args) where Vue 2 had
// {{ value | name(...args) }}

numeral.register('locale', 'mine', {
  delimiters: {
    thousands: ',',
    decimal: '.'
  },
  abbreviations: {
    thousand: 'thousand',
    million: 'million',
    billion: 'billion',
    trillion: 'trillion'
  }
})
numeral.locale('mine')

export default {
  timesofar (value) {
    const hours = parseInt(Math.floor(value / 3600), 10)
    const minutes = parseInt(Math.floor((value - (hours * 3600)) / 60), 10)
    const seconds = parseInt((value - ((hours * 3600) + (minutes * 60))) % 60, 10)

    const dHours = (hours > 9 ? hours : '0' + hours)
    const dMins = (minutes > 9 ? minutes : '0' + minutes)
    const dSecs = (seconds > 9 ? seconds : '0' + seconds)

    let res = ''
    if (hours) res += dHours + 'h'
    if (minutes) res += dMins + 'm'
    if (seconds) res += dSecs + 's'

    return res
  },

  pretty_size (bytes, precision = 2) {
    const units = [
      'bytes',
      'KB',
      'MB',
      'GB',
      'TB',
      'PB'
    ]

    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
      return '?'
    }

    let unit = 0

    while (bytes >= 1024) {
      bytes /= 1024
      unit++
    }

    return bytes.toFixed(+precision) + ' ' + units[unit]
  },

  formatNumeric (value, fmt) {
    return numeral(value).format(fmt)
  },

  formatNumber (value) {
    return numeral(value).format('0.00 a')
  },

  formatInteger (value) {
    return numeral(value).format('0 a')
  },

  replace (value, what, repl) {
    return value.replace(what, repl)
  },

  // vue2-filters' currency, 1234567.891 => $1,234,567.89
  currency (value, symbol = '$', decimals = 2) {
    value = parseFloat(value)
    if (!isFinite(value)) {
      return ''
    }
    // rounded through the exponent like vue2-filters, so that 1.005 gives 1.01
    const rounded = +(Math.round(+(Math.abs(value) + 'e' + decimals)) + 'e' + -decimals)
    const [int, frac] = rounded.toFixed(decimals).split('.')
    return (value < 0 ? '-' : '') + symbol + int.replace(/\B(?=(\d{3})+$)/g, ',') + (frac ? '.' + frac : '')
  },

  // vue2-filters' truncate, 'lorem ipsum dolor' => 'lorem ipsum dol...'
  truncate (value, length = 15) {
    if (!value || typeof value !== 'string') {
      return ''
    }
    return value.length <= length ? value : value.substring(0, length) + '...'
  },

  // vue-moment's moment, for the two ways it's used: moment(date, format) formats the date,
  // moment(date, 'from', 'now') says how long ago it was. Numbers are seconds since 1970 up to
  // 11 digits, milliseconds otherwise; what moment can't parse is returned as is
  moment (input, method) {
    let date
    if (Array.isArray(input) && typeof input[0] === 'string') {
      date = moment(input[0], input[1], true)
    } else if (typeof input === 'number') {
      date = input.toString().length < 12 ? moment.unix(input) : moment(input)
    } else {
      date = moment(input)
    }
    if (!input || !date.isValid()) {
      console.warn('Could not build a valid `moment` object from input.')
      return input
    }
    return method === 'from' ? date.fromNow() : date.format(method)
  }
}
