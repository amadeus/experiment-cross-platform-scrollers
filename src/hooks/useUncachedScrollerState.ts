import {useCallback, useRef} from 'react';
import type {ScrollerState} from '../core/SharedTypes';

const DEFAULT_STATE: ScrollerState = Object.freeze({
  scrollTop: 0,
  scrollLeft: 0,
  scrollHeight: 0,
  scrollWidth: 0,
  offsetHeight: 0,
  offsetWidth: 0,
  dirty: 0,
});

export default function useUncachedScrollerState() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const getScrollerState = useCallback((): ScrollerState => {
    const {current} = scrollerRef;
    if (current != null) {
      const {scrollTop, scrollLeft, scrollHeight, scrollWidth, offsetHeight, offsetWidth} = current;
      return {scrollTop, scrollLeft, scrollHeight, scrollWidth, offsetHeight, offsetWidth, dirty: 0};
    }
    return DEFAULT_STATE;
  }, []);

  return {scrollerRef, getScrollerState};
}
