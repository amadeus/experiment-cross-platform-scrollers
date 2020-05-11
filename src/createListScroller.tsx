import React, {useRef, useImperativeHandle, forwardRef, useCallback, useMemo, useEffect} from 'react';
import usePaddingFixes from './hooks/usePaddingFixes';
import useResizeObserverSubscription from './hooks/useResizeObserverSubscription';
import useVirtualizedState from './hooks/useVirtualizedState';
import useAnimatedListScroll from './hooks/useAnimatedListScroll';
import getScrollbarSpecs from './core/getScrollbarSpecs';
import styles from './Scroller.module.css';
import type {ScrollToProps, ScrollIntoViewProps, ScrollToIndexProps} from './hooks/useAnimatedListScroll';
import type {
  SectionHeight,
  RowHeight,
  FooterHeight,
  ListItem,
  ListItemSection,
  ListItemRow,
  ListItemFooter,
} from './hooks/useVirtualizedState';
import type {ScrollEvent, ScrollerState, UpdateCallback, ScrollerBaseProps} from './core/SharedTypes';

// ListScroller mimics the API from the Discord List component.  The assumption
// with a List component is that it can be rendering a tremendous amount of
// data and therefore should be highly optimized to prevent both dom thrashing
// and minimize the work react has to do to reconcile new changes.  It also has
// fairly complex requirements for animated scrolling as well.

export type RenderSectionFunction = (item: ListItemSection) => React.ReactNode;
export type RenderRowFunction = (item: ListItemRow) => React.ReactNode;
export type RenderFooterFunction = (item: ListItemFooter) => React.ReactNode;
export type RenderWrapperFunction = (section: number, children: React.ReactNode) => React.ReactNode;

export interface ScrollerListProps extends ScrollerBaseProps {
  // NOTE(amadeus): We should probably not have this API if not really needed?
  // onScrollerStateUpdate?: () => any;

  sections: number[];
  renderSection: RenderSectionFunction;
  renderRow: RenderRowFunction;
  renderFooter?: RenderFooterFunction;
  wrapSection?: RenderWrapperFunction;

  sectionHeight: SectionHeight;
  rowHeight: RowHeight;
  footerHeight?: FooterHeight;
  // NOTE(amadeus): We could potentially assume a function for height
  // calculation is not uniform, but if it's just a number, than it's uniform
  // uniform?: boolean;

  // NOTE(amadeus): The size in pixels that we should chunk the scrollable region
  chunkSize?: number;

  // NOTE(amadeus): Figure out how to annotate onResize since it wont actually
  // have any event associated with it... - or even better... DO WE NEED IT?!
  // We have the ResizeObserver, so I could see this being useful as an API...
  // but ideally it's not needed
  // onResize: () => any;

  // NOTE(amadeus): Should we keep this?
  paddingTop?: number;
  paddingBottom?: number;

  'aria-label'?: string;
  'data-ref-id'?: string;
  tabIndex?: -1 | 0;

  // NOTE(amadeus): This is used specifically in 1 place in the app, but I
  // think ideally we should not support it since it can cause issues with
  // rendering/calculating
  // children?: React.ReactNode;
}

export interface ScrollerListRef {
  getScrollerNode: () => HTMLDivElement | null;
  getScrollerState: () => ScrollerState;
  scrollTo: (props: ScrollToProps) => void;
  scrollIntoView: (props: ScrollIntoViewProps) => void;
  scrollToIndex: (props: ScrollToIndexProps) => void;
  isItemVisible: (section: number, row?: number | undefined) => boolean;
  getScrollPosition: (section: number, row?: number | undefined, completely?: boolean) => [number, number];
  getItems: () => ListItem[];
  getSectionRowFromIndex: (index: number) => [number, number];
}

const {ResizeObserver} = window;

const INITIAL_SCROLLER_STATE: ScrollerState = Object.freeze({
  scrollTop: 0,
  scrollHeight: 0,
  offsetHeight: 0,
  dirty: 2,
});

// NOTE(amadeus): Can we deprecate this?
function useGetItems(items: ListItem[]) {
  const itemsRef = useRef(items);
  useEffect(() => void (itemsRef.current = items), [items]);
  return useCallback(() => itemsRef.current, []);
}

