import React, {useRef, useLayoutEffect, useMemo} from 'react';

import type {ScrollerOrientationTypes} from './core/SharedTypes';
import type {ScrollbarSpecs} from './core/getScrollbarSpecs';

const DEFAULT_STYLES = Object.freeze({
  pointerEvents: 'none',
  minHeight: 1,
  minWidth: 1,
  flex: '0 0 auto',
} as const);

export interface PaddingFixProps {
  paddingFix?: boolean;
  orientation: ScrollerOrientationTypes;
  dir: 'ltr' | 'rtl';
  className: string | null | undefined;
  scrollerRef: React.RefObject<HTMLDivElement>;
  specs: ScrollbarSpecs;
}

// This is the hook implementation for the specs we got from getScrollbarSpecs
// to ensure padding on the side of the scrollbar feels uniform with the side
// that doesn't have it.  It takes into account the content direction `ltr` or
// `rtl`.  Additionally it fixes an edge case in firefox where if the scroller
// node has padding in the overflow orientation, it wont be accounted for when
// you scroll to the end of the scrollable content area and will result in
// elements feeling like they touch the end of the scroller element.

export default function usePaddingFixes({
  paddingFix = true,
  orientation,
  dir,
  className,
  scrollerRef,
  specs,
}: PaddingFixProps): React.ReactNode {
  const spacingRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const {current: scrollerNode} = scrollerRef;
    if (scrollerNode == null || orientation === 'auto' || !paddingFix) {
      return;
    }
    const nodeWindow = scrollerNode.ownerDocument?.defaultView;
    if (nodeWindow == null) {
      return;
    }
    const computedStyle = nodeWindow.getComputedStyle(scrollerNode);
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
  }, [orientation, dir, className, scrollerRef, paddingFix, specs]);
  return useMemo(
    () =>
      orientation !== 'auto' ? (
        <div
          aria-hidden
          style={{
            position: orientation === 'vertical' ? 'absolute' : 'relative',
            ...DEFAULT_STYLES,
          }}
          ref={spacingRef}
        />
      ) : null,
    [orientation]
  );
}
