import {useCallback} from 'react';
import useAnimatedScroll from './useAnimatedScroll';
import type ListComputer from '../core/ListComputer';
import type {ScrollerState, ScrollToAPI} from '../core/SharedTypes';
import type {ScrollToProps, ScrollIntoViewProps} from './useAnimatedScroll';

export type {ScrollToProps, ScrollIntoViewProps};

export interface ScrollToIndexProps extends ScrollToAPI {
  section: number;
  row?: number;
  padding?: number;
}

export default function useAnimatedListScroll(
  nodeRef: React.RefObject<HTMLElement>,
  getScrollerState: () => ScrollerState,
  listComputer: ListComputer
) {
  const {scrollTo, spring, scrollIntoView} = useAnimatedScroll(nodeRef, getScrollerState);
  const scrollToIndex = useCallback(
    ({section, row, animate = true, callback, padding = 0}: ScrollToIndexProps) => {
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
  return {scrollTo, scrollToIndex, scrollIntoView, spring};
}
