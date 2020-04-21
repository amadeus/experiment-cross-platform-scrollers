import {useRef, useCallback, useLayoutEffect} from 'react';
import type {ScrollerListState} from '../ScrollerConstants';

export const INITIAL_SCROLLER_STATE: ScrollerListState = Object.freeze({
  scrollTop: 0,
  scrollHeight: 0,
  offsetHeight: 0,
  dirty: true,
});

export default function useScrollerState(
  resizeObserver: ResizeObserver | null,
  scrollerStates: Map<Element, React.RefObject<ScrollerListState>>
) {
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const scrollerState = useRef<ScrollerListState>(INITIAL_SCROLLER_STATE);
  const markStateDirty = useCallback(() => {
    !scrollerState.current.dirty && (scrollerState.current.dirty = true);
  }, []);
  useLayoutEffect(() => {
    if (resizeObserver == null) {
      return;
    }
    const {current: scrollerDiv} = scroller;
    if (scrollerDiv != null) {
      scrollerStates.set(scrollerDiv, scrollerState);
      resizeObserver.observe(scrollerDiv);
    }
    const {current: contentDiv} = content;
    if (contentDiv != null) {
      scrollerStates.set(contentDiv, scrollerState);
      resizeObserver.observe(contentDiv);
    }
    return () => {
      if (scrollerDiv != null) {
        resizeObserver.unobserve(scrollerDiv);
        scrollerStates.delete(scrollerDiv);
      }
      if (contentDiv != null) {
        resizeObserver.unobserve(contentDiv);
        scrollerStates.delete(contentDiv);
      }
    };
  }, [resizeObserver, scrollerStates]);

  return {markStateDirty, scroller, scrollerState, content};
}
