import {useRef, useState, useMemo} from 'react';
import useForceUpdate from './useForceUpdate';
import useScrollChunkState from './useScrollChunkState';
import MasonryListComputer, {getSectionIndex, getSectionHeaderKey, getSectionKey} from '../core/MasonryListComputer';
import type {ScrollerState} from '../core/SharedTypes';
import type {GetItemKey, GetSectionHeight, GetItemHeight, MasonryComputerState} from '../core/MasonryListComputer';

export type {GetItemKey, GetSectionHeight, GetItemHeight, MasonryComputerState};
export {getSectionIndex, getSectionKey, getSectionHeaderKey};

const DEFAULT_ITEM_STATE: MasonryComputerState = Object.freeze({
  coordsMap: {},
  visibleSections: {},
  totalHeight: 0,
});

interface VirtualizedMasonryProps {
  sections: number[];
  columns: number;
  getItemKey: GetItemKey;
  getItemHeight: GetItemHeight;
  getSectionHeight?: GetSectionHeight | undefined;
  chunkSize: number | undefined;
  getScrollerState: () => ScrollerState;
  itemGutter: number;
  sectionGutter?: number | undefined;
  padding?: number | undefined;
}

interface VirtualizedMasonryState extends MasonryComputerState {
  masonryComputer: MasonryListComputer;
  forceUpdateOnChunkChange: (dirtyType: 1 | 2) => void;
  forceUpdate: () => void;
}

export default function useVirtualizedMasonryState({
  sections,
  columns,
  getItemKey,
  getItemHeight,
  getSectionHeight,
  chunkSize = 250,
  getScrollerState,
  itemGutter,
  sectionGutter,
  padding,
}: VirtualizedMasonryProps): VirtualizedMasonryState {
  const forceUpdate = useForceUpdate();
  const masonryState = useRef<MasonryComputerState>(DEFAULT_ITEM_STATE);
  const [masonryComputer] = useState(() => new MasonryListComputer());
  const scrollerState = getScrollerState();
  const {offsetWidth: bufferWidth} = scrollerState;
  const {dirty, chunkStart, chunkEnd, forceUpdateOnChunkChange} = useScrollChunkState({
    chunkSize,
    getScrollerState,
    forceUpdate,
  });

  masonryState.current = useMemo(() => {
    if (dirty > 0) {
      return masonryState.current;
    }
    masonryComputer.mergeProps({
      sections,
      columns,
      getItemKey,
      getItemHeight,
      getSectionHeight,
      bufferWidth,
      itemGutter,
      sectionGutter,
      padding,
    });
    masonryComputer.computeVisibleSections(Math.max(0, chunkStart * chunkSize), chunkEnd * chunkSize);
    return masonryComputer.getState();
  }, [
    dirty,
    masonryComputer,
    sections,
    columns,
    getItemKey,
    getItemHeight,
    getSectionHeight,
    chunkStart,
    chunkEnd,
    chunkSize,
    itemGutter,
    sectionGutter,
    padding,
    bufferWidth,
  ]);

  return {...masonryState.current, masonryComputer, forceUpdateOnChunkChange, forceUpdate};
}
