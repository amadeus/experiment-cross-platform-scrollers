import {useCallback, useRef} from 'react';
import type {ScrollerState} from './core/SharedTypes';

const INITIAL_SCROLLER_STATE: ScrollerState = Object.freeze({
  scrollTop: 0,
  scrollLeft: 0,
  scrollHeight: 0,
  scrollWidth: 0,
  offsetHeight: 0,
  offsetWidth: 0,
  dirty: 2,
});

export interface CachedScrollerUseState {
  scrollerRef: React.RefObject<HTMLDivElement>;
  scrollerState: React.MutableRefObject<ScrollerState>;
  getScrollerState: () => ScrollerState;
}

export default function useCachedScrollerState(): CachedScrollerUseState {
  // Ref for the dom element to track the scroller state
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Ref cache for the scoller state itself
  const scrollerState = useRef<ScrollerState>(INITIAL_SCROLLER_STATE);
  // A function to get state data from the Scroller div itself.  Heavily
  // utilizes caching to prevent unnecessary layouts/reflows when many
  // different things might request the data.  The reason this API exists is
  // because virtulization and animated scrolling depend heavily on querying
  // the state of the scroller and we really only want to ever hit the DOM
  // node if we know the data has somehow changed and there's a reason to.
  // We use a property on the state called `dirty` that has 3 possible values
  // 0 = The state is not dirty, and the cached state can be returned.
  // 1 = Only the scrollTop value has changed and needs to be queried.
  // 2 = The entire state needs to be queried
  const getScrollerState = useCallback(() => {
    const {current} = scrollerRef;
    const {dirty} = scrollerState.current;
    if (current == null || dirty === 0) {
      return scrollerState.current;
    }
    if (dirty === 1) {
      const {scrollTop, scrollLeft} = current;
      scrollerState.current = {...scrollerState.current, scrollTop, scrollLeft, dirty: 0};
    } else {
      const {scrollTop, scrollLeft, scrollHeight, scrollWidth, offsetHeight, offsetWidth} = current;
      scrollerState.current = {scrollTop, scrollLeft, scrollHeight, scrollWidth, offsetHeight, offsetWidth, dirty: 0};
    }
    return scrollerState.current;
  }, []);
  return {scrollerRef, scrollerState, getScrollerState};
}
