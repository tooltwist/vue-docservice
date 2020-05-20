<template lang="pug">


  .c-google-docs(v-bind:class="[ editModeClass, (pageEditMode=='debug') ? 'tt-container-outline' : '']")

    // View mode
    .container(v-if="pageEditMode==='view'")
      div(v-if="isMasterDocument && $store.state.user.userMode.currentMode !== 'mentor'")
        .master-doc-warning
          div This is the master doc, and must not be edited/modified by a client or advisor (it will overwrite the master document)
        .my-doc-container(:style="contentEditStyle")
          iframe(:src="`https://docs.google.com/document/d/${replacementDocID}/preview`" :docID="docID", :mimeType="mimeType", width="1000", height="500", scrolling="yes")
      div(v-else-if="hasExistingDocument === '' && $store.state.user.userMode.currentMode === 'advisor'")
        .my-doc-container(:style="contentEditStyle")
          // Regular embedded mode, to allow editing (with menus, rows and tabs)
          iframe(:src="`https://docs.google.com/document/d/${replacementDocID}/preview`" :docID="docID", :mimeType="mimeType", width="1000", height="500", scrolling="yes")
          br
          br
          br
        button.button.is-primary(@click="showUnlockPlayPopUp", :class="{ 'is-loading': currentlyScanning }") Unlock & Play
        .scanMessage {{scanMessage}}
        .is-clearfix
      div(v-else)
        .my-doc-container(:style="contentEditStyle")
          // Regular embedded mode, to allow editing (with menus, rows and tabs)
          iframe(:src="`https://docs.google.com/document/d/${replacementDocID}/edit`" :docID="docID", :mimeType="mimeType", width="1000", height="500", scrolling="yes")
        | &nbsp;
        button.restore-btn.button.is-primary(v-if="showRestoreBtn && allowRestoreBtn" @click="restore", :class="{ 'is-loading': currentlyScanning }") {{getRestoreBtnLabel}}
        .scanMessage {{scanMessage}}
        .is-clearfix
    // Debug mode
    div(v-else-if="pageEditMode==='debug'", v-on:click.stop="select(element)")
      .c-layout-mode-heading
        edit-bar-icons(:element="element")
        | google doc
      .container
        .my-doc-container.my-dummy-iframe(:style="contentEditStyle")
          .valign
            | Google Documents
            br
            .modeDescription(v-if="haveDocId")
              | {{modeDescription}}
            .modeError(v-else)
              br
              | Document not specified

    // Edit, layout modes
    .container(v-else, v-on:click.stop="select(element)")
      .my-doc-container.my-dummy-iframe(:style="contentEditStyle")
          .valign
          | Google Documents
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
  name: 'content-google-docs',
  props: {
    element: Object,
  },
  mixins: [ ContentMixins, CutAndPasteMixins ],
  data: function () {
    return {
      // src: '',
      hasExistingDocument: '',
      replacementDocID: '',
      hasBeenUpdated: false,
      isMasterDocument: false
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
    docId: function () {
      return this.element.docID
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
    mimeType: function() {
      return 'application/vnd.google-apps.document'
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
    },
    src: function ( ) {
      // https://stackoverflow.com/questions/26079476/google-views-in-a-frame-because-it-set-x-frame-options-to-sameorigin
      //let src = `https://docs.google.com/spreadsheets/d/${this.element.docID}`
      //- let src = `https://docs.google.com/a/tooltwist.com/spreadsheets/d/e/${this.element.docID}/pubhtml?widget=true&amp;headers=false`
      //- let src = `https://docs.google.com/a/tooltwist.com/spreadsheets/d/e/${this.element.docID}/pubhtml?widget=true&headers=false&embedded=true`

      // Refused to display '<URL>' in a frame because it set 'X-Frame-Options' to 'sameorigin'.
      // X-frame error solution:
      //
      /*
      let src= `https://docs.google.com/viewer?srcid=[${this.element.docID}]&pid=explorer&efh=false&a=v&chrome=false&embedded=true`
      console.log(`url=${src}`)
      return src
      */

      if (this.element.docID) {
        if (this.element.docID.startsWith('2PACX-')) {
          // Use the published version of the file
          //- let src = `https://docs.google.com/a/tooltwist.com/presentation/d/e/${this.element.docID}/embed?start=false&loop=false&delayms=3000`
          let src = `https://docs.google.com/a/tooltwist.com/document/d/e/${this.element.docID}/pubhtml?widget=true&amp;headers=false`
          //- let src= `https://docs.google.com/viewer?srcid=[${this.element.docID}]&pid=explorer&efh=false&a=v&chrome=false&embedded=true`
          console.log(`published url=${src}`)
          return src
        } else {
          // Use a preview version of the sheet
          //- let src = `https://docs.google.com/presentation/d/${this.element.docID}/preview?slide=id.p1`
          //- let src = `https://docs.google.com/spreadsheets/d/1ESlBwmpaCcKm7prdeCKJfVXn6hhddXn7Y6c3XLcYgis/edit?gid=0&chrome=false&single=true&widget=false&headers=false&rm=minimal&embedded=true`
          console.log(`editable=${this.element.editable}`);
          console.log(`show-menus=${this.element['show-menus']}`);
          console.log(`show-tabs=${this.element['show-tabs']}`);

          // Default is editable, with menu and tabs
          let src = `https://docs.google.com/document/d/${this.element.docID}/edit?gid=0&chrome=false&single=true&widget=false&headers=false&rm=minimal&embedded=true`

          // if (this.element.editable) {
          //   src = `https://docs.google.com/spreadsheets/d/${this.element.docID}/edit?gid=0&chrome=false&single=true&widget=false&headers=false&rm=minimal&embedded=true`
          // }
          console.log(`unpublished url=${src}`)

          // Modes:
          //  edit - regular
          //  edit without menus
          //  edit without menus or tabs
          //  preview
          //  preview without tabs


          return src
        }
      }
      return ``
    },
    contentEditStyle: function () {
      // console.log(`contentEditStyle()`);
      let style = { }

      // Width
      let value = this.element['width']
      // console.log(` width value=${value}`);
      let w = 1000
      if (value && value.trim()) {
        w = parseInt(value)
        console.log(`w=${w}`);
        if (w < 200) {
          w = 200
        }
        style.maxWidth = w + 'px'
      }

      // Height
      value = this.element['height']
      // console.log(` height value=${value}`);
      let h = 700
      if (value && value.trim()) {
        h = parseInt(value)
        if (h < 100) {
          h = 100
        }
      }
      style.height = h + 'px'
      // console.log(`contentEditStyle:`, style);
      return style
    }
  },
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
          let vm = this
          this.$dialog.confirm({
            title: "Lock Document",
            message:
              "Are you sure you want to lock this document? Locking this document will mean you will not receive updated versions of this particular document; you will however, be able to preserve the work you’ve done.",
            confirmText: "Ok",
            onConfirm: () => {
              this.$docservice.store.dispatch('lockDocument', { vm, ownDoc })
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
          parent_doc_id: parentDocID,
          mime_type: this.mimeType,
          current_mode: this.$store.state.user.userMode.currentMode
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
      console.log(`ContentGoogleSheets METHOD replacementDocumentID`, this.$docservice.store.getters);
      let docID = this.element['docID']
      if (docID) {
        // Use a preview version of the sheet
        // console.log(`compute docID 1`, this.$docservice.store);
        let userID = null //ZZZZZZ
        let replacementDocID = this.$docservice.store.getters['replacementDocID'](docID, userID)
        let predecessorDocumentID = this.$docservice.store.getters['predecessorDocumentID'](docID, userID)

        // return replacementDocID
        this.isMasterDocument = (replacementDocID === docID)
        this.replacementDocID = replacementDocID
        this.getCurrentRevision(replacementDocID)
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
    showUnlockPlayPopUp () {
      let vm = this
      this.$dialog.confirm({
        title: "Unlock and Play",
        message:
          "By unlocking this document you make a cloned version just for yourself; go ahead and ‘play’ with the document to see how you might use it with a client. This will not affect your firm’s master doc set nor will it affect or be viewed by any client/s. It’s just for you!",
        confirmText: "Play",
        onConfirm: () => {
          vm.doUpdate()
        }
      })
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
      let currentDocument = {
        docID : documentMap[docID].docID,
        mimeType : 'application/vnd.google-apps.document'
      }
      documentsToBeClone.push(currentDocument)

      if (docID) {
        let vm = this
        this.$docservice.store.dispatch('unlockPlay', { vm, docID, documentsToBeClone, userID, folderID, currentPageNode, accountingFirmID, businessEntityID })
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

  .my-doc-container {
    position: relative;
    // padding-bottom: 56.25%;
    //height: 0;
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

  .master-doc-warning {
    height: 15px;
    line-height: 13px;
    font-weight: 700;
    opacity: 0.9;
    margin-bottom: -18px;
    position: relative;
    padding-left: 3px;
    margin-left: -2px;
    margin-right: -2px;
    background-color: red;
    font-size: 13px;
    color: white;
    text-align: center;
  }
</style>
