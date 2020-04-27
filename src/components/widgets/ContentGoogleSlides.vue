<template lang="pug">

  .c-google-slides(v-bind:class="[ editModeClass, (pageEditMode=='debug') ? 'tt-container-outline' : '']")

    // View mode
    .container(v-if="pageEditMode==='view'")
      div(v-if="hasExistingDocument === '' && $store.state.user.userMode.currentMode === 'advisor'")
        .my-slides-container
          iframe(:src="src" :docId="docId" :mimeType="mimeType" frameborder="0" zwidth="640" zheight="389" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true" style="height: 105% !important")
        button.button.is-primary(@click="doUpdate", :class="{ 'is-loading': currentlyScanning }") Unlock & Play
        | &nbsp;
        .scanMessage {{scanMessage}}
        .is-clearfix
      div(v-else)
        .my-slides-container
          iframe(:src="src" :docId="docId" :mimeType="mimeType" frameborder="0" zwidth="640" zheight="389" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true")
        | &nbsp;
        button.restore-btn.button.is-primary(v-if="showRestoreBtn && allowRestoreBtn" @click="restore", :class="{ 'is-loading': currentlyScanning }") {{getRestoreBtnLabel}}
        .scanMessage {{scanMessage}}
        .is-clearfix
    // Debug mode
    div(v-else-if="pageEditMode==='debug'", v-on:click.stop="select(element)")
      .c-layout-mode-heading
        edit-bar-icons(:element="element")
        | google slides
      .container
        .my-slides-container.my-dummy-iframe
          .valign
            | Google Slides
            br
            .modeDescription(v-if="haveDocId")
              | {{modeDescription}}
            .modeError(v-else)
              br
              | Document not specified

    // Edit, layout modes
    .container(v-else, v-on:click.stop="select(element)")
      .my-slides-container.my-dummy-iframe
        .valign
          | Google Slides
          br
          .modeDescription(v-if="haveDocId")
            | {{modeDescription}}
          .modeError(v-else)
            br
            | Document not specified
</template>

<script>
import axios from 'axios'
import axiosError from '../../lib/axiosError.js'
import ContentMixins from '../../mixins/ContentMixins'
import CutAndPasteMixins from '../../mixins/CutAndPasteMixins'

export default {
  name: 'content-google-slides',
  props: {
    element: Object,
  },
  mixins: [ ContentMixins, CutAndPasteMixins ],
  data: function () {
    return {
      //docId: '2PACX-1vT14-yIpiY4EbQN0XscNBhMuJDZ-k4n03-cWPEgK_kyCTP35ehchuWiPDrTq2TIGYl6nFToRGQRJXZl',
      src: '',
      hasExistingDocument: '',
      hasBeenUpdated: false
    }
  },
  watch: {
    refreshCounter: function ( ) {
      console.log(`^&#^%$&^%$ WATCHED CHANGED REFRESHCOUNTER`)
      this.funcSrc()
      this.hasClonedDocument()
    },
  },
  computed: {
    refreshCounter: function() {
      return this.$docservice.store.state.refreshCounter
    },
    scanMessage: function () {
      return this.$docservice.store.state.scanMessage
    },
    currentlyScanning: function () {
      return this.$docservice.store.state.currentlyScanning
    },
    getHasbeenUpdated () {
      return this.hasBeenUpdated
    },
    showRestoreBtn: function () {
      return this.element['showRestoreBtn']
    },
    allowRestoreBtn: function () {
      let mode = this.$store.state.user.userMode.currentMode
      switch (mode) {
        case 'client':
          return this.getHasbeenUpdated
          break;
        case 'advisor':
          return true
          break;
        case 'advisor manager':
          return true
          break;
        default:
          return false
          break;
      }
    },
    getRestoreBtnLabel: function () {
      let mode = this.$store.state.user.userMode.currentMode

      switch (mode) {
        case 'client':
          return 'Restore'
          break;
        case 'advisor':
          return 'Restore'
          break;
        case 'advisor manager':
          if (this.getHasbeenUpdated) {
            return 'Unlock'
          } else {
            return 'Lock'
          }
          break;
      }
    },
    docId: function () {
      return this.element.docID
    },

    mimeType: function() {
      return 'application/vnd.google-apps.presentation'
    },

    haveDocId: function () {
      let id = this.element['docID']
      if (id && id.trim()) {
        return true
      }
      return false
    },

    modeDescription: function() {
      return ''
    },

    sectionStyle: function () {
      let style = { }
      copyStyle(this.element, style, 'background-color')
      copyStyle(this.element, style, 'padding')
      copyStyle(this.element, style, 'padding-top')
      copyStyle(this.element, style, 'padding-bottom')
      copyStyle(this.element, style, 'padding-left')
      copyStyle(this.element, style, 'padding-right')
      return style
    }
  },
  // watch: {
  //   refreshCounter (oldvalue, newvalue) {
  //     console.log(`Slides refreshCounter changed from ${oldvalue} to ${newvalue}.`);
  //   }
  // },
  methods: {
    select (element) {
      console.log(`select()`, element)
      if (this.pageEditMode != 'view') {
        this.$content.setPropertyElement({ element })
      }
    },
    restore () {
      let mode = this.$store.state.user.userMode.currentMode
      let masterFile = this.element['docID']
      let docUserId = null
      let ownDoc = this.$docservice.store.getters['replacementDocID'](masterFile, userID)
      let predDocument = this.$docservice.store.getters['predecessorDocumentID'](masterFile, docUserId)
      let parentDocID = predDocument ? predDocument : masterFile
      let userID = this.$store.state.user.currentUserModeDetails.id
      let currentPageNode = this.$router.history.current.hash
      let folderID = this.$store.state.user.currentUserModeDetails.folder_id
      let accountingFirmID = this.$store.state.user.currentUserModeDetails.account_firm_id
      let businessEntityID = this.$store.state.user.currentUserModeDetails.business_entity_id
      let cloneFile = mode === 'client' ? 1 : 0
      let vm = this

      if (this.$store.state.user.currentUserModeDetails.business_entity_folder_id) {
        folderID = this.$store.state.user.currentUserModeDetails.business_entity_folder_id
      }
      
      if (mode === 'client' || mode === 'advisor') {
        this.$dialog.confirm({
          title: "Restore Document",
          message:
            "Are you sure you want to restore this document? Restoring this document will discard all your changes and get the latest changes.",
          confirmText: "Restore",
          onConfirm: () => {
            this.$docservice.store.dispatch('restoreDocument', { vm, ownDoc, parentDocID, folderID, accountingFirmID, businessEntityID, cloneFile})
          }
        });
      } else {
        if (!this.getHasbeenUpdated) {
          this.$dialog.confirm({
            title: "Lock Document",
            message:
              "Lock this document by making some changes.",
            confirmText: "Ok",
            onConfirm: () => {
            }
          });
        } else {
          this.$dialog.confirm({
            title: "Unlock Document",
            message:
              "Are you sure you want to unlock this document? Unlocking this document will discard all your changes and get the latest changes.",
            confirmText: "Unlock",
            onConfirm: () => {
              let cloneFile = this.hasExistingDocument == '' ? 1 : 0
              this.$docservice.store.dispatch('restoreDocument', { vm, ownDoc, parentDocID, folderID, accountingFirmID, businessEntityID, cloneFile})
            }
          }); 
        }
      }
    },
    getCurrentRevision (fileId) {
        let vm = this
        let masterFile = this.element['docID']
        let docUserId = null
        let predDocument = this.$docservice.store.getters['predecessorDocumentID'](masterFile, docUserId)
        let parentDocID = predDocument ? predDocument : masterFile
        let endpoint = `${this.$docservice.protocol}://${this.$docservice.host}:${this.$docservice.port}/api/${this.$docservice.version}/${this.$docservice.apikey}`
        let url = `${endpoint}/get/latest-revision`
        let params = {
          file_id: fileId,
          parent_doc_id: parentDocID
        }
        
        axios({
          method: 'post',
          url,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          data: params
        })
        .then(response => {
          
          this.hasBeenUpdated = (response.data.revision != 1 && response.data.revision !=  null)          
        })
        .catch(e => {
          axiosError(vm, url, params, e)
          console.log(e)
        })
    },
    funcSrc: function () {
      console.log(`ContentGoogleSlides METHOD src`, this.$docservice.store.getters);

      let docID = this.element['docID']
      if (docID) {
        if (docID.startsWith('2PACX-')) {
          // Use the published version of the file
          let src = `https://docs.google.com/a/tooltwist.com/presentation/d/e/${this.element.docID}/embed?start=false&loop=false&delayms=3000`
          console.log(`published url=${src}`)
          // return src
          this.src = src
        } else {

          // Get the substitute document ID we'll use for this user.
          let userID = null //ZZZZZZ
          let replacementDocID = this.$docservice.store.getters['replacementDocID'](docID, userID)

          console.error(`slides replacementDocID: ${docID} -> ${replacementDocID}`);
          let src = `https://docs.google.com/presentation/d/${replacementDocID}/preview?slide=id.p1`
          console.log(`unpublished url=${src}`)
          // return src
          this.src = src
          this.getCurrentRevision(replacementDocID)
        }
      }
      return ''
    },
    hasClonedDocument: function () {
      console.log(`ContentGoogleSheets METHOD hasClonedDocument`, this.$docservice.store.getters);
      let docID = this.element['docID']
      if (docID) {
        let userID = null //ZZZZZZ
        let predecessorDocumentID = this.$docservice.store.getters['predecessorDocumentID'](docID, userID)


        // return replacementDocID
        this.hasExistingDocument = predecessorDocumentID
      }
      return ''
    },
    doUpdate () {
      let docID = this.element['docID']
      let userID = this.$store.state.user.currentUserModeDetails.id
      let currentPageNode = this.$router.history.current.hash
      let folderID = this.$store.state.user.currentUserModeDetails.folder_id

      if (this.$store.state.user.currentUserModeDetails.business_entity_folder_id) {
        folderID = this.$store.state.user.currentUserModeDetails.business_entity_folder_id
      }

      let masterDocuments = this.$store.state.document.currentDocuments
      let documentMap = this.$docservice.store.state.documentMap
      let accountingFirmID = this.$store.state.user.currentUserModeDetails.account_firm_id
      let businessEntityID = this.$store.state.user.currentUserModeDetails.business_entity_id
      let documentsToBeClone = []

      /*
      *   If current user is advisor, firm manager and client
      */

      let currentMode = this.$store.state.user.userMode.currentMode
      
      if (currentMode !== 'mentor' && currentMode !== 'coach') {
        masterDocuments.forEach((masterDocument) => {
          let jsonData = {}
          let currentClonedDoc = documentMap[masterDocument.docID]
          if (currentClonedDoc) { // current cloned document
            if (masterDocument.mimeType === this.mimeType) { // this.mimeType === 'application/vnd.google-apps.spreadsheet'
              jsonData.docID = currentClonedDoc.docID
              if (currentClonedDoc.predecessorDocumentID) {
                jsonData.masterDocID = currentClonedDoc.predecessorDocumentID
              }
              jsonData.mimeType = masterDocument.mimeType
              documentsToBeClone.push(jsonData)
            } else {
              jsonData.docID = currentClonedDoc.docID
              if (currentClonedDoc.predecessorDocumentID) {
                jsonData.docID = currentClonedDoc.predecessorDocumentID
              }
              jsonData.mimeType = masterDocument.mimeType
              documentsToBeClone.push(jsonData)
            }
          }
        })
      } else {
        /*
        *   If current user is mentor and coach
        *   Iterate masterDocuments data and find the current spreadsheet that have been clicked
        *   and replace it's master document ID into current document ID
        */
        masterDocuments.forEach((masterDocument) => {
          let jsonData = {}
          let currentClonedDoc = documentMap[masterDocument.docID]
          if (currentClonedDoc) { // current cloned document
            if (masterDocument.docID === docID && masterDocument.mimeType === this.mimeType) { // this.mimeType === 'application/vnd.google-apps.spreadsheet'
              jsonData.docID = currentClonedDoc.docID
              jsonData.masterDocID = masterDocument.docID
              jsonData.mimeType = masterDocument.mimeType
              documentsToBeClone.push(jsonData)
            } else {
              if (masterDocument.mimeType !== this.mimeType) { // this.mimeType === 'application/vnd.google-apps.spreadsheet'
                jsonData.docID = masterDocument.docID
                jsonData.mimeType = masterDocument.mimeType
                documentsToBeClone.push(jsonData)
              }
            }
          } else { // if there is no cloned files
            jsonData.docID = masterDocument.docID
            jsonData.mimeType = masterDocument.mimeType
            documentsToBeClone.push(jsonData)
          }
        })
      }

      // console.log(documentsToBeClone)
      // return

      /*
      *   Find current clicked spreadsheet and replace it with cloned spreadsheet document
      *   params: docID
      */
      let currentSpreadsheetDocID = documentMap[docID]
      if (currentSpreadsheetDocID) {
        docID = currentSpreadsheetDocID.docID
      }

      if (docID) {
        let vm = this
        this.$docservice.store.dispatch('scanDocument', { vm, docID, documentsToBeClone, userID, folderID, currentPageNode, accountingFirmID, businessEntityID })
      }
    }
  }
}

/* function copyStyle(from, to, name) {
  if (from[name]) {
    to[name] = from[name]
  }
} */
</script>

<style lang="scss" scoped>
  @import '../../assets/css/content-variables.scss';

  $frame-color: lightblue;
  $text-color: darkblue;

  .c-layout-mode-heading {
    // This overrides the definition in content-editor.scss
    background-color: $frame-color;
    color: $text-color;
  }

  .c-edit-mode-debug {
    border-left: dashed 2px $frame-color;
    border-bottom: dashed 2px $frame-color;
    border-right: dashed 2px $frame-color;
    padding-bottom: 30px;

    &.c-selected {
      border-color: $c-editbar-color;
    }
  }

  .my-slides-container {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    overflow: hidden;
    margin-top: $c-embed-margin-top;
    margin-bottom: $c-embed-margin-bottom;

    &.my-dummy-iframe {
      background-color: $c-embed-border-color;

      .valign {
        position: relative;
        text-align: left;
        margin-top: 25px;
        margin-left: 25px;
        // top: 120px;
        font-size: 1.5em;
        font-family: Arial;
        font-weight: lighter;
        color: #a0a0a0;

        .modeDescription {
          font-size: 16px;
        }
        .modeError {
          font-size: 20px;
          color: $c-editbar-color;
          font-weight: bold;
          font-style: italic;
        }
      }
    }

    iframe,
    object,
    embed {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: solid 1px $c-embed-border-color;
    }
  }
  .scanMessage {
    display: inline-block;
    margin-left: 15px;
    margin-top: 6px;
    width: 25px;
    font-size: 16px;
    color: #999;
  }
</style>
