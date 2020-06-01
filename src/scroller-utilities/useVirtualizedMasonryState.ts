import {useRef, useState, useMemo} from 'react';
import useForceUpdate from './useForceUpdate';
import useScrollChunkState from './useScrollChunkState';
import MasonryListComputer from './core/MasonryListComputer';
import type {ScrollerState} from './core/SharedTypes';
import type {
  MasonryListGetItemKey,
  MasonryListGetSectionHeight,
  MasonryListGetItemHeight,
  MasonryListComputerState,
} from './core/MasonryListComputer';

const DEFAULT_ITEM_STATE: MasonryListComputerState = Object.freeze({
  coordsMap: {},
  visibleSections: {},
  totalHeight: 0,
});

export interface VirtualizedMasonryProps {
  sections: number[];
  columns: number;
  getItemKey: MasonryListGetItemKey;
  getItemHeight: MasonryListGetItemHeight;
  getSectionHeight?: MasonryListGetSectionHeight | undefined;
  chunkSize: number | undefined;
  getScrollerState: () => ScrollerState;
  itemGutter: number;
  sectionGutter?: number | undefined;
  padding?: number | undefined;
  dir: 'ltr' | 'rtl';
}

export interface VirtualizedMasonryUseState extends MasonryListComputerState {
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
  dir,
}: VirtualizedMasonryProps): VirtualizedMasonryUseState {
  const forceUpdate = useForceUpdate();
  const masonryState = useRef<MasonryListComputerState>(DEFAULT_ITEM_STATE);
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
      dir,
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
    dir,
  ]);

  return {...masonryState.current, masonryComputer, forceUpdateOnChunkChange, forceUpdate};
}
