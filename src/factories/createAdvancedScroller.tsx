import React, {useImperativeHandle, forwardRef, useState} from 'react';
import {
  usePaddingFixes,
  ManualSpring,
  getScrollbarSpecs,
  getMergedOrientationStyles,
  getAnimatedScrollHelpers,
  useUncachedScrollerState,
} from '../scroller-utilities';
import type {ScrollerComponentBaseProps, ScrollerState, AnimatedScrollHelperState} from '../scroller-utilities';

// Your AdvancedScroller component.  It's flexible in that it can have state
// queried and scroll positions set as needed.  It also includes the basic
// padding fixes as needed.

export interface ScrollerRef extends AnimatedScrollHelperState {
  getScrollerNode: () => HTMLDivElement | null;
  getScrollerState: () => ScrollerState;
}

export interface AdvancedScrollerProps extends ScrollerComponentBaseProps {
  orientation?: 'vertical' | 'horizontal';
  children: React.ReactNode;
}

export default function createAdvancedScroller(scrollbarClassName?: string) {
  const specs = getScrollbarSpecs(scrollbarClassName);
  return forwardRef(function Scroller(
    {
      children,
      className,
      dir = 'ltr',
      orientation = 'vertical',
      paddingFix = true,
      style,
      ...props
    }: AdvancedScrollerProps,
    ref: React.Ref<ScrollerRef>
  ) {
    const {scrollerRef, getScrollerState} = useUncachedScrollerState();
    const [spring] = useState(
      () =>
        new ManualSpring({
          // Some decent settings for managing a range of scroll speeds
          tension: 200,
          friction: 35,
          mass: 2,
          clamp: true,
          callback: (value: number, abort: () => void) => {
            const {current} = scrollerRef;
            if (current == null) return abort();
            if (orientation === 'vertical') {
              current.scrollTop = value;
            } else {
              current.scrollLeft = value;
            }
          },
          getNodeWindow: () => scrollerRef.current?.ownerDocument?.defaultView || null,
        })
    );
    useImperativeHandle<ScrollerRef, ScrollerRef>(
      ref,
      () => ({
        getScrollerNode() {
          return scrollerRef.current;
        },
        getScrollerState,
        ...getAnimatedScrollHelpers(scrollerRef, getScrollerState, spring, orientation),
      }),
      [scrollerRef, getScrollerState, orientation, spring]
    );
    const paddingNode = usePaddingFixes({paddingFix, orientation, dir, className, scrollerRef, specs});
    return (
      <div
        ref={scrollerRef}
        className={[scrollbarClassName, className].filter((str) => str != null).join(' ')}
        style={getMergedOrientationStyles(orientation, style)}
        {...props}>
        {children}
        {paddingNode}
      </div>
    );
  });
}
