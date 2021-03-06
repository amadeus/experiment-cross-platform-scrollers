import React, {forwardRef, useRef, useCallback, useImperativeHandle, useMemo, useState} from 'react';
import {
  useResizeObserverSubscription,
  ManualSpring,
  getAnimatedScrollHelpers,
  useVirtualizedMasonryState,
  getMasonryListSectionIndex,
  getMasonryListSectionHeaderKey,
  usePaddingFixes,
  getScrollbarSpecs,
  getMergedOrientationStyles,
  useCachedScrollerState,
} from '../scroller-utilities';
import type {
  ScrollEvent,
  ResizeObserverUpdateCallback,
  ScrollerState,
  ScrollerComponentBaseProps,
  MasonryListGetItemKey,
  MasonryListGetSectionHeight,
  MasonryListGetItemHeight,
  MasonryListUnitCoords,
  AnimatedScrollHelperState,
} from '../scroller-utilities';

export interface MasonryListScrollerRef extends AnimatedScrollHelperState {
  getScrollerNode: () => HTMLDivElement | null;
  getScrollerState: () => ScrollerState;

  // NOTE(amadeus): This will probably need to be tweaked a bit to accomodate Masonry's differing API
  // NOTE(amadeus): Need to implement these APIs still...
  // scrollToIndex: (props: ScrollToIndexProps) => void;
  // isItemVisible: (section: number, row?: number | undefined) => boolean;
  // getScrollPosition: (section: number, row?: number | undefined, completely?: boolean) => [number, number];
  // getItems: () => ListItem[];
  // getSectionRowFromIndex: (index: number) => [number, number];
}

export type RenderSection = (section: number, coords: MasonryListUnitCoords, sectionKey: string) => React.ReactNode;
export type RenderItem = (
  section: number,
  item: number,
  coords: MasonryListUnitCoords,
  itemKey: string
) => React.ReactNode;

export interface MasonryListScrollerProps extends ScrollerComponentBaseProps {
  columns: number;
  itemGutter: number;
  sectionGutter?: number;
  padding?: number;
  sections: number[];
  getItemKey: MasonryListGetItemKey;
  getSectionHeight?: MasonryListGetSectionHeight;
  getItemHeight: MasonryListGetItemHeight;
  renderSection?: RenderSection;
  renderItem: RenderItem;
  chunkSize?: number;
}

export default function createMasonryListScroller(
  scrollbarClassName: string | undefined,
  ResizeObserverClass: typeof ResizeObserver
) {
  const specs = getScrollbarSpecs(scrollbarClassName);
  const listenerMap = new Map<Element, ResizeObserverUpdateCallback>();
  const resizeObserver = new ResizeObserverClass((entries) => {
    entries.forEach(({target}) => {
      const onUpdate = listenerMap.get(target);
      onUpdate != null && onUpdate();
    });
  });
  return forwardRef<MasonryListScrollerRef, MasonryListScrollerProps>(function MasonryListScroller(
    {
      onScroll,
      dir = 'ltr',
      sections,
      columns,
      getItemKey,
      getItemHeight,
      getSectionHeight,
      chunkSize,
      renderSection,
      renderItem,
      itemGutter,
      sectionGutter,
      padding,
      className,
      style,
      ...props
    },
    ref
  ) {
    const {scrollerRef, scrollerState, getScrollerState} = useCachedScrollerState();
    usePaddingFixes({scrollerRef, className, specs, orientation: 'vertical', dir});
    // Wrapper around the content of the scroller - used for both resize
    // observations and total scrollable height
    const content = useRef<HTMLDivElement>(null);
    const {forceUpdateOnChunkChange, coordsMap, visibleSections, totalHeight, forceUpdate} = useVirtualizedMasonryState(
      {
        sections,
        columns,
        getItemKey,
        getItemHeight,
        getSectionHeight,
        chunkSize,
        itemGutter,
        sectionGutter,
        padding,
        getScrollerState,
        dir,
      }
    );
    const markStateDirty = useCallback(
      (dirtyType: 1 | 2 = 2) => {
        if (dirtyType > scrollerState.current.dirty) {
          scrollerState.current.dirty = dirtyType;
          if (dirtyType === 2) {
            forceUpdate();
          } else {
            forceUpdateOnChunkChange(1);
          }
        }
      },
      [forceUpdateOnChunkChange, scrollerState, forceUpdate]
    );
    const [spring] = useState(
      () =>
        new ManualSpring({
          // Some decent settings for managing a range of scroll speeds
          tension: 200,
          friction: 35,
          mass: 2,
          clamp: true,
          callback: (value: number, abort: () => void) => {
            const {current} = scrollerRef;
            if (current == null) return abort();
            if (orientation === 'vertical') {
              current.scrollTop = value;
            } else {
              current.scrollLeft = value;
            }
          },
          getNodeWindow: () => scrollerRef.current?.ownerDocument?.defaultView || null,
        })
    );
    useResizeObserverSubscription({ref: scrollerRef, onUpdate: markStateDirty, resizeObserver, listenerMap});
    useResizeObserverSubscription({ref: content, onUpdate: markStateDirty, resizeObserver, listenerMap});
    useImperativeHandle(
      ref,
      () => ({
        getScrollerNode() {
          return scrollerRef.current;
        },
        getScrollerState,
        ...getAnimatedScrollHelpers(scrollerRef, getScrollerState, spring),
      }),
      [scrollerRef, getScrollerState, spring]
    );
    const handleScroll = useCallback(
      (event: ScrollEvent) => {
        markStateDirty(1);
        onScroll != null && onScroll(event);
      },
      [onScroll, markStateDirty]
    );
    const classes = [scrollbarClassName, className].filter((str) => str != null);
    const mergedStyles = getMergedOrientationStyles('vertical', style);
    return (
      <div ref={scrollerRef} onScroll={handleScroll} className={classes.join(' ')} style={mergedStyles} {...props}>
        {useMemo(
          () => (
            <div ref={content} style={{height: totalHeight}}>
              {Object.keys(visibleSections).map((sectionKey) => {
                const section = getMasonryListSectionIndex(sectionKey);
                const sectionCoords = coordsMap[sectionKey];
                const visibleItems = visibleSections[sectionKey];
                const sectionHeaderCoords = coordsMap[getMasonryListSectionHeaderKey(section)];
                return sectionCoords != null && visibleItems != null ? (
                  <div style={sectionCoords} key={sectionKey}>
                    {renderSection != null &&
                      sectionHeaderCoords != null &&
                      renderSection(section, sectionHeaderCoords, sectionKey)}
                    {visibleItems.map(([itemKey, section, item]) => {
                      const coords = coordsMap[itemKey];
                      return coords != null ? renderItem(section, item, coords, itemKey) : null;
                    })}
                  </div>
                ) : null;
              })}
            </div>
          ),
          [visibleSections, renderItem, renderSection, coordsMap, totalHeight]
        )}
      </div>
    );
  });
}
