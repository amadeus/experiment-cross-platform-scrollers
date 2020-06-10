import React, {useRef} from 'react';
import {usePaddingFixes, getScrollbarSpecs, getMergedOrientationStyles} from '../scroller-utilities';
import type {ScrollerComponentBaseProps, ScrollerOrientationTypes} from '../scroller-utilities';

// SimpleScroller is a component that does nothing but allow tall content to
// overflow and scroll.  No need for ref handling, or scrolling state.  It's
// about as bare bones as you need to be, with all the padding fixes included.
// Most of the time you probably want to use this

export interface SimpleScrollerProps extends ScrollerComponentBaseProps {
  orientation?: ScrollerOrientationTypes;
  children: React.ReactNode;
}

export default function createSimpleScroller(scrollbarClassName?: string) {
  const specs = getScrollbarSpecs(scrollbarClassName);
  return function CSSScroller({
    children,
    className,
    dir = 'ltr',
    orientation = 'vertical',
    paddingFix = true,
    style,
    ...props
  }: SimpleScrollerProps) {
    const scrollerRef = useRef<HTMLDivElement>(null);
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
  };
}
