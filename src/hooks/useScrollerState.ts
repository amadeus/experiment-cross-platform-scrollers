import {useRef, useCallback, useLayoutEffect} from 'react';
import {INITIAL_SCROLLER_STATE} from '../ScrollerConstants'
import type {ScrollerRef, ScrollerState, ScrollHandler, ScrollEvent} from '../ScrollerConstants';

export default function useScrollerState(
  ref: React.Ref<ScrollerRef>,
  onScroll: ScrollHandler | undefined,
  hasRef: boolean,
  resizeObserver: ResizeObserver | null,
  scrollerStates: Map<Element, React.RefObject<ScrollerState>>
) {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollerState = useRef<ScrollerState>(INITIAL_SCROLLER_STATE);
  const handleScroll = useCallback(
    (event: ScrollEvent) => {
      !scrollerState.current.dirty && (scrollerState.current.dirty = true);
      onScroll != null && onScroll(event);
    },
    [onScroll]
  );
  useLayoutEffect(
    () => {
      const {current} = scroller;
      if (resizeObserver == null || current == null || !hasRef) {
        return;
      }
      scrollerStates.set(current, scrollerState);
      resizeObserver.observe(current);
      return () => {
        resizeObserver.unobserve(current);
        scrollerStates.delete(current);
      };
    },
    [hasRef, resizeObserver, scrollerStates]
  );

  return {handleScroll, scroller, scrollerState};
}
