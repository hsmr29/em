import _ from 'lodash'
import Dispatch from '../@types/Dispatch'
import Thunk from '../@types/Thunk'
import { isSafari } from '../browser'
import * as selection from '../device/selection'
import globals from '../globals'
import { alertActionCreator as alert } from '../reducers/alert'
import { DragInProgressPayload } from '../reducers/dragInProgress'
import head from '../util/head'
import expandHoverDown from './expandHoverDown'
import expandHoverUp from './expandHoverUp'

/** A utility that shakes if hit too much. Returns a hit function that takes an id representing the source of the hit. If the number of unique ids exceeds the SHAKE_THRESHOLD within DEBOUNCE_SHAKING, trigger onShake. */
const Shaker = <T>(
  onShake: (
    /** Extra data that is passed to onShake from the last call to hit. This is used to pass dispatch from the dragInProgressActionCreator since importing the app store causes a circular import. */
    data: T,
  ) => void,
) => {
  // track the different draggingThoughts values that are dispatched within a period of time
  const DEBOUNCE_SHAKING = 100

  // the number of unique Paths that must be hovered over within the BEBOUNCE_SHAKING period to a trigger a shake
  const SHAKE_THRESHOLD = 6

  let repeatedMax = 0
  const repeatedIds: Map<string, number> = new Map()

  /** Resets the repeat counts. */
  const reset = () => {
    repeatedMax = 0
    repeatedIds.clear()
  }

  /* Reset counters when shaking stops. */
  const shaking = _.debounce(reset, DEBOUNCE_SHAKING)

  return (data: T, id?: string) => {
    // count repeated ids
    if (id) {
      const count = (repeatedIds.get(id) || 0) + 1
      repeatedIds.set(id, count)
      repeatedMax = Math.max(repeatedMax, count)
    }

    // check if we reached the shake threshold
    if (repeatedMax >= SHAKE_THRESHOLD) {
      onShake(data)
      reset()
    }

    // start the timer on each hit
    shaking()
  }
}

// abort drag-and-drop on shake
const shaker = Shaker((dispatch: Dispatch) => {
  // force drag to abort
  // we need to make all drop targets, visible drag behavior, and drop handlers short circuit when the drag has been aborted
  // react-dnd does not allow programmatic cancellation of drag
  dispatch([
    {
      type: 'dragInProgress',
      value: false,
    },
    alert('✗ Drag cancelled'),
  ])
})

/** Drag in progress. */
const dragInProgress =
  (payload: DragInProgressPayload): Thunk =>
  (dispatch, getState) => {
    const { hoveringPath, value } = payload

    // react-dnd stops propagation of the TouchMonitor's touchend event, so we need to turn off globals.touching here
    if (!value) {
      globals.touching = false

      // clear selection after drag ends just in case browser made a selection
      // Mobile Safari long-press-to-select is difficult to stop
      // See: https://github.com/cybersemics/em/issues/1704
      setTimeout(selection.clear)
    }

    dispatch({
      type: 'dragInProgress',
      ...payload,
    })

    // abort drag-and-drop on shake
    // must go after dispatching dragInProgress, otherwise aborted dragInProgress: false will get overwritten by the payload
    shaker(dispatch, hoveringPath ? head(hoveringPath) : undefined)

    // when at the top of the viewport, bump the scroll bar to prevent gitching in Safari mobile
    // TODO: It still glitches out if you scroll back to the top during a drag
    if (isSafari() && document.documentElement.scrollTop === 0) {
      window.scrollTo(0, 1)
    }

    dispatch(expandHoverUp())
    dispatch(expandHoverDown())
  }

export default dragInProgress
