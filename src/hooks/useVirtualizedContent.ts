import {useState, useRef, useLayoutEffect, useCallback, useMemo} from 'react';
import ListComputer from '../core/ListComputer';
import type {ScrollerState} from '../core/SharedTypes';
import type {SectionHeight, RowHeight, FooterHeight, ListState, ListItem} from '../core/ListComputer';

export type {SectionHeight, RowHeight, FooterHeight, ListState, ListItem};

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
  getScrollerState: () => ScrollerState;
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

type VirtualizedContentValue = {
  listComputer: ListComputer;
  forceUpdateIfNecessary: (fromDirtyType: 1 | 2) => void;
} & ListState;

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
  const listState = useRef<ListState>(DEFAULT_ITEM_STATE);
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
    return listComputer.compute(Math.max(0, blockStart * chunkSize), blockEnd * chunkSize);
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
  return {...listState.current, listComputer, forceUpdateIfNecessary};
}
