import * as localForage from 'localforage'

// constants
import {
  ROOT_TOKEN,
  TUTORIAL_STEP_NONE,
} from '../constants.js'

// util
import {
  initialState,
  hashThought,
  timestamp,
} from '../util.js'

// SIDE EFFECTS: localStorage, scroll
// preserves some settings
export const clear = state => {
  localForage.clear().then(() => {
    return Promise.all(
        localForage.setItem('settings-dark', state.settings.dark),
        localForage.setItem('settings-tutorialStep', TUTORIAL_STEP_NONE),
        localForage.setItem('helper-complete-welcome', true)
      )
  }).catch(err => {
    throw new Error(err)
  })

  setTimeout(() => {
    window.scrollTo(0, 0)
  })

  return Object.assign({}, initialState(), {
    'helper-complete-welcome': true,
    showHelper: null,
    // override welcome tutorial data
    data: {
      [hashThought(ROOT_TOKEN)]: {
        value: ROOT_TOKEN,
        memberOf: [],
        created: timestamp(),
        lastUpdated: timestamp()
      }
    },
    settings: {
      dark: state.settings.dark,
      tutorialStep: TUTORIAL_STEP_NONE
    }
  })
}
