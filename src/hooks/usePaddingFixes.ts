import {useRef, useLayoutEffect} from 'react';
import type {ScrollerSpecs} from '../ScrollerConstants';

export default function usePaddingFixes(
  paddingFix: boolean,
  orientation: 'vertical' | 'horizontal' | 'auto',
  dir: 'ltr' | 'rtl',
  className: string | null | undefined,
  scroller: React.RefObject<HTMLDivElement>,
  specs: ScrollerSpecs
) {
  const spacingRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(
    () => {
      const {current} = scroller;
      if (current == null || orientation === 'auto' || !paddingFix) {
        return;
      }
      const computedStyle = window.getComputedStyle(current);
      if (orientation === 'vertical') {
        if (dir === 'rtl') {
          const paddingLeft = parseInt(computedStyle.getPropertyValue('padding-left'), 10);
          current.style.paddingLeft = `${Math.max(0, paddingLeft - specs.width)}px`;
          current.style.paddingRight = '';
        } else {
          const paddingRight = parseInt(computedStyle.getPropertyValue('padding-right'), 10);
          current.style.paddingRight = `${Math.max(0, paddingRight - specs.width)}px`;
          current.style.paddingLeft = '';
        }
        const {current: _current} = spacingRef;
        if (_current != null) {
          _current.style.height = computedStyle.getPropertyValue('padding-bottom');
        }
      } else {
        const paddingBottom = parseInt(computedStyle.getPropertyValue('padding-bottom'), 10);
        current.style.paddingBottom = `${Math.max(0, paddingBottom - specs.height)}px`;
        const {current: _current} = spacingRef;
        if (_current != null) {
          _current.style.width = computedStyle.getPropertyValue('padding-left');
        }
      }
    },
    [orientation, dir, className, scroller, paddingFix, specs]
  );
  return spacingRef;
}

