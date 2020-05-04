import {useState, useCallback} from 'react';
import ManualSpring from '../core/ManualSpring';
import type {ScrollerListState, ScrollToProps, ScrollToIndexProps, ScrollIntoViewProps} from '../ScrollerConstants';
import type ListComputer from '../core/ListComputer';

export default function useAnimatedScroll(
  nodeRef: React.RefObject<HTMLElement>,
  getScrollerState: () => ScrollerListState,
  listComputer: ListComputer
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
      const {scrollHeight, offsetHeight, scrollTop, dirty} = getScrollerState();
      if (dirty) {
        callback != null && callback();
        return;
      }
      let toFixed = Math.min(to, scrollHeight - offsetHeight + 1);
      console.log('toFixed', toFixed, 'scrollTop', scrollTop);
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
      const {scrollHeight, offsetHeight, scrollTop, dirty} = getScrollerState();
      if (dirty) {
        callback != null && callback();
        return;
      }
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
  const scrollToIndex = useCallback(
    ({section, row, animate = true, callback, padding = 0}: ScrollToIndexProps) => {
      console.log(section, row);
      const [top, height] = listComputer.computeScrollPosition(section, row);
      scrollIntoView({
        top,
        bottom: top + height,
        padding,
        animate,
        callback,
      });
    },
    [listComputer, scrollIntoView]
  );
  return {scrollTo, scrollToIndex, scrollIntoView};
}
