import React, {useRef} from 'react';
import usePaddingFixes from './hooks/usePaddingFixes';
import getScrollbarSpecs from './core/getScrollbarSpecs';
import styles from './Scroller.module.css';
import type {ScrollerBaseProps} from './core/SharedTypes';

// CSSScroller is a component that does nothing but allow tall content to
// overflow and scroll.  No need for ref handling, or scrolling state.  It's
// about as bare bones as you need to be, with all the padding fixes included.
// Most of the time you probably want to use this

export interface CSSScrollerProps extends ScrollerBaseProps {
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
    ...props
  }: CSSScrollerProps) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const spacingRef = usePaddingFixes({paddingFix, orientation, dir, className, scrollerRef, specs});
    const classes = [
      orientation === 'vertical' ? styles.vertical : orientation === 'horizontal' ? styles.horizontal : styles.auto,
      scrollbarClassName,
      className,
    ].filter((str) => str != null);
    return (
      <div ref={scrollerRef} className={classes.join(' ')} {...props}>
        {children}
        {orientation !== 'auto' && paddingFix && <div aria-hidden className={styles.padding} ref={spacingRef} />}
      </div>
    );
  };
}
