
const initialState = {
  // original-document-id -> { userId, docID }
  documentMap: {
    // '1ESlBwmpaCcKm7prdeCKJfVXn6hhddXn7Y6c3XLcYgis': {
    //   docID: '161rGTvEyrk2XKUmHnf54Lh1RRntvG-q_E2s4hZrx_wA', userID: null
    // },
    // '1sPBBmWIVvj-ytaAgfer0-j_3eHRXba6UMIo86Ov_ml4': {
    //   docID: '1GtiF5fM72nok7uXCrOSX13h1DciyxY78bwoqYsIIf6Y', userID: null
    // },
    // '16qDqMZdIX7VY7Ka4n4k14PuVhlu5KBxv03WOeytFNl4': {
    //   docID: '1RB5z_EHJhqdA35NFuE9Pf-LpMnwp5soEaPcS1urg8Aw', userID: null
    // }
  },

  // Refresh for some components can be activated by incrementing this counter.
  refreshCounter: 1,

  // Set to true while we are waiting for the server to scan a document
  // and generate derived documents.
  currentlyScanning: false,
  scanMessage: ''
}

export const state = () => (initialState)

// initial state
// export const state = () => {
//   return {

//     // original-document-id -> { userId, docID }
//     documentMap: {
//       // '1ESlBwmpaCcKm7prdeCKJfVXn6hhddXn7Y6c3XLcYgis': {
//       //   docID: '161rGTvEyrk2XKUmHnf54Lh1RRntvG-q_E2s4hZrx_wA', userID: null
//       // },
//       // '1sPBBmWIVvj-ytaAgfer0-j_3eHRXba6UMIo86Ov_ml4': {
//       //   docID: '1GtiF5fM72nok7uXCrOSX13h1DciyxY78bwoqYsIIf6Y', userID: null
//       // },
//       // '16qDqMZdIX7VY7Ka4n4k14PuVhlu5KBxv03WOeytFNl4': {
//       //   docID: '1RB5z_EHJhqdA35NFuE9Pf-LpMnwp5soEaPcS1urg8Aw', userID: null
//       // }
//     },

//     // Refresh for some components can be activated by incrementing this counter.
//     refreshCounter: 1,

//     // Set to true while we are waiting for the server to scan a document
//     // and generate derived documents.
//     currentlyScanning: false,
//     scanMessage: ''

//   }
// }
//})

/********************************************
 *
 *                 GETTERS
 *
 ********************************************/
export const getters = {
  replacementDocID: (state) => (docID, userID) => {
    console.log(`GETTER replacementDocID(${docID}, ${userID})`);
    let replacement = state.documentMap[docID]
    if (replacement && state.refreshCounter > 1) {
      console.log(`Found replacement document ${replacement.docID}`);
      return replacement.docID
    }
    return docID
  },
  predecessorDocumentID: (state) => (docID, userID) => {
    console.log(`GETTER predecessorDocumentID(${docID}, ${userID})`);
    let replacement = state.documentMap[docID]
    if (replacement && state.refreshCounter > 1) {
      console.log(`Found predecessor document ${replacement.predecessorDocumentID}`);
      return replacement.predecessorDocumentID
    }
    return docID
  }
}


/********************************************
 *
 *                 ACTIONS
 *
 ********************************************/
