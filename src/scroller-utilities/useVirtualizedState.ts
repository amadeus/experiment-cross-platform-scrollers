import {useState, useRef, useMemo, useLayoutEffect} from 'react';

import ListComputer from './core/ListComputer';
import useForceUpdate from './useForceUpdate';
import useScrollChunkState from './useScrollChunkState';

import type {ListSectionHeight, ListRowHeight, ListFooterHeight, ListState, GetAnchorId} from './core/ListComputer';
import type {ScrollerState} from './core/SharedTypes';
import type React from 'react';

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
  getAnchorId?: GetAnchorId;
}

export interface Anchor {
  id: string;
  section: number;
  row: number | undefined;
  scrollOffset: number;
}

export interface VirtualizedUseState extends ListState {
  listComputer: ListComputer;
  forceUpdateOnChunkChange: (fromDirtyType: 1 | 2) => void;
  anchor: Anchor | null;
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
  getAnchorId,
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

  // We use the first fully visible item as our scroll anchor
  const {items} = listState.current;
  let anchor: Anchor | null = null;
  const {scrollTop} = getScrollerState();
  for (const item of items) {
    if (scrollTop === 0) break;
    if (item.type === 'footer' || item.anchorId == null) continue;
    const row = item.type === 'row' ? item.row : undefined;
    if (item.offsetTop >= scrollTop) {
      anchor = {id: item.anchorId, section: item.section, row, scrollOffset: item.offsetTop - scrollTop};
      break;
    }
  }

  const state = useMemo(() => {
    // If state is dirty, it's generally due to initial load, and therefore we
    // should not calculate anything
    if (dirty > 0) return listState.current;
    listComputer.mergeProps({sectionHeight, rowHeight, footerHeight, paddingBottom, paddingTop, sections, getAnchorId});
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
    getAnchorId,
  ]);
  useLayoutEffect(() => void (listState.current = state));
  return {...state, listComputer, forceUpdateOnChunkChange, anchor};
}

interface VirtualizedAnchorProps {
  anchor: Anchor | null;
  getScrollerState(): ScrollerState;
  listComputer: ListComputer;
  getAnchorId: GetAnchorId | undefined;
  scrollerRef: React.RefObject<HTMLElement>;
  totalHeight: number;
}

export function useVirtualizedAnchor({
  scrollerRef,
  anchor,
  getScrollerState,
  listComputer,
  getAnchorId,
  totalHeight,
}: VirtualizedAnchorProps) {
  useLayoutEffect(
    () => {
      const {current} = scrollerRef;
      const {scrollTop} = getScrollerState();
      if (anchor == null || current == null || getAnchorId == null || scrollTop === 0) return;
      const setPosition = (section: number, row: number | undefined) => {
        const [offsetTop] = listComputer.computeScrollPosition(section, row);
        const scrollTarget = offsetTop - anchor.scrollOffset;
        if (scrollTop !== scrollTarget) {
          current.scrollTop = scrollTarget;
        }
      };
      let i = 0;
      while (i < 3) {
        let row = anchor.row;
        switch (i) {
          case 1:
            // Check row before
            row = row != null ? row - 1 : row;
            break;
          case 2:
            // Check row after
            row = row != null ? row + 1 : row;
            break;
          case 0:
          default:
            // Check existing row
            break;
        }

        const id = getAnchorId(anchor.section, anchor.row);
        if (id === anchor.id) {
          setPosition(anchor.section, row);
          break;
        }
        if (row == null) break;
        i++;
      }
    },
    // This breaks the exhaustive deps rule - but we only ever want
    // to anchor scroll on height changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalHeight]
  );
}
