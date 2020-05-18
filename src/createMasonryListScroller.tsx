import React, {forwardRef, useRef, useCallback, useImperativeHandle, useMemo} from 'react';
import useResizeObserverSubscription from './hooks/useResizeObserverSubscription';
import useAnimatedScroll from './hooks/useAnimatedScroll';
import useVirtualizedMasonryState, {getSectionIndex, getSectionHeaderKey} from './hooks/useVirtualizedMasonryState';
import usePaddingFixes from './hooks/usePaddingFixes';
import getScrollbarSpecs from './core/getScrollbarSpecs';
import type {ScrollEvent, UpdateCallback, ScrollerState, ScrollerBaseProps} from './core/SharedTypes';
import type {ScrollToProps, ScrollIntoViewProps} from './hooks/useAnimatedScroll';
import type {GetItemKey, GetSectionHeight, GetItemHeight, UnitCoords} from './core/MasonryListComputer';
import useCachedScrollerState from './hooks/useCachedScrollerState';
import styles from './Scroller.module.css';

export type {UnitCoords};

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

export type RenderSection = (section: number, coords: UnitCoords, sectionKey: string) => React.ReactNode;
export type RenderItem = (section: number, item: number, coords: UnitCoords, itemKey: string) => React.ReactNode;

export interface MasonryListScrollerProps extends ScrollerBaseProps {
  columns: number;
  itemGutter: number;
  sectionGutter?: number;
  padding?: number;
  sections: number[];
  getItemKey: GetItemKey;
  getSectionHeight?: GetSectionHeight;
  getItemHeight: GetItemHeight;
  renderSection?: RenderSection;
  renderItem: RenderItem;
  chunkSize?: number;
}

export default function createMasonryListScroller(scrollbarClassName?: string) {
  const specs = getScrollbarSpecs(scrollbarClassName);
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
      orientation = 'vertical',
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
      ...props
    },
    ref
  ) {
    const {scrollerRef, scrollerState, getScrollerState} = useCachedScrollerState();
    usePaddingFixes({scrollerRef, className, specs, orientation, dir});
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
    const classes = [
      orientation === 'vertical' ? styles.vertical : orientation === 'horizontal' ? styles.horizontal : styles.auto,
      scrollbarClassName,
      className,
    ].filter((str) => str != null);
    return (
      <div ref={scrollerRef} onScroll={handleScroll} className={classes.join(' ')} {...props}>
        {useMemo(
          () => (
            <div ref={content} style={{height: totalHeight}}>
              {Object.keys(visibleSections).map((sectionKey) => {
                const section = getSectionIndex(sectionKey);
                const sectionCoords = coordsMap[sectionKey];
                const visibleItems = visibleSections[sectionKey];
                const sectionHeaderCoords = coordsMap[getSectionHeaderKey(section)];
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
