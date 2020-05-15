import {useRef, useCallback, useLayoutEffect} from 'react';
import type {ScrollerState} from '../core/SharedTypes';

function getChunksFromScrollerState(scrollTop: number, offsetHeight: number, chunkSize: number): [number, number] {
  const chunkStart = Math.floor(scrollTop / chunkSize) - 1;
  const chunkEnd = Math.ceil((scrollTop + offsetHeight) / chunkSize) + 1;
  return [chunkStart, chunkEnd];
}

const DEFAULT_CHUNK_STATE = [0, 0];

interface ChunkProps {
  chunkSize: number;
  getScrollerState: () => ScrollerState;
  forceUpdate: () => void;
}

interface ChunkState {
  forceUpdateOnChunkChange: (fromDirtyType: 1 | 2) => void;
  chunkStart: number;
  chunkEnd: number;
  dirty: boolean;
}

export default function useScrollChunkState({chunkSize, getScrollerState, forceUpdate}: ChunkProps) {
  const {dirty, scrollTop, offsetHeight} = getScrollerState();
  useLayoutEffect(() => void (dirty && forceUpdate()), [dirty, forceUpdate]);
  const chunkState = useRef(DEFAULT_CHUNK_STATE);
  chunkState.current = getChunksFromScrollerState(scrollTop, offsetHeight, chunkSize);
  const [chunkStart, chunkEnd] = chunkState.current;
  const forceUpdateOnChunkChange = useCallback(
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
  return {forceUpdateOnChunkChange, chunkStart, chunkEnd, dirty};
}
