import {useState, useCallback} from 'react';
import ManualSpring from '../core/ManualSpring';
import type {ScrollerState, ScrollToAPI} from '../core/SharedTypes';

export interface ScrollToProps extends ScrollToAPI {
  to: number;
}

export interface ScrollIntoViewProps extends ScrollToAPI {
  top: number;
  bottom: number;
  padding?: number;
}

export default function useAnimatedScroll(
  nodeRef: React.RefObject<HTMLElement>,
  getScrollerState: () => ScrollerState
) {
  const [spring] = useState(
    () =>
      new ManualSpring({
        // Some decent settings for managing a range of scroll speeds
        tension: 200,
        friction: 35,
        mass: 2,
        clamp: true,
        callback: (value: number, abort: () => void) => {
          const {current} = nodeRef;
          if (current == null) {
            abort();
            return;
          }
          current.scrollTop = value;
        },
      })
  );
  const scrollTo = useCallback(
    ({to, animate = true, callback}: ScrollToProps) => {
      const {scrollHeight, offsetHeight, scrollTop} = getScrollerState();
      let toFixed = Math.min(to, scrollHeight - offsetHeight + 1);
      spring.to({
        to: toFixed,
        from: scrollTop,
        animate,
        callback,
      });
    },
    [getScrollerState, spring]
  );
  const scrollIntoView = useCallback(
    ({top, bottom, padding = 0, animate, callback}: ScrollIntoViewProps) => {
      const {scrollHeight, offsetHeight, scrollTop} = getScrollerState();
      top -= padding;
      bottom += padding;
      if (top >= scrollTop && bottom <= scrollTop + offsetHeight) {
        callback != null && callback();
        return;
      }
      if (top < scrollTop) {
        spring.to({
          // Always add 1 to the maximum scroll to position due to potential
          // rounding issues
          to: Math.min(top, scrollHeight - offsetHeight + 1),
          from: scrollTop,
          animate,
          callback,
        });
        return;
      }
      spring.to({
        to: Math.min(bottom - offsetHeight, scrollHeight - offsetHeight + 1),
        from: scrollTop,
        animate,
        callback,
      });
    },
    [spring, getScrollerState]
  );
  return {scrollTo, spring, scrollIntoView};
}
