import {useState, useRef, useMemo} from 'react';

import ListComputer from './core/ListComputer';
import useForceUpdate from './useForceUpdate';
import useScrollChunkState from './useScrollChunkState';

import type {ListSectionHeight, ListRowHeight, ListFooterHeight, ListState} from './core/ListComputer';
import type {ScrollerState} from './core/SharedTypes';

const DEFAULT_ITEM_STATE: ListState = Object.freeze({
  spacerTop: 0,
  totalHeight: 0,
  items: [],
});

export interface VirtualizedStateProps {
  sections: number[];
  sectionHeight: ListSectionHeight;
  rowHeight: ListRowHeight;
  footerHeight: ListFooterHeight;
  chunkSize: number | undefined;
  paddingTop: number | undefined;
  paddingBottom: number | undefined;
  getScrollerState: () => ScrollerState;
}

export interface VirtualizedUseState extends ListState {
  listComputer: ListComputer;
  forceUpdateOnChunkChange: (fromDirtyType: 1 | 2) => void;
}

// useVirtualizedState takes in a core part of the List props and manages a
// memoized virtualized state of sections and rows to render based on
// visibility.  The scrollable region is split into chunks (the size of which
// can be configured) essentially throttle dom manipulations.
export default function useVirtualizedState({
  sections,
  sectionHeight,
  rowHeight,
  footerHeight,
  chunkSize = 256,
  paddingTop = 0,
  paddingBottom = 0,
  getScrollerState,
}: VirtualizedStateProps): VirtualizedUseState {
  if (process.env.NODE_ENV === 'development' && chunkSize === 0) {
    throw new Error('createListScroller: chunkSize must be greater than 0');
  }
  const forceUpdate = useForceUpdate();
  const listState = useRef<ListState>(DEFAULT_ITEM_STATE);
  const [listComputer] = useState(() => new ListComputer());
  const {dirty, chunkStart, chunkEnd, forceUpdateOnChunkChange} = useScrollChunkState({
    chunkSize,
    getScrollerState,
    forceUpdate,
  });

  // NOTE(amadeus): This is potentially a controversial thing - setting a ref
  // inside of a what would ultimately be a render function. HOWEVER, I don't
  // think it should realistically have any effect on concurrent mode - the
  // only effect is that it would cache the last calculated results.  I am also
  // trying to inquire more to other `experts` because I can easily change this
  // up to use an effect function to save the ref instead
  listState.current = useMemo(() => {
    // If state is dirty, it's generally due to initial load, and therefore we
    // should not calculate anything
    if (dirty > 0) {
      return listState.current;
    }
    listComputer.mergeProps({sectionHeight, rowHeight, footerHeight, paddingBottom, paddingTop, sections});
    return listComputer.compute(Math.max(0, chunkStart * chunkSize), chunkEnd * chunkSize);
  }, [
    dirty,
    chunkStart,
    chunkEnd,
    sectionHeight,
    rowHeight,
    footerHeight,
    paddingBottom,
    paddingTop,
    sections,
    listComputer,
    chunkSize,
  ]);
  return {...listState.current, listComputer, forceUpdateOnChunkChange};
}