// NOTE(amadeus): Can we deprecate this?
function useGetSectionRowFromIndex(sections: number[]) {
  const sectionsRef = useRef(sections);
  useEffect(() => void (sectionsRef.current = sections), [sections]);
  return useCallback((index: number): [number, number] => {
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
  const content: React.ReactNodeArray = [<div style={{height: spacerTop}} key="list-spacer-top" />];
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
  return content;
}

export default function createListScroller(scrollbarClassName?: string) {
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
  return forwardRef<ScrollerListRef, ScrollerListProps>(function ScrollerList(
    {
      className,
      onScroll,
      dir = 'ltr',
      orientation = 'vertical',
      paddingFix = true,
      sections,
      sectionHeight,
      rowHeight,
      footerHeight = 0,
      renderSection,
      renderRow,
      renderFooter,
      wrapSection,
      paddingTop,
      paddingBottom,
      chunkSize,
      ...props
    },
    ref
  ) {
    // Wrapper container that is the scroller
    const scroller = useRef<HTMLDivElement>(null);
    // Wrapper around the content of the scroller - used for both resize
    // observations and total scrollable height
    const content = useRef<HTMLDivElement>(null);
    const scrollerState = useRef<ScrollerState>(INITIAL_SCROLLER_STATE);
    // A function to get state data from the Scroller div itself.  Heavily
    // utilizes caching to prevent unnecessary layouts/reflows when many
    // different things might request the data.  The reason this API exists is
    // because virtulization and animated scrolling depend heavily on querying
    // the state of the scroller and we really only want to ever hit the DOM
    // node if we know the data has somehow changed and there's a reason to.
    // We use a property on the state called `dirty` that has 3 possible values
    // 0 = The state is not dirty, and the cached state can be returned.
    // 1 = Only the scrollTop value has changed and needs to be queried.
    // 2 = The entire state needs to be queried
    const getScrollerState = useCallback(() => {
      const {current} = scroller;
      const {dirty} = scrollerState.current;
      if (current == null || dirty === 0) {
        return scrollerState.current;
      }
      if (dirty === 1) {
        const {scrollTop} = current;
        scrollerState.current = {...scrollerState.current, scrollTop, dirty: 0};
      } else {
        const {scrollTop, scrollHeight, offsetHeight} = current;
        scrollerState.current = {scrollTop, scrollHeight, offsetHeight, dirty: 0};
      }
      return scrollerState.current;
    }, []);
    // Using the base scroller data, compute the current list scroller state
    const {spacerTop, totalHeight, items, listComputer, forceUpdateIfNecessary} = useVirtualizedState({
      sections,
      sectionHeight,
      rowHeight,
      footerHeight,
      paddingTop,
      paddingBottom,
      chunkSize,
      getScrollerState,
    });
    const {scrollTo, scrollToIndex, scrollIntoView, isItemVisible, getScrollPosition} = useAnimatedListScroll(
      scroller,
      getScrollerState,
      listComputer
    );
    const markStateDirty = useCallback(
      (dirtyType: 1 | 2 = 2) => {
        if (dirtyType > scrollerState.current.dirty) {
          scrollerState.current.dirty = dirtyType;
          forceUpdateIfNecessary(dirtyType);
        }
      },
      [forceUpdateIfNecessary]
    );
    useResizeObserverSubscription({ref: scroller, onUpdate: markStateDirty, resizeObserver, listenerMap});
    useResizeObserverSubscription({ref: content, onUpdate: markStateDirty, resizeObserver, listenerMap});
    const getItems = useGetItems(items);
    const getSectionRowFromIndex = useGetSectionRowFromIndex(sections);
    useImperativeHandle<ScrollerListRef, ScrollerListRef>(
      ref,
      () => ({
        getScrollerNode() {
          return scroller.current;
        },
        getScrollerState,
        scrollTo,
        scrollIntoView,
        scrollToIndex,
        isItemVisible,
        getScrollPosition,
        // NOTE(amadeus): It would be nice to not surface this API :X
        getItems,
        getSectionRowFromIndex,
      }),
      [
        getScrollerState,
        scrollTo,
        scrollToIndex,
        scrollIntoView,
        isItemVisible,
        getScrollPosition,
        getItems,
        getSectionRowFromIndex,
      ]
    );
    const spacingRef = usePaddingFixes({paddingFix, orientation, dir, className, scroller, specs});
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
      <div ref={scroller} onScroll={handleScroll} className={classes.join(' ')} {...props}>
        {useMemo(
          () => (
            <div ref={content} style={{height: totalHeight}}>
              {renderListItems({items, renderSection, renderRow, renderFooter, wrapSection, spacerTop})}
            </div>
          ),
          [items, renderSection, renderRow, renderFooter, wrapSection, totalHeight, spacerTop]
        )}
        {orientation !== 'auto' && paddingFix && <div aria-hidden className={styles.padding} ref={spacingRef} />}
      </div>
    );
  });
}
