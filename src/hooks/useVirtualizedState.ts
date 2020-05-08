import {useState, useRef, useLayoutEffect, useCallback, useMemo} from 'react';
import ListComputer from '../core/ListComputer';
import type {ScrollerState} from '../core/SharedTypes';
import type {SectionHeight, RowHeight, FooterHeight, ListState, ListItem} from '../core/ListComputer';

export type {SectionHeight, RowHeight, FooterHeight, ListState, ListItem};

const DEFAULT_CHUNK_STATE = [0, 0];

function useForceUpdate() {
  const [, updateState] = useState(0);
  return useCallback(() => updateState((a) => a + 1), []);
}

interface VirtualizedStateProps {
  sections: number[];
  sectionHeight: SectionHeight;
  rowHeight: RowHeight;
  footerHeight: FooterHeight;
  chunkSize: number | undefined;
  paddingTop: number | undefined;
  paddingBottom: number | undefined;
  getScrollerState: () => ScrollerState;
}

function getChunksFromScrollerState(scrollTop: number, offsetHeight: number, chunkSize: number): [number, number] {
  const chunkStart = Math.floor(scrollTop / chunkSize) - 1;
  const chunkEnd = Math.ceil((scrollTop + offsetHeight) / chunkSize) + 1;
  return [chunkStart, chunkEnd];
}

const DEFAULT_ITEM_STATE: ListState = Object.freeze({
  spacerTop: 0,
  totalHeight: 0,
  items: [],
});

type VirtualizedState = {
  listComputer: ListComputer;
  forceUpdateIfNecessary: (fromDirtyType: 1 | 2) => void;
} & ListState;

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
}: VirtualizedStateProps): VirtualizedState {
  const forceUpdate = useForceUpdate();
  const listState = useRef<ListState>(DEFAULT_ITEM_STATE);
  const [listComputer] = useState(() => new ListComputer());
  const {dirty, scrollTop, offsetHeight} = getScrollerState();
  // If the state is dirty - we skip computation and force an update next tick
  useLayoutEffect(() => void (dirty && forceUpdate()), [dirty, forceUpdate]);
  const chunkState = useRef(DEFAULT_CHUNK_STATE);
  chunkState.current = getChunksFromScrollerState(scrollTop, offsetHeight, chunkSize);
  const [chunkStart, chunkEnd] = chunkState.current;
  const forceUpdateIfNecessary = useCallback(
    (fromDirtyType: 1 | 2) => {
      const {dirty, scrollTop, offsetHeight} = getScrollerState();
      // If state returned dirty, then that means we are still in the first
      // tick and should quit out early (or something has gone horribly wrong
      // and we can't trust the current state)
      if (dirty > 0) return;
      const [chunkStart, chunkEnd] = getChunksFromScrollerState(scrollTop, offsetHeight, chunkSize);
      // If we are updating from a scroll type event, then we only want to
      // check against the first chunk to optimize away unneeded updates
      if (chunkStart !== chunkState.current[0]) {
        forceUpdate();
      } else if (fromDirtyType === 2 && chunkEnd !== chunkState.current[1]) {
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
  return {...listState.current, listComputer, forceUpdateIfNecessary};
}