// see https://vuex.vuejs.org/guide/actions.html
export const actions = {
  scanDocument ({ commit, state }, { vm, docID, documentsToBeClone, userID, folderID, currentPageNode, accountingFirmID, businessEntityID }) {
    console.log(`In Action docservice/scanDocument(docID=${docID})`)

    commit('scanStateMutation', { currentlyScanning: true, message: 'scanning...'})
    vm.$docservice.scanDocument(vm, docID, documentsToBeClone, userID, folderID, currentPageNode, accountingFirmID, businessEntityID)
      .then(result => {
        commit('scanStateMutation', { currentlyScanning: true, message: 'updating...'})
        console.log(`result of save:`, result)

        // Wait a while, to give the Google permissions time to propagate
        setTimeout(() => {
          // console.log(`result of save:`, result.data)
          result.forEach(obj => {
            console.log(`obj is `, obj);
            let originalDocumentID = obj.originalDocumentID
            let replacementDocumentID = obj.replacementDocumentID
            let userID = null
            commit('mapDocumentMutation', { originalDocumentID, replacementDocumentID, userID })
          })
          commit('scanStateMutation', { currentlyScanning: false })
          commit('refreshMutation', { })
          // window.location.reload(0)
        }, 15000)
        setTimeout(() => {
          window.location.reload()
        }, 15000);
      })
      .catch(e => {
        commit('scanStateMutation', { currentlyScanning: false, message: 'error' })
        let desc = `Error scanning document`
        console.log(desc, e)
      })
  },
  unlockPlay ({ commit, state }, { vm, docID, documentsToBeClone, userID, folderID, currentPageNode, accountingFirmID, businessEntityID }) {
    console.log(`In Action docservice/unlockPlay(docID=${docID})`)

    commit('scanStateMutation', { currentlyScanning: true, message: 'scanning...'})
    vm.$docservice.unlockPlay(vm, docID, documentsToBeClone, userID, folderID, currentPageNode, accountingFirmID, businessEntityID)
      .then(result => {
        commit('scanStateMutation', { currentlyScanning: true, message: 'updating...'})
        console.log(`result of save:`, result)

        // Wait a while, to give the Google permissions time to propagate
        setTimeout(() => {
          // console.log(`result of save:`, result.data)
          result.forEach(obj => {
            console.log(`obj is `, obj);
            let originalDocumentID = obj.originalDocumentID
            let replacementDocumentID = obj.replacementDocumentID
            let userID = null
            commit('mapDocumentMutation', { originalDocumentID, replacementDocumentID, userID })
          })
          commit('scanStateMutation', { currentlyScanning: false })
          commit('refreshMutation', { })
        }, 15000)
        setTimeout(() => {
          window.location.reload()
        }, 15000);
      })
      .catch(e => {
        commit('scanStateMutation', { currentlyScanning: false, message: 'error' })
        let desc = `Error scanning document`
        console.log(desc, e)
      })
  },
  restoreDocument ({ commit, state }, { vm, ownDoc, parentDocID, folderID, accountingFirmID, businessEntityID, cloneFile }) {
    console.log(`In Action docservice/restoreDocument(docID=${ownDoc})`)

    commit('scanStateMutation', { currentlyScanning: true, message: 'Restoring...'})
    vm.$docservice.restoreDocument(vm, ownDoc, parentDocID, folderID, accountingFirmID, businessEntityID, cloneFile)
      .then(result => {
        commit('scanStateMutation', { currentlyScanning: true, message: 'Updating...'})
        console.log(`result of save:`, result)
        // Wait a while, to give the Google permissions time to propagate
        setTimeout(() => {
          window.location.reload()
        }, 15000);
      })
      .catch(e => {
        commit('scanStateMutation', { currentlyScanning: false, message: 'error' })
        let desc = `Error scanning document`
        console.log(desc, e)
      })
  }
}




/********************************************
 *
 *                 MUTATIONS
 *
 ********************************************/
export const mutations = {

  // Calling this mutation will trigger redrawing of any components
  // that monitor the value of 'refreshCounter'.
  refreshMutation (state, { }) {
    console.log('In Mutation refreshMutation()', state.refreshCounter)
    state.refreshCounter++
  },

  mapDocumentMutation(state, { originalDocumentID, replacementDocumentID, predecessorDocumentID, userID }) {
    console.log(`MUTATION mapDocumentMutation ${originalDocumentID} -> ${replacementDocumentID}`);
    state.documentMap[originalDocumentID] = {
      docID: replacementDocumentID,
      predecessorDocumentID: predecessorDocumentID,
      userID: userID
    }
    console.log(`map is now`, state.documentMap);
  },

  scanStateMutation(state, { currentlyScanning, message }) {
    state.currentlyScanning = currentlyScanning
    state.scanMessage = currentlyScanning ? message : ''
  },

  resetState(state, payload) {
    for (let f in state) {
      state[f] = initialState[f]
    }
 }


}//- mutations


export const namespaced = true




export default {
  "namespaced": true,
  state,
  mutations,
  getters,
  actions,
}
