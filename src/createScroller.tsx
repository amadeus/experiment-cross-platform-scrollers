import React, {useRef, useImperativeHandle, forwardRef, useCallback} from 'react';
import usePaddingFixes from './hooks/usePaddingFixes';
import useAnimatedScroll from './hooks/useAnimatedScroll';
import getScrollbarSpecs from './core/getScrollbarSpecs';
import styles from './Scroller.module.css';
import type {ScrollerBaseProps, ScrollerState} from './core/SharedTypes';
import type {ScrollIntoViewProps, ScrollToProps} from './hooks/useAnimatedScroll';

// Your basic Scroller component.  It's flexible in that it can have state
// queried and scroll positions set as needed.  It also includes the basic
// padding fixes as needed.

export interface ScrollerRef {
  getScrollerNode: () => HTMLDivElement | null;
  getScrollerState: () => ScrollerState;
  scrollTo: (props: ScrollToProps) => void;
  scrollIntoView: (props: ScrollIntoViewProps) => void;
}

export interface ScrollerProps extends ScrollerBaseProps {
  children: React.ReactNode;
}

const DEFAULT_STATE: ScrollerState = Object.freeze({
  scrollTop: 0,
  scrollHeight: 0,
  offsetHeight: 0,
  dirty: 0,
});

export default function createScroller(scrollbarClassName?: string) {
  const specs = getScrollbarSpecs(scrollbarClassName);
  return forwardRef(function Scroller(
    {children, className, dir = 'ltr', orientation = 'vertical', paddingFix = true, ...props}: ScrollerProps,
    ref: React.Ref<ScrollerRef>
  ) {
    const scroller = useRef<HTMLDivElement>(null);
    const getScrollerState = useCallback((): ScrollerState => {
      const {current} = scroller;
      if (current != null) {
        const {scrollTop, scrollHeight, offsetHeight} = current;
        return {scrollTop, scrollHeight, offsetHeight, dirty: 0};
      }
      return DEFAULT_STATE;
    }, []);
    const {scrollTo, scrollIntoView} = useAnimatedScroll(scroller, getScrollerState);
    useImperativeHandle<ScrollerRef, ScrollerRef>(
      ref,
      () => ({
        getScrollerNode() {
          return scroller.current;
        },
        getScrollerState,
        scrollTo,
        scrollIntoView,
      }),
      [getScrollerState, scrollTo, scrollIntoView]
    );
    const spacingRef = usePaddingFixes({paddingFix, orientation, dir, className, scroller, specs});
    const classes = [
      orientation === 'vertical' ? styles.vertical : orientation === 'horizontal' ? styles.horizontal : styles.auto,
      scrollbarClassName,
      className,
    ].filter((str) => str != null);
    return (
      <div ref={scroller} className={classes.join(' ')} {...props}>
        {children}
        {orientation !== 'auto' && paddingFix && <div aria-hidden className={styles.padding} ref={spacingRef} />}
      </div>
    );
  });
}
