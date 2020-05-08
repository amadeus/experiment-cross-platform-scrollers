import {useRef, useLayoutEffect} from 'react';
import type {ScrollerSpecs} from '../core/getScrollbarSpecs';

interface PaddingFixProps {
  paddingFix: boolean;
  orientation: 'vertical' | 'horizontal' | 'auto';
  dir: 'ltr' | 'rtl';
  className: string | null | undefined;
  scroller: React.RefObject<HTMLDivElement>;
  specs: ScrollerSpecs;
}

// This is the hook implementation for the specs we got from getScrollbarSpecs
// to ensure padding on the side of the scrollbar feels uniform with the side
// that doesn't have it.  It takes into account the content direction `ltr` or
// `rtl`.  Additionally it fixes an edge case in firefox where if the scroller
// node has padding in the overflow orientation, it wont be accounted for when
// you scroll to the end of the scrollable content area and will result in
// elements feeling like they touch the end of the scroller element.

export default function usePaddingFixes({paddingFix, orientation, dir, className, scroller, specs}: PaddingFixProps) {
  const spacingRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const {current: scrollerNode} = scroller;
    if (scrollerNode == null || orientation === 'auto' || !paddingFix) {
      return;
    }
    const computedStyle = window.getComputedStyle(scrollerNode);
    if (orientation === 'vertical') {
      if (dir === 'rtl') {
        const paddingLeft = parseInt(computedStyle.getPropertyValue('padding-left'), 10);
        scrollerNode.style.paddingLeft = `${Math.max(0, paddingLeft - specs.width)}px`;
        scrollerNode.style.paddingRight = '';
      } else {
        const paddingRight = parseInt(computedStyle.getPropertyValue('padding-right'), 10);
        scrollerNode.style.paddingRight = `${Math.max(0, paddingRight - specs.width)}px`;
        scrollerNode.style.paddingLeft = '';
      }
      const {current: spacerNode} = spacingRef;
      if (spacerNode != null) {
        spacerNode.style.height = computedStyle.getPropertyValue('padding-bottom');
      }
    } else {
      const paddingBottom = parseInt(computedStyle.getPropertyValue('padding-bottom'), 10);
      scrollerNode.style.paddingBottom = `${Math.max(0, paddingBottom - specs.height)}px`;
      const {current: spacerNode} = spacingRef;
      if (spacerNode != null) {
        spacerNode.style.width = computedStyle.getPropertyValue('padding-left');
      }
    }
  }, [orientation, dir, className, scroller, paddingFix, specs]);
  return spacingRef;
}
