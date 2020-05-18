import React, {forwardRef, useRef, useCallback, useImperativeHandle, useMemo} from 'react';
import useResizeObserverSubscription from './hooks/useResizeObserverSubscription';
import useAnimatedScroll from './hooks/useAnimatedScroll';
import useVirtualizedMasonryState, {getSectionIndex, parseCoordsStyle} from './hooks/useVirtualizedMasonryState';
import usePaddingFixes from './hooks/usePaddingFixes';
import getScrollbarSpecs from './core/getScrollbarSpecs';
import type {ScrollEvent, UpdateCallback, ScrollerState, ScrollerBaseProps} from './core/SharedTypes';
import type {ScrollToProps, ScrollIntoViewProps} from './hooks/useAnimatedScroll';
import type {
  GetItemId,
  GetSectionHeight,
  GetItemHeight,
  GetFooterHeight,
  UnitCoords,
} from './hooks/useVirtualizedMasonryState';
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

export type RenderSection = (section: number) => React.ReactNode;
export type RenderItem = (id: string, coords: React.CSSProperties) => React.ReactNode;
export type RenderFooter = (coords: React.CSSProperties) => React.ReactNode;

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
      getItemId,
      getItemHeight,
      getSectionHeight,
      getFooterHeight,
      chunkSize,
      renderSection,
      renderItem,
      renderFooter,
      gutterSize,
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
        getItemId,
        getItemHeight,
        getSectionHeight,
        getFooterHeight,
        chunkSize,
        gutterSize,
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
        {useMemo(() => {
          const footerCoords = coordsMap['__footer__'];
          return (
            <div ref={content} style={{height: totalHeight}}>
              {Object.keys(visibleSections).map((sectionId) => {
                const coords = coordsMap[sectionId];
                const visibleItems = visibleSections[sectionId];
                return coords != null && visibleItems != null ? (
                  <div style={parseCoordsStyle(coords)} key={sectionId} data-debug="section">
                    {renderSection != null && renderSection(getSectionIndex(sectionId))}
                    {visibleItems.map((itemId) => {
                      const coords = coordsMap[itemId];
                      return coords != null ? renderItem(itemId, parseCoordsStyle(coords)) : null;
                    })}
                  </div>
                ) : null;
              })}
              {renderFooter != null && footerCoords != null && renderFooter(parseCoordsStyle(footerCoords))}
            </div>
          );
        }, [visibleSections, renderItem, renderSection, renderFooter, coordsMap, totalHeight])}
      </div>
    );
  });
}
