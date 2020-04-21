import {useState, useRef, useLayoutEffect, useCallback, useMemo} from 'react';
import ListComputer from '../core/ListComputer';
import type {SectionHeight, RowHeight, FooterHeight, ScrollerListState, ListState} from '../ScrollerConstants';

const DEFAULT_BLOCK_STATE = [0, 0];

function useForceUpdate() {
  const [, updateState] = useState(0);
  return useCallback(() => updateState((a) => a + 1), []);
}

interface VirtualizedProps {
  sections: number[];
  sectionHeight: SectionHeight;
  rowHeight: RowHeight;
  footerHeight: FooterHeight;
  chunkSize: number | undefined;
  paddingTop: number | undefined;
  paddingBottom: number | undefined;
  getScrollerState: () => ScrollerListState;
}

function getBlocksFromScrollerState(scrollTop: number, offsetHeight: number, chunkSize: number): [number, number] {
  const blockStart = Math.floor(scrollTop / chunkSize) - 1;
  const blockEnd = Math.ceil((scrollTop + offsetHeight) / chunkSize) + 1;
  return [blockStart, blockEnd];
}

const DEFAULT_ITEM_STATE: ListState = Object.freeze({
  spacerTop: 0,
  spacerBottom: 0,
  items: [],
});

export default function useVirtualizedContent({
  sections,
  sectionHeight,
  rowHeight,
  footerHeight,
  chunkSize = 256,
  paddingTop = 0,
  paddingBottom = 0,
  getScrollerState,
}: VirtualizedProps): [ListState, () => void] {
  const forceUpdate = useForceUpdate();
  const itemState = useRef<ListState>(DEFAULT_ITEM_STATE);
  const [listComputer] = useState(() => new ListComputer());

  const {dirty, scrollTop, offsetHeight} = getScrollerState();
  // If the state is dirty - we skip computation and force an update next tick
  useLayoutEffect(() => void (dirty && forceUpdate()), [dirty, forceUpdate]);
  const blockState = useRef(DEFAULT_BLOCK_STATE);
  blockState.current = getBlocksFromScrollerState(scrollTop, offsetHeight, chunkSize);
  const [blockStart, blockEnd] = blockState.current;
  const determineScrollUpdate = useCallback(() => {
    const {dirty, scrollTop, offsetHeight} = getScrollerState();
    // If state is dirty, then there's nothing to do
    if (dirty) return;
    const [blockStart] = getBlocksFromScrollerState(scrollTop, offsetHeight, chunkSize);
    // Only test against the first block - so we don't get double calculations
    // when the end changes.  It is safe for rendering because we add a chunk
    // before and after the scrollview, so there should never be a case where
    // it doesn't render content
    if (blockStart !== blockState.current[0]) {
      forceUpdate();
    }
  }, [forceUpdate, chunkSize, getScrollerState]);

  itemState.current = useMemo(() => {
    // If state is dirty, it's generally due to initial load, and therefore we
    // should not calculate anything
    if (dirty) {
      return itemState.current;
    }
    listComputer.mergeProps({sectionHeight, rowHeight, footerHeight, paddingBottom, paddingTop});
    return listComputer.compute(sections, Math.max(0, blockStart * chunkSize), blockEnd * chunkSize);
  }, [
    dirty,
    blockStart,
    blockEnd,
    sectionHeight,
    rowHeight,
    footerHeight,
    paddingBottom,
    paddingTop,
    sections,
    listComputer,
    chunkSize,
  ]);
  return [itemState.current, determineScrollUpdate];
}
