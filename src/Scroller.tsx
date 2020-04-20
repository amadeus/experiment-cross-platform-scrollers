import React, {useRef, useImperativeHandle, forwardRef} from 'react';
import usePaddingFixes from './hooks/usePaddingFixes';
import getScrollbarSpecs from './utils/getScrollbarSpecs';
import styles from './Scroller.module.css';
import type {ScrollerState, ScrollerProps, ScrollerRef} from './ScrollerConstants';

const {ResizeObserver} = window;

const DEFAULT_STATE: ScrollerState = Object.freeze({
  scrollTop: 0,
  scrollHeight: 0,
  offsetHeight: 0,
  dirty: false,
});

export function createScroller(scrollbarClassName?: string) {
  const specs = getScrollbarSpecs(scrollbarClassName);
  const scrollerStates = new Map<Element, React.RefObject<ScrollerState>>();
  const resizeObserver =
    ResizeObserver != null
      ? new ResizeObserver((entries) => {
          entries.forEach(({target}) => {
            const state = scrollerStates.get(target);
            if (state == null || state.current == null) {
              return;
            }
            !state.current.dirty && (state.current.dirty = true);
          });
        })
      : null;

  return [
    forwardRef(function Scroller(
      {children, className, onScroll, dir = 'ltr', orientation = 'vertical', paddingFix = true}: ScrollerProps,
      ref: React.Ref<ScrollerRef>
    ) {
      const scroller = useRef<HTMLDivElement>(null);
      useImperativeHandle<ScrollerRef, ScrollerRef>(
        ref,
        (): ScrollerRef => ({
          getScrollerNode() {
            return scroller.current;
          },
          getScrollerState() {
            const {current} = scroller;
            if (current != null) {
              const {scrollTop, scrollHeight, offsetHeight} = current;
              return {scrollTop, scrollHeight, offsetHeight, dirty: false};
            }
            return DEFAULT_STATE;
          },
        }),
        []
      );
      const spacingRef = usePaddingFixes(paddingFix, orientation, dir, className, scroller, specs);
      const classes = [
        orientation === 'vertical' ? styles.vertical : orientation === 'horizontal' ? styles.horizontal : styles.auto,
      ];
      scrollbarClassName != null && classes.push(scrollbarClassName);
      className != null && classes.push(className);
      return (
        <div ref={scroller} onScroll={onScroll} className={classes.join(' ')}>
          {children}
          {orientation !== 'auto' && paddingFix && <div aria-hidden className={styles.padding} ref={spacingRef} />}
        </div>
      );
    }),
  ];
}
