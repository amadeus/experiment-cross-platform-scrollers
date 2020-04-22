import React, {useRef, useImperativeHandle, forwardRef} from 'react';
import usePaddingFixes from './hooks/usePaddingFixes';
import getScrollbarSpecs from './core/getScrollbarSpecs';
import styles from './Scroller.module.css';
import type {ScrollerProps, ScrollerRef, ScrollerState} from './ScrollerConstants';

const DEFAULT_STATE: ScrollerState = Object.freeze({
  scrollTop: 0,
  scrollHeight: 0,
  offsetHeight: 0,
});

export default function createScroller(scrollbarClassName?: string) {
  const specs = getScrollbarSpecs(scrollbarClassName);
  return forwardRef(function Scroller(
    {children, className, onScroll, dir = 'ltr', orientation = 'vertical', paddingFix = true}: ScrollerProps,
    ref: React.Ref<ScrollerRef>
  ) {
    const scroller = useRef<HTMLDivElement>(null);
    useImperativeHandle<ScrollerRef, ScrollerRef>(
      ref,
      () => ({
        getScrollerNode() {
          return scroller.current;
        },
        getScrollerState() {
          const {current} = scroller;
          if (current != null) {
            const {scrollTop, scrollHeight, offsetHeight} = current;
            return {scrollTop, scrollHeight, offsetHeight};
          }
          return DEFAULT_STATE;
        },
      }),
      []
    );
    const spacingRef = usePaddingFixes(paddingFix, orientation, dir, className, scroller, specs);
    const classes = [
      orientation === 'vertical' ? styles.vertical : orientation === 'horizontal' ? styles.horizontal : styles.auto,
      scrollbarClassName,
      className,
    ].filter((str) => str != null);
    return (
      <div ref={scroller} onScroll={onScroll} className={classes.join(' ')}>
        {children}
        {orientation !== 'auto' && paddingFix && <div aria-hidden className={styles.padding} ref={spacingRef} />}
      </div>
    );
  });
}
