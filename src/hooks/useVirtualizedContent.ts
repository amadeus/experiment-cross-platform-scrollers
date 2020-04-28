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
  totalHeight: 0,
  items: [],
});

type VirtualizedContentValue = [ListState, (fromDirtyType: 1 | 2) => void];

export default function useVirtualizedContent({
  sections,
  sectionHeight,
  rowHeight,
  footerHeight,
  chunkSize = 256,
  paddingTop = 0,
  paddingBottom = 0,
  getScrollerState,
}: VirtualizedProps): VirtualizedContentValue {
  const forceUpdate = useForceUpdate();
  const itemState = useRef<ListState>(DEFAULT_ITEM_STATE);
  const [listComputer] = useState(() => new ListComputer());
  const {dirty, scrollTop, offsetHeight} = getScrollerState();
  // If the state is dirty - we skip computation and force an update next tick
  useLayoutEffect(() => void (dirty && forceUpdate()), [dirty, forceUpdate]);
  const blockState = useRef(DEFAULT_BLOCK_STATE);
  blockState.current = getBlocksFromScrollerState(scrollTop, offsetHeight, chunkSize);
  const [blockStart, blockEnd] = blockState.current;
  const forceUpdateIfNecessary = useCallback(
    (fromDirtyType: 1 | 2) => {
      const {dirty, scrollTop, offsetHeight} = getScrollerState();
      // If state returned dirty, then that means we are still in the first
      // tick and should quit out early (or something has gone horribly wrong
      // and we can't trust the current state)
      if (dirty > 0) return;
      const [blockStart, blockEnd] = getBlocksFromScrollerState(scrollTop, offsetHeight, chunkSize);
      // If we are updating from a scroll type event, then we only want to
      // check against the first block to optimize away unneeded updates
      if (blockStart !== blockState.current[0]) {
        forceUpdate();
      } else if (fromDirtyType === 2 && blockEnd !== blockState.current[1]) {
        forceUpdate();
      }
    },
    [forceUpdate, chunkSize, getScrollerState]
  );
  itemState.current = useMemo(() => {
    // If state is dirty, it's generally due to initial load, and therefore we
    // should not calculate anything
    if (dirty > 0) {
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
  return [itemState.current, forceUpdateIfNecessary];
}
