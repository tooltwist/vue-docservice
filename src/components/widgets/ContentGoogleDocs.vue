<template lang="pug">


  .c-google-docs(v-bind:class="[ editModeClass, (pageEditMode=='debug') ? 'tt-container-outline' : '']")

    // View mode
    .container(v-if="pageEditMode==='view'")
      .my-doc-container(:style="contentEditStyle")
        iframe(:src="src")

    // Debug mode
    div(v-else-if="pageEditMode==='debug'", v-on:click.stop="select(element)")
      .c-layout-mode-heading
        edit-bar-icons(:element="element")
        | google doc
      .container
        .my-doc-container.my-dummy-iframe(:style="contentEditStyle")

    // Edit, layout modes
    .container(v-else, v-on:click.stop="select(element)")
      .my-doc-container.my-dummy-iframe(:style="contentEditStyle")
</template>

<script>
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
      //docId: '2PACX-1vT14-yIpiY4EbQN0XscNBhMuJDZ-k4n03-cWPEgK_kyCTP35ehchuWiPDrTq2TIGYl6nFToRGQRJXZl',
    }
  },
  computed: {

    //- src: function ( ) {
    //-   //let src = `https://docs.google.com/a/tooltwist.com/presentation/d/e/${this.element.docID}/embed?start=false&loop=false&delayms=3000`
    //-   let src = `https://docs.google.com/a/tooltwist.com/document/d/e/${this.element.docID}/pub?embedded=true`
    //-   console.log(`url=${src}`)
    //-   return src
    //- },

    src: function ( ) {
      console.log(`ContentGoogleDocs METHOD src`, this.$docservice.store.getters);

      let docID = this.element['docID']
      if (docID) {
        if (docID.startsWith('2PACX-')) {
          // Use the published version of the file
          let src = `https://docs.google.com/document/d/${docID}/edit?embedded=true`
          console.log(`published url=${src}`)
          return src
        } else {

          // Get the substitute document ID we'll use for this user.
          let userID = null //ZZZZZZ
          let replacementDocID = this.$docservice.store.getters['replacementDocID'](docID, userID)

          console.log(`docs replacementDocID: ${docID} -> ${replacementDocID}`);
          let src = `https://docs.google.com/document/d/${replacementDocID}/edit?embedded=true`
          console.log(`unpublished url=${src}`)
          return src
        }
      }
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

    width: function () {
      let value = this.element['width']
      let w = 1000
      if (value && value.trim()) {
        w = parseInt(value)
      }
      if (w < 200) {
        w = 200
      }
      return w
    },

    height: function () {
      let value = this.element['height']
      let h = 500
      if (value && value.trim()) {
        h = parseInt(value)
      }
      if (h < 200) {
        h = 200
      }
      return h
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
      let h = 500
      if (value && value.trim()) {
        h = parseInt(value)
        if (h < 100) {
          h = 100
        }
      }
      style.height = h + 'px'
      // console.log(`contentEditStyle:`, style);
      return style
    },
  },
  methods: {
    select (element) {
      console.log(`select()`, element)
      if (this.pageEditMode != 'view') {
        this.$content.setPropertyElement({ element })
      }
    },
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
    padding-bottom: 56.25%;
    height: 0;
    overflow: hidden;
    margin-top: $c-embed-margin-top;
    margin-bottom: $c-embed-margin-bottom;

    &.my-dummy-iframe {
      background-color: $c-embed-border-color;
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
</style>
