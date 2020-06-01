import React, {useRef} from 'react';
import {usePaddingFixes, getScrollbarSpecs, getMergedOrientationStyles} from '../scroller-utilities';
import type {ScrollerComponentBaseProps, ScrollerOrientationTypes} from '../scroller-utilities';

// CSSScroller is a component that does nothing but allow tall content to
// overflow and scroll.  No need for ref handling, or scrolling state.  It's
// about as bare bones as you need to be, with all the padding fixes included.
// Most of the time you probably want to use this

export interface CSSScrollerProps extends ScrollerComponentBaseProps {
  orientation?: ScrollerOrientationTypes;
  children: React.ReactNode;
}

export default function createScroller(scrollbarClassName?: string) {
  const specs = getScrollbarSpecs(scrollbarClassName);
  return function CSSScroller({
    children,
    className,
    dir = 'ltr',
    orientation = 'vertical',
    paddingFix = true,
    style,
    ...props
  }: CSSScrollerProps) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const paddingNode = usePaddingFixes({paddingFix, orientation, dir, className, scrollerRef, specs});
    const classes = [scrollbarClassName, className].filter((str) => str != null);
    const mergedStyles = getMergedOrientationStyles(orientation, style);
    return (
      <div ref={scrollerRef} className={classes.join(' ')} style={mergedStyles} {...props}>
        {children}
        {paddingNode}
      </div>
    );
  };
}
