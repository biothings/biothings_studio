<template>
</template>

<script>
import axios from 'axios'
import bus from './bus.js'

export default {
  name: 'base-data-source',
  // Note: we don't declare "source", it must be defined in subclass/mixed
  // (sometimes it's a prop, sometimes it's a data field
  created() {
    bus.$on('change_source', this.onSourceChanged)
  },
  beforeDestroy() {
    bus.$off('change_source', this.onSourceChanged)
  },
  data() {
    return {
      limit_error: null,
      sample_error: null,
      validations: {}
    }
  },
  computed: {
    inspect_status: function () {
      return this.getStatus('inspect')
    },
    upload_status: function () {
      return this.getStatus('upload')
    },
    validate_status: function () {
      return this.getStatus('validate')
    },
    download_status: function () {
      if (this.source.download && this.source.download.status) { return this.source.download.status } else { return 'unknown status' }
    },
    inspect_error: function () {
      var errors = []
      if (this.source.inspect) {
        var srcs = this.source.inspect.sources
        for (var subsrc in srcs) {
          if (srcs[subsrc].inspect) {
            var results = srcs[subsrc].inspect.results
            for (var mode in results) {
              if (results[mode].errors) {
                Array.prototype.push.apply(errors, results[mode].errors)
              }
            }
          }
        }
      }
      return errors
    },
    upload_error: function () {
      return this.getError('upload')
    },
    validate_error: function () {
      return this.getError('validate')
    },
    download_error: function () {
      if (this.source.download && this.source.download.error) { return this.source.download.error }
    },
    release: function () {
      if (this.source.download) {
        return this.source.download.release
      } else if (this.source.upload) {
        var versions = []
        $(this.source.upload.sources).each(function () {
          versions.push(this.release)
        })
        if (versions.length > 1) { return 'Multiple versions' } else if (versions.length == 1) { return versions[0] } else { return '?' }
      } else {
        return 'Unknown'
      }
    }
  },
  methods: {
    getStatus: function (subkey) {
      var status = 'unknown'
      if (this.source.hasOwnProperty(subkey)) {
        for (var subsrc in this.source[subkey].sources) {
          if (['failed', 'inspecting', 'uploading', 'validating'].indexOf(this.source[subkey].sources[subsrc].status) != -1) {
            status = this.source[subkey].sources[subsrc].status
            // precedence to these statuses
            break
          } else { status = this.source[subkey].sources[subsrc].status }
        }
      }
      return status
    },
    getError: function (subkey) {
      var errors = []
      if (this.source.hasOwnProperty(subkey)) {
        for (var subsrc in this.source[subkey].sources) {
          if (this.source[subkey].sources[subsrc].error) { errors.push(this.source[subkey].sources[subsrc].error) }
        }
      }
      return errors
    },
    getAllErrors: function () {
      var errs = []
      if (this.download_error) { errs.push('Dump') }
      if (this.upload_error.length) { errs.push('Upload') }
      if (this.inspect_error.length) { errs.push('Inspect') }
      if (this.validate_error.length) { errs.push('Validate') }
      return errs.join(' - ') + ' error'
    },
    dump: function (release = null, force = null) {
      var data = {}
      if (release != null && release) { data.release = release }
      if (force != null) { data.force = force }
      axios.put(axios.defaults.baseURL + `/source/${this.source.name}/dump`, data)
        .then(response => {
          console.log(response.data.result)
        })
        .catch(err => {
          console.log('Error getting job manager information: ' + err)
        })
    },
    upload: function (subsrc = null, release = null, validate = false) {
      var srcname = this.source.name
      if (subsrc != null) { srcname += '.' + subsrc } // upload a sub-source only
      let payload = {};
      if (release && release.trim() !== '') {
        payload.release = release;
      }
      if (validate) {
        payload.validate = true;
      }
      axios.put(axios.defaults.baseURL + `/source/${srcname}/upload`, payload)
        .then(response => {
          console.log(response.data.result)
        })
        .catch(err => {
          console.log('Error getting job manager information: ' + err)
        })
    },
    createValidation(subsrc = null) {
      var srcname = this.source.name
      if (subsrc != null) srcname += '.' + subsrc
      return axios.put(axios.defaults.baseURL + `/source/${srcname}/create_validation`)
        .then(response => {
          // Step 1: The create request finished
          // Step 2: Now fetch the updated validations
          return this.getValidations(subsrc)
        })
        .catch(err => {
          console.error('Error creating validation:', err)
          throw err
        })
    },
    validate: function (subsrc = null, model_file = null) {
      var srcname = this.source.name
      if (subsrc != null) { srcname += '.' + subsrc } // validate a sub-source only
      let payload = {};
      if (model_file && model_file.trim() !== '') {
        payload.model_file = model_file;
      }
      axios.post(axios.defaults.baseURL + `/source/${srcname}/validate`, payload)
        .then(response => {
          // console.log(response.data.result)
        })
        .catch(err => {
          console.log('Error getting job manager information: ' + err)
        })
    },
    getValidations: function (subsrc = null) {
      var srcname = this.source.name
      if (subsrc != null) {
        srcname += '.' + subsrc
      }
      return axios.get(axios.defaults.baseURL + `/source/${srcname}/validations`)
        .then(response => {
          this.$set(this.validations, subsrc, response.data.result)
          // console.log(response.data.result)
          return response.data.result
        })
        .catch(err => {
          console.log('Error getting validations information:', err)
          throw err
        })
    },
    unregister: function () {
      $(`.${this.source.name}.ui.basic.unregister.modal`)
        .modal('setting', {
          onApprove: function () {
            var url = $(this).find('input.plugin_url').val()
            axios.delete(axios.defaults.baseURL + '/dataplugin/unregister_url', { data: { url: url } })
              .then(response => {
                console.log(response.data.result)
                return true
              })
              .catch(err => {
                console.log(err)
                console.log('Error unregistering repository URL: ' + err.data.error)
              })
          }
        })
        .modal('show')
    },
    inspect: function () {
      bus.$emit('do_inspect', ['src', this.source._id])
    },
    mark_dump_success(dry_run = false, dry_run_callback) {
      axios.put(axios.defaults.baseURL + `/source/${this.source.name}/mark_dump_success`, { dry_run: dry_run })
        .then(response => {
          if (dry_run && dry_run_callback) {
            dry_run_callback(response.data.result)
          }
          console.log(response.data.result)
        })
        .catch(err => {
          console.log('Error getting job manager information: ' + err)
        })
    },
    onSourceChanged(_id = null, op = null) {
      // this method acts as a dispatcher, reacting to change_source events, filtering
      // them for the proper source
      // _id null: event containing change about a source but we don't know which one
      if (_id == null || this.source._id != _id) {
        return
      } else {
        return this.getSource()
      };
    },
    getSource: function () {
      var self = this
      axios.get(axios.defaults.baseURL + '/source/' + this.source._id)
        .then(response => {
          this.source_from_api = response.data.result
        })
        .catch(err => {
          console.log('Error getting sources information: ' + err)
        })
    }
  }
}
</script>
