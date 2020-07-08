import getAnimatedScrollHelpers from './getAnimatedScrollHelpers';

import type ListComputer from './ListComputer';
import type ManualSpring from './ManualSpring';
import type {ScrollerState} from './SharedTypes';
import type {AnimatedScrollHelperState, ScrollToAPI} from './getAnimatedScrollHelpers';

export interface ScrollToIndexProps extends ScrollToAPI {
  section: number;
  row?: number;
  padding?: number;
}

export interface AnimatedListScrollHelperState extends AnimatedScrollHelperState {
  scrollToIndex: (props: ScrollToIndexProps) => void;
  isItemVisible: (section: number, row?: number | undefined, completely?: boolean) => boolean;
  getScrollPosition: (section: number, row?: number | undefined) => [number, number];
}

// Takes the base `useAnimatedScroll` API and adds an additional method to
// scroll certain section/row indexes into view
export default function getAnimatedListScrollHelpers(
  nodeRef: React.RefObject<HTMLElement>,
  getScrollerState: () => ScrollerState,
  listComputer: ListComputer,
  spring: ManualSpring
): AnimatedListScrollHelperState {
  const helpers = getAnimatedScrollHelpers(nodeRef, getScrollerState, spring);
  const getScrollPosition = (section: number, row?: number | undefined): [number, number] =>
    listComputer.computeScrollPosition(section, row);
  return {
    ...helpers,
    getScrollPosition,
    isItemVisible(section: number, row?: number | undefined, completely: boolean = false) {
      const [itemScrollTop, itemHeight] = getScrollPosition(section, row);
      const state = getScrollerState();
      return completely
        ? itemScrollTop >= state.scrollTop && itemScrollTop + itemHeight <= state.scrollTop + state.offsetHeight
        : itemScrollTop + itemHeight >= state.scrollTop && itemScrollTop <= state.scrollTop + state.offsetHeight;
    },
    // Adds an additional API that's used for the List APIs - takes a section and
    // an optional row to scroll to
    scrollToIndex({section, row, animate, callback, padding = 0}: ScrollToIndexProps) {
      const [start, height] = getScrollPosition(section, row);
      helpers.scrollIntoViewRect({
        start,
        end: start + height,
        padding,
        animate,
        callback,
      });
    },
  };
}
