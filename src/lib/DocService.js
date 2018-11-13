/* @flZZow */

/*
 *  Client API for Docservice.io
 *  See https://docservice.io
 */
//import Vue from 'vue'
// import Vuex from 'vuex'

// Vue.use(Vuex)

//import { install } from './install'
import jwtDecode from 'jwt-decode'
import axios from 'axios'
import axiosError from './axiosError.js'
import QueryString from 'query-string'
import { assert, inBrowser } from '../components/misc'

// import { safeJson } from './hierarchy.js'
// import * as util from './hierarchy.js'



// const debug = process.env.NODE_ENV !== 'production'

//const JWT_COOKIE_NAME = 'docservice-jwt'
//const LOGIN_TIMEOUT_DAYS = 3
const NETWORK_ERROR_MSG = 'Could not contact docservice server'

class Docservice {
  // static install: (Vue) => void;
  // static version: string;

  // static install (Vue) {
  //   alert('Install 2...')
  //   // Vue.prototype.$auth = new Docservice()
  //   Vue.prototype.$auth = 123
  //
  //   Object.defineProperty(Vue.prototype, '$content', {
  //     get () { return 987 }
  //   })
  // }

  constructor (options) {

      if (!options) {
        console.error(`Docservice was passed null options, so will be disabled.`)
        this.disabled = true
        return
      }
      this.disabled = false

    console.log('&&& Docservice constructor', options)
    this.host = options.host ? options.host : 'api.docservice.io'
    this.port = options.port ? options.port : 80
    this.version = options.version ? options.version : '2.0'
    this.apikey = options.apikey

    this.knownElementTypes = [ ]

    console.log('&&& Docservice constructor', options)
    this.docservice = { }
    if (options.docservice) {
      this.dshost = options.docservice.host ? options.docservice.host : 'api.docservice.io'
      this.dsport = opdsdocservice.version = options.docservice.version ? options.docservice.version : '2.0'
      this.dsapikey = options.docservice.apikey
    }



    // Remember the options
    this.options = options

    // Current user details
    // this.user = null
    // this.jwt = null
    // this.fromCache = false
  }

  // init (app: any /* Vue component instance */) {
  init (app /* Vue component instance */) {
    console.log('&&& Docservice.init')

    // VVVVV This does not seem to be called
    // alert('za init()')
    process.env.NODE_ENV !== 'production' && assert(
      install.installed,
      `not installed. Make sure to call \`Vue.use(Docservice)\` ` +
      `before creating root instance.`
    )
  }

  endpoint () {
    // console.log('endpoint():', this)
    const protocol = this.protocol ? this.protocol : 'http'
    const endpoint = `${protocol}://${this.host}:${this.port}/api/${this.version}/${this.apikey}`
    return endpoint
  }


  /*
   *  Scan an existing document for data values, and regenerate documents that
   *  might use those values.
   */
  scanDocument (vm, documentId, documentsToBeClone, userID, folderID, currentPageNode) {

    console.log(`Docservice.js:scanDocument()`, documentId)

    return new Promise((resolve, reject) => {

      if (this.options.debug) {
        console.log('select()');
      }
      // if (this.disabled) {
      //   return reject(new Error('Docservice disabled'));
      // }

      let url = `${this.endpoint()}/scanDocument`;
      console.log(`url is ${url}`);
      let params = {
        document_id: documentId,
        documents_to_be_clone: documentsToBeClone,
        user_id: userID,
        folder_id: folderID,
        current_page_node: currentPageNode
      }
      axios({
        method: 'post',
        url,
        headers: {
          // 'Authorization': 'Bearer ' + this.$docservice.jwt,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: params
      })
        .then(response => {
          // JSON responses are automatically parsed.
          console.log(`RESPONSE IS`, response.data)
          let reply = response.data
          return resolve(reply);
        })
        .catch(e => {
          axiosError(vm, url, params, e)
          reject(e)
        })

    })//- promise
  }// scanDocument()

}

// Add the hierarchy manipulation functions
// Docservice.prototype.util = util

Docservice.version = '__VERSION__'
if (inBrowser && window.Vue) {
  window.Vue.use(Docservice)
}

export default Docservice
