import React, {forwardRef, useRef, useCallback, useImperativeHandle, useMemo} from 'react';
import useResizeObserverSubscription from './hooks/useResizeObserverSubscription';
import useAnimatedScroll from './hooks/useAnimatedScroll';
import useVirtualizedMasonryState, {getSectionIndex} from './hooks/useVirtualizedMasonryState';
import type {ScrollEvent, UpdateCallback, ScrollerState, ScrollerBaseProps} from './core/SharedTypes';
import type {ScrollToProps, ScrollIntoViewProps} from './hooks/useAnimatedScroll';
import type {GetItemId, GetSectionHeight, GetItemHeight, GetFooterHeight, UnitCoords} from './core/MasonryListComputer';
import useCachedScrollerState from './hooks/useCachedScrollerState';

export interface MasonryListScrollerRef {
  getScrollerNode: () => HTMLDivElement | null;
  getScrollerState: () => ScrollerState;
  scrollTo: (props: ScrollToProps) => void;
  scrollIntoView: (props: ScrollIntoViewProps) => void;

  // NOTE(amadeus): This will probably need to be tweaked a bit to accomodate Masonry's differing API
  // scrollToIndex: (props: ScrollToIndexProps) => void;
  // isItemVisible: (section: number, row?: number | undefined) => boolean;
  // getScrollPosition: (section: number, row?: number | undefined, completely?: boolean) => [number, number];
  // getItems: () => ListItem[];
  // getSectionRowFromIndex: (index: number) => [number, number];
}

export type RenderSection = (section: number) => React.ReactNode;
export type RenderItem = (id: string, coords: UnitCoords) => React.ReactNode;
export type RenderFooter = (coords: UnitCoords) => React.ReactNode;

export interface MasonryListScrollerProps extends ScrollerBaseProps {
  columns: number;
  gutterSize: number;
  sections: number[];
  getItemId: GetItemId;
  getSectionHeight?: GetSectionHeight;
  getItemHeight: GetItemHeight;
  getFooterHeight?: GetFooterHeight;
  renderSection?: RenderSection;
  renderItem: RenderItem;
  renderFooter?: RenderFooter;
  chunkSize: number;
}

export default function createMasonryListScroller(scrollbarClassName?: string) {
  const listenerMap = new Map<Element, UpdateCallback>();
  const resizeObserver =
    ResizeObserver != null
      ? new ResizeObserver((entries) => {
          entries.forEach(({target}) => {
            const onUpdate = listenerMap.get(target);
            onUpdate != null && onUpdate();
          });
        })
      : null;
  return forwardRef<MasonryListScrollerRef, MasonryListScrollerProps>(function MasonryListScroller(
    {
      onScroll,
      sections,
      columns,
      getItemId,
      getItemHeight,
      getSectionHeight,
      getFooterHeight,
      chunkSize,
      renderSection,
      renderItem,
      renderFooter,
      ...props
    },
    ref
  ) {
    const {scrollerRef, scrollerState, getScrollerState} = useCachedScrollerState();
    // Wrapper around the content of the scroller - used for both resize
    // observations and total scrollable height
    const content = useRef<HTMLDivElement>(null);
    const {forceUpdateOnChunkChange, coordsMap, visibleSections, totalHeight} = useVirtualizedMasonryState({
      sections,
      columns,
      getItemId,
      getItemHeight,
      getSectionHeight,
      getFooterHeight,
      chunkSize,
      getScrollerState,
    });
    const markStateDirty = useCallback(
      (dirtyType: 1 | 2 = 2) => {
        if (dirtyType > scrollerState.current.dirty) {
          scrollerState.current.dirty = dirtyType;
          forceUpdateOnChunkChange(dirtyType);
        }
      },
      [forceUpdateOnChunkChange, scrollerState]
    );

    const {scrollTo, scrollIntoView} = useAnimatedScroll(scrollerRef, getScrollerState);
    useResizeObserverSubscription({ref: scrollerRef, onUpdate: markStateDirty, resizeObserver, listenerMap});
    useResizeObserverSubscription({ref: content, onUpdate: markStateDirty, resizeObserver, listenerMap});
    useImperativeHandle(
      ref,
      () => ({
        getScrollerNode() {
          return scrollerRef.current;
        },
        getScrollerState,
        scrollTo,
        scrollIntoView,
      }),
      [scrollerRef, getScrollerState, scrollTo, scrollIntoView]
    );
    const handleScroll = useCallback(
      (event: ScrollEvent) => {
        markStateDirty(1);
        onScroll != null && onScroll(event);
      },
      [onScroll, markStateDirty]
    );
    return (
      <div ref={scrollerRef} onScroll={handleScroll} {...props}>
        {useMemo(() => {
          const footerCoords = coordsMap['__footer__'];
          return (
            <div ref={content} style={{height: totalHeight}}>
              {Object.keys(visibleSections).map((sectionId) => {
                const coords = coordsMap[sectionId];
                const visibleItems = visibleSections[sectionId];
                return coords == null || visibleItems == null ? (
                  <div style={coords}>
                    {renderSection != null && renderSection(getSectionIndex(sectionId))}
                    {visibleItems.map((itemId) => {
                      const coords = coordsMap[itemId];
                      return coords != null ? renderItem(itemId, coords) : null;
                    })}
                  </div>
                ) : null;
              })}
              {renderFooter != null && footerCoords != null && renderFooter(footerCoords)}
            </div>
          );
        }, [visibleSections, renderItem, renderSection, renderFooter, coordsMap, totalHeight])}
      </div>
    );
  });
}
