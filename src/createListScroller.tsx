import React, {useRef, useImperativeHandle, forwardRef, useCallback, useMemo, useState} from 'react';
import usePaddingFixes from './hooks/usePaddingFixes';
import useResizeObserverSubscription from './hooks/useResizeObserverSubscription';
import useVirtualizedState from './hooks/useVirtualizedState';
import useAnimatedListScroll from './hooks/useAnimatedListScroll';
import getScrollbarSpecs from './core/getScrollbarSpecs';
import styles from './Scroller.module.css';
import type {ScrollToProps, ScrollIntoViewProps, ScrollToIndexProps} from './hooks/useAnimatedListScroll';
import type {SectionHeight, RowHeight, FooterHeight, ListItem} from './hooks/useVirtualizedState';
import type {ScrollEvent, ScrollerState, UpdateCallback, ScrollerBaseProps} from './core/SharedTypes';

// ListScroller mimics the API from the Discord List component.  The assumption
// with a List component is that it can be rendering a tremendous amount of
// data and therefore should be highly optimized to prevent both dom thrashing
// and minimize the work react has to do to reconcile new changes.  It also has
// fairly complex requirements for animated scrolling as well.

export type RenderSectionFunction = (specs: {section: number}) => React.ReactNode;
export type RenderRowFunction = (specs: {section: number; row: number}) => React.ReactNode;
export type RenderFooterFunction = (specs: {section: number}) => React.ReactNode;

export interface ScrollerListProps extends ScrollerBaseProps {
  // NOTE(amadeus): We should probably not have this API if not really needed?
  // onScrollerStateUpdate?: () => any;

  sections: number[];
  renderSection: RenderSectionFunction;
  renderRow: RenderRowFunction;
  renderFooter?: RenderFooterFunction;

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

  // NOTE(amadeus): Delete me at some point - this is for testing only
  forceUpdate: () => void;
}

const {ResizeObserver} = window;

const INITIAL_SCROLLER_STATE: ScrollerState = Object.freeze({
  scrollTop: 0,
  scrollHeight: 0,
  offsetHeight: 0,
  dirty: 2,
});

interface RenderListItemProps {
  items: ListItem[];
  renderSection: RenderSectionFunction;
  renderRow: RenderRowFunction;
  renderFooter: RenderFooterFunction | undefined;
  spacerTop: number;
}

function renderListItems({
  renderSection,
  renderRow,
  renderFooter,
  items,
  spacerTop,
}: RenderListItemProps): React.ReactNode {
  const content: React.ReactNodeArray = [<div style={{height: spacerTop}} key="list-spacer-top" />];
  let sectionItems: React.ReactNodeArray = [];
  // let lastSection = 0;
  items.forEach(({section, row, footer}) => {
    if (footer === true) {
      // sectionItems.push(renderFooter({section, index}));
      // content.push(wrapSection != null ? wrapSection(lastSection, sectionItems) : sectionItems);
      renderFooter != null && sectionItems.push(renderFooter({section}));
      content.push(sectionItems);
      sectionItems = [];
    } else {
      // lastSection = section;
      if (row == null) {
        sectionItems.push(renderSection({section}));
      } else {
        sectionItems.push(renderRow({section, row}));
      }
    }
  });
  if (sectionItems.length > 0) {
    // content.push(wrapSection ? wrapSection(lastSection, sectionItems) : sectionItems);
    content.push(sectionItems);
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
    // Using this for development testing only and can be removed
    const [, setForceUpdate] = useState(0);
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
    const {scrollTo, scrollToIndex, scrollIntoView} = useAnimatedListScroll(scroller, getScrollerState, listComputer);
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
    useImperativeHandle<ScrollerListRef, ScrollerListRef>(
      ref,
      () => ({
        getScrollerNode() {
          return scroller.current;
        },
        getScrollerState,
        scrollTo,
        scrollToIndex,
        scrollIntoView,
        forceUpdate() {
          setForceUpdate((a) => a + 1);
        },
      }),
      [getScrollerState, scrollTo, scrollToIndex, scrollIntoView]
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
              {renderListItems({items, renderSection, renderRow, renderFooter, spacerTop})}
            </div>
          ),
          [items, renderSection, renderRow, renderFooter, totalHeight, spacerTop]
        )}
        {orientation !== 'auto' && paddingFix && <div aria-hidden className={styles.padding} ref={spacingRef} />}
      </div>
    );
  });
}
