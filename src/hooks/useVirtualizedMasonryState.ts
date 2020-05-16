import {useRef, useState, useMemo} from 'react';
import useForceUpdate from './useForceUpdate';
import useScrollChunkState from './useScrollChunkState';
import MasonryListComputer, {getSectionIndex} from '../core/MasonryListComputer';
import type {ScrollerState} from '../core/SharedTypes';
import type {
  GetItemId,
  GetSectionHeight,
  GetItemHeight,
  GetFooterHeight,
  MasonryComputerState,
} from '../core/MasonryListComputer';

export type {GetItemId, GetSectionHeight, GetItemHeight, GetFooterHeight, MasonryComputerState};
export {getSectionIndex};

const DEFAULT_ITEM_STATE: MasonryComputerState = Object.freeze({
  coordsMap: {},
  visibleSections: {},
  totalHeight: 0,
});

interface VirtualizedMasonryProps {
  sections: number[];
  columns: number;
  getItemId: GetItemId;
  getItemHeight: GetItemHeight;
  getSectionHeight?: GetSectionHeight | undefined;
  getFooterHeight?: GetFooterHeight | undefined;
  chunkSize: number | undefined;
  getScrollerState: () => ScrollerState;
}

interface VirtualizedMasonryState extends MasonryComputerState {
  masonryComputer: MasonryListComputer;
  forceUpdateOnChunkChange: (dirtyType: 1 | 2) => void;
}

export default function useVirtualizedMasonryState({
  sections,
  columns,
  getItemId,
  getItemHeight,
  getSectionHeight,
  getFooterHeight,
  chunkSize = 250,
  getScrollerState,
}: VirtualizedMasonryProps): VirtualizedMasonryState {
  const forceUpdate = useForceUpdate();
  const masonryState = useRef<MasonryComputerState>(DEFAULT_ITEM_STATE);
  const [masonryComputer] = useState(() => new MasonryListComputer());
  const {dirty, chunkStart, chunkEnd, forceUpdateOnChunkChange} = useScrollChunkState({
    chunkSize,
    getScrollerState,
    forceUpdate,
  });

  masonryState.current = useMemo(() => {
    if (dirty > 0) {
      return masonryState.current;
    }
    const {offsetWidth: bufferWidth} = getScrollerState();
    masonryComputer.mergeProps({
      sections,
      columns,
      getItemId,
      getItemHeight,
      getSectionHeight,
      getFooterHeight,
      bufferWidth,
    });
    masonryComputer.computeVisibleSections(Math.max(0, chunkStart * chunkSize), chunkEnd * chunkSize);
    return masonryComputer.getState();
  }, [
    dirty,
    masonryComputer,
    sections,
    columns,
    getItemId,
    getItemHeight,
    getSectionHeight,
    getFooterHeight,
    getScrollerState,
    chunkStart,
    chunkEnd,
    chunkSize,
  ]);

  return {...masonryState.current, masonryComputer, forceUpdateOnChunkChange};
}
