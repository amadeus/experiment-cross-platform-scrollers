import * as React from 'react';

import {
  useResizeObserverSubscription,
  useVirtualizedState,
  getAnimatedListScrollHelpers,
  useCachedScrollerState,
  usePaddingFixes,
  getScrollbarSpecs,
  getMergedOrientationStyles,
  useScrollSpring,
  useVirtualizedAnchor,
} from '../scroller-utilities';

import type {
  ListSectionHeight,
  ListRowHeight,
  ListFooterHeight,
  ListItem,
  ListItemSection,
  ListItemRow,
  ListItemFooter,
  ScrollEvent,
  ScrollerState,
  ResizeObserverUpdateCallback,
  ScrollerComponentBaseProps,
  AnimatedListScrollHelperState,
  GetAnchorId,
} from '../scroller-utilities';

// ListScroller mimics the API from the Discord List component.  The assumption
// with a List component is that it can be rendering a tremendous amount of
// data and therefore should be highly optimized to prevent both dom thrashing
// and minimize the work react has to do to reconcile new changes.  It also has
// fairly complex requirements for animated scrolling as well.

export type {ScrollerState as ListScrollerState};

export type RenderSectionFunction = (item: ListItemSection) => React.ReactNode;
export type RenderRowFunction = (item: ListItemRow) => React.ReactNode;
export type RenderFooterFunction = (item: ListItemFooter) => React.ReactNode;
export type RenderWrapperFunction = (section: number, children: React.ReactNode) => React.ReactNode;
export type {ListItem, ListSectionHeight, ListRowHeight, ListFooterHeight};

export interface ListScrollerProps extends ScrollerComponentBaseProps {
  sections: number[];
  renderSection: RenderSectionFunction;
  renderRow: RenderRowFunction;
  renderFooter?: RenderFooterFunction;
  wrapSection?: RenderWrapperFunction;

  sectionHeight: ListSectionHeight;
  rowHeight: ListRowHeight;
  footerHeight?: ListFooterHeight;

  chunkSize?: number;

  paddingTop?: number;
  paddingBottom?: number;
  onResize?: (() => unknown) | null;
  getAnchorId?: GetAnchorId | undefined;
  // NOTE(amadeus): We should not allow children to be passed to the List
  // component
  children?: undefined;
}

export interface ListScrollerRef extends AnimatedListScrollHelperState {
  getScrollerNode: () => HTMLDivElement | null;
  getScrollerState: () => ScrollerState;
  getScrollPosition: (section: number, row?: number | undefined, completely?: boolean) => [number, number];
  getItems: () => ListItem[];
  getSectionRowFromIndex: (index: number) => [number, number];
}

function useGetItems(items: ListItem[]) {
  const itemsRef = React.useRef(items);
  React.useEffect(() => void (itemsRef.current = items), [items]);
  return React.useCallback(() => itemsRef.current, []);
}

function useGetSectionRowFromIndex(sections: number[]) {
  const sectionsRef = React.useRef(sections);
  React.useEffect(() => void (sectionsRef.current = sections), [sections]);
  return React.useCallback((index: number): [number, number] => {
    const {current: sections} = sectionsRef;
    let sectionSum = 0;
    for (let section = 0; section < sections.length; section++) {
      const sectionSize = sections[section];
      if (sectionSum <= index && sectionSum + sectionSize >= index) {
        const row = index - sectionSum;
        return [section, row];
      }
      sectionSum += sectionSize;
    }
    return [0, 0];
  }, []);
}

interface RenderListItemProps {
  items: ListItem[];
  renderSection: RenderSectionFunction;
  renderRow: RenderRowFunction;
  renderFooter: RenderFooterFunction | undefined;
  wrapSection: RenderWrapperFunction | undefined;
  spacerTop: number;
}

function renderListItems({
  renderSection,
  renderRow,
  renderFooter,
  wrapSection,
  items,
  spacerTop,
}: RenderListItemProps): React.ReactNode {
  const content: React.ReactNodeArray = [<div style={{height: spacerTop}} key="---list-spacer-top" />];
  let sectionItems: React.ReactNodeArray = [];
  let lastSection: number = 0;
  items.forEach((item) => {
    if (item.section !== lastSection && sectionItems.length > 0) {
      content.push(wrapSection != null ? wrapSection(lastSection, sectionItems) : sectionItems);
      sectionItems = [];
    }
    lastSection = item.section;
    switch (item.type) {
      case 'section':
        sectionItems.push(renderSection(item));
        break;
      case 'row':
        sectionItems.push(renderRow(item));
        break;
      case 'footer':
        renderFooter != null && sectionItems.push(renderFooter(item));
        break;
    }
  });
  if (sectionItems.length > 0) {
    content.push(wrapSection ? wrapSection(lastSection, sectionItems) : sectionItems);
  }
  return content.flat();
}

