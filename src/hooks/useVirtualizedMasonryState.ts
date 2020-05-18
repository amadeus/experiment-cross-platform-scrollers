import {useRef, useState, useMemo} from 'react';
import useForceUpdate from './useForceUpdate';
import useScrollChunkState from './useScrollChunkState';
import MasonryListComputer, {
  getSectionIndex,
  getCoordsString,
  parseCoordsValues,
  parseCoordsStyle,
} from '../core/MasonryListComputer';
import type {ScrollerState} from '../core/SharedTypes';
import type {
  GetItemId,
  GetSectionHeight,
  GetItemHeight,
  GetFooterHeight,
  MasonryComputerState,
  UnitCoords,
} from '../core/MasonryListComputer';

export type {GetItemId, GetSectionHeight, GetItemHeight, GetFooterHeight, MasonryComputerState, UnitCoords};
export {getSectionIndex, getCoordsString, parseCoordsValues, parseCoordsStyle};

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
  gutterSize: number;
}

interface VirtualizedMasonryState extends MasonryComputerState {
  masonryComputer: MasonryListComputer;
  forceUpdateOnChunkChange: (dirtyType: 1 | 2) => void;
  forceUpdate: () => void;
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
  gutterSize,
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
      getItemId,
      getItemHeight,
      getSectionHeight,
      getFooterHeight,
      bufferWidth,
      gutterSize,
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
    chunkStart,
    chunkEnd,
    chunkSize,
    gutterSize,
    bufferWidth,
  ]);

  return {...masonryState.current, masonryComputer, forceUpdateOnChunkChange, forceUpdate};
}
