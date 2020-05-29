import React, {useImperativeHandle, forwardRef} from 'react';
import usePaddingFixes from '../hooks/usePaddingFixes';
import useAnimatedScroll from '../hooks/useAnimatedScroll';
import getScrollbarSpecs from '../core/getScrollbarSpecs';
import getMergedOrientationStyles from '../core/getMergedOrientationStyles';
import type {ScrollerBaseProps, ScrollerState, OrientationTypes} from '../core/SharedTypes';
import type {ScrollIntoViewProps, ScrollToProps} from '../hooks/useAnimatedScroll';
import useUncachedScrollerState from '../hooks/useUncachedScrollerState';

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
  orientation?: OrientationTypes;
  children: React.ReactNode;
}

export default function createScroller(scrollbarClassName?: string) {
  const specs = getScrollbarSpecs(scrollbarClassName);
  return forwardRef(function Scroller(
    {children, className, dir = 'ltr', orientation = 'vertical', paddingFix = true, style, ...props}: ScrollerProps,
    ref: React.Ref<ScrollerRef>
  ) {
    const {scrollerRef, getScrollerState} = useUncachedScrollerState();
    const {scrollTo, scrollIntoView} = useAnimatedScroll(scrollerRef, getScrollerState);
    useImperativeHandle<ScrollerRef, ScrollerRef>(
      ref,
      () => ({
        getScrollerNode() {
          return scrollerRef.current;
        },
        getScrollerState,
        scrollTo,
        scrollIntoView,
      }),
      [scrollerRef, getScrollerState, scrollTo, scrollIntoView]
    );
    const paddingNode = usePaddingFixes({paddingFix, orientation, dir, className, scrollerRef, specs});
    const classes = [scrollbarClassName, className].filter((str) => str != null);
    const mergedStyles = getMergedOrientationStyles(orientation, style);
    return (
      <div ref={scrollerRef} className={classes.join(' ')} style={mergedStyles} {...props}>
        {children}
        {paddingNode}
      </div>
    );
  });
}
