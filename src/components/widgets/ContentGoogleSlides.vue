<template lang="pug">

  .c-google-slides(v-bind:class="[ editModeClass, (pageEditMode=='debug') ? 'tt-container-outline' : '']")

    // View mode
    .container(v-if="pageEditMode==='view'")
      div(v-if="hasExistingDocument === '' && $store.state.user.userMode.currentMode === 'advisor'" style="margin-top: 25px")
        span.doc-notification(v-if="getFileStatusText") {{getFileStatusText}}
        .my-slides-container(:style="{ 'margin-top': getFileStatusText ? '0px !important' : '25px !important' }")
          iframe(:src="src" :docId="docId" :mimeType="mimeType" frameborder="0" zwidth="640" zheight="389" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true" style="height: 105% !important")
        button.button.is-primary(@click="doUpdate", :class="{ 'is-loading': currentlyScanning }") Unlock & Play

      div(v-else style="margin-top: 25px")
        span.doc-notification(v-if="getFileStatusText") {{getFileStatusText}}
        .my-slides-container(:style="{ 'margin-top': getFileStatusText ? '0px !important' : '25px !important' }")
          iframe(:src="src" :docId="docId" :mimeType="mimeType" frameborder="0" zwidth="640" zheight="389" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true")
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
      replacementDocID: '',
      hasExistingDocument: '',
      fileStatusText: ''
    }
  },
  watch: {
    refreshCounter: function ( ) {
      console.log(`^&#^%$&^%$ WATCHED CHANGED REFRESHCOUNTER`)
      this.funcSrc()
      this.hasClonedDocument()
      this.updateFileStatusText()
    },
  },
  computed: {
    getFileStatusText () {
      return this.fileStatusText
    },
    refreshCounter: function() {
      return this.$docservice.store.state.refreshCounter
    },
    currentlyScanning: function () {
      return this.$docservice.store.state.currentlyScanning
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
    updateFileStatusText: function () {
      let predecessorDocumentID = this.$docservice.store.getters['predecessorDocumentID'](docID, userID)
      let accountingFirmID = this.$store.state.user.currentUserModeDetails.account_firm_id
      let businessEntityID = this.$store.state.user.currentUserModeDetails.business_entity_id
      let workEntityMode = this.$store.state.user.userMode.workEntityMode
      let currentMode = this.$store.state.user.userMode.currentMode
      let userID = this.$store.state.user.currentUserModeDetails.id
      let superiorRoles = ['mentor', 'coach', 'practice manager']
      let docID = this.element['docID']

      /* Checks wether current document is master file or a clone copy
       * returns a text if document is appropriate with the user mode
       */
      if (predecessorDocumentID !== docID && predecessorDocumentID) { // document is user own copy
        this.fileStatusText = false
      } else if (this.replacementDocID !== docID && this.replacementDocID && businessEntityID) { // document is entity copy
        this.fileStatusText = false
      } else if (this.replacementDocID !== docID && this.replacementDocID && accountingFirmID) { // document is firm copy
        if (currentMode === 'client' || workEntityMode) { // if user is client or in work entity mode
          this.fileStatusText = 'You are currently viewing a firm master document. Sync files to clone your own copy.'
        } else {
          this.fileStatusText = false
        }
      } else {
        if (superiorRoles.includes(currentMode)) { // if master document is allowed in a role
          this.fileStatusText = false
        } else {
          this.fileStatusText = 'You are currently viewing a master document. Sync files to clone your own copy.'
        }
      }

      return ''
    },
    select (element) {
      console.log(`select()`, element)
      if (this.pageEditMode != 'view') {
        this.$content.setPropertyElement({ element })
      }
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
          this.replacementDocID = replacementDocID
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
    margin-top: none !important;

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

  .doc-notification {
    z-index: 2000;
    display: block;
    width: 100%;
    top: 0;
    left: 0;
    height: 16;
    background-color: #dd0038;
    padding: 1px;
    margin: 0;
    border: none;
    border-bottom: 2px solid #fff;
    cursor: pointer;
    font-family: arial;
    font-size: 12px;
    text-align: center;
    color: #fff;
    font-weight: 800;
    font-size: 11px;
    margin-top: 10px;
  }
  
</style>