export default function createListScroller(scrollbarClassName: string, ResizeObserverClass: typeof ResizeObserver) {
  const specs = getScrollbarSpecs(scrollbarClassName);
  const listenerMap = new Map<Element, ResizeObserverUpdateCallback>();
  const resizeObserver = new ResizeObserverClass((entries) => {
    entries.forEach(({target}) => {
      const onUpdate = listenerMap.get(target);
      onUpdate != null && onUpdate();
    });
  });
  return React.forwardRef<ListScrollerRef, ListScrollerProps>(
    (
      {
        className,
        onScroll,
        onResize = null,
        dir = 'ltr',
        sections,
        sectionHeight,
        rowHeight,
        footerHeight = 0,
        renderSection,
        renderRow,
        renderFooter,
        wrapSection,
        getAnchorId,
        paddingTop,
        paddingBottom,
        chunkSize,
        style,
        ...props
      },
      ref
    ) => {
      const {scrollerRef, scrollerState, getScrollerState} = useCachedScrollerState();
      usePaddingFixes({scrollerRef, className, specs, orientation: 'vertical', dir});
      // Using the base scroller data, compute the current list scroller state
      const {spacerTop, totalHeight, items, listComputer, forceUpdateOnChunkChange, anchor} = useVirtualizedState({
        sections,
        sectionHeight,
        rowHeight,
        footerHeight,
        paddingTop,
        paddingBottom,
        chunkSize,
        getScrollerState,
        getAnchorId,
      });
      const spring = useScrollSpring(scrollerRef);
      const onResizeRef: React.MutableRefObject<(() => unknown) | null> = React.useRef(onResize);
      React.useLayoutEffect(() => void (onResizeRef.current = onResize));
      const markDirtyAndUpdate = React.useCallback(
        (dirtyType: 1 | 2 = 2) => {
          if (dirtyType > scrollerState.current.dirty) {
            scrollerState.current.dirty = dirtyType;
          }
          if (dirtyType === 2) {
            onResizeRef.current?.();
          }
          forceUpdateOnChunkChange(dirtyType);
        },
        [forceUpdateOnChunkChange, scrollerState]
      );
      useResizeObserverSubscription({ref: scrollerRef, onUpdate: markDirtyAndUpdate, resizeObserver, listenerMap});
      const getItems = useGetItems(items);
      const getSectionRowFromIndex = useGetSectionRowFromIndex(sections);
      React.useImperativeHandle<ListScrollerRef, ListScrollerRef>(
        ref,
        () => ({
          getScrollerNode() {
            return scrollerRef.current;
          },
          getScrollerState,
          getItems,
          getSectionRowFromIndex,
          ...getAnimatedListScrollHelpers(scrollerRef, getScrollerState, listComputer, spring),
        }),
        [scrollerRef, getScrollerState, getSectionRowFromIndex, getItems, listComputer, spring]
      );
      const handleScroll = React.useCallback(
        (event: ScrollEvent) => {
          markDirtyAndUpdate(1);
          onScroll != null && onScroll(event);
        },
        [onScroll, markDirtyAndUpdate]
      );
      // If any aspect of layout is affected, we need to mark the state as
      // dirty after it's updated
      React.useLayoutEffect(() => {
        if (scrollerState.current.dirty !== 2) {
          scrollerState.current.dirty = 2;
        }
      }, [items, renderSection, renderRow, renderFooter, wrapSection, totalHeight, spacerTop, scrollerState]);
      useVirtualizedAnchor({scrollerRef, anchor, getScrollerState, listComputer, getAnchorId, totalHeight});
      const classes = [className, scrollbarClassName].filter((a) => a != null).join(' ');
      return (
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className={classes}
          style={getMergedOrientationStyles('vertical', style)}
          {...props}>
          {React.useMemo(
            () => (
              <div style={{height: totalHeight}}>
                {renderListItems({items, renderSection, renderRow, renderFooter, wrapSection, spacerTop})}
              </div>
            ),
            [items, renderSection, renderRow, renderFooter, wrapSection, totalHeight, spacerTop]
          )}
        </div>
      );
    }
  );
}
