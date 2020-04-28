import React, {useRef, useImperativeHandle, forwardRef, useCallback, useMemo, useState} from 'react';
import usePaddingFixes from './hooks/usePaddingFixes';
import useResizeObserverSubscription from './hooks/useResizeObserverSubscription';
import useVirtualizedContent from './hooks/useVirtualizedContent';
import getScrollbarSpecs from './core/getScrollbarSpecs';
import styles from './Scroller.module.css';
import type {
  ListItem,
  RenderFooter,
  RenderRow,
  RenderSection,
  ScrollEvent,
  ScrollerListProps,
  ScrollerListRef,
  ScrollerListState,
  UpdateCallback,
} from './ScrollerConstants';

const {ResizeObserver} = window;

const INITIAL_SCROLLER_STATE: ScrollerListState = Object.freeze({
  scrollTop: 0,
  scrollHeight: 0,
  offsetHeight: 0,
  dirty: 2,
});

interface RenderListItemProps {
  items: ListItem[];
  renderSection: RenderSection;
  renderRow: RenderRow;
  renderFooter: RenderFooter | undefined;
  spacerTop: number;
  spacerBottom: number;
}

function renderListItems({
  renderSection,
  renderRow,
  renderFooter,
  items,
  spacerTop,
  spacerBottom,
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

  content.push(<div style={{height: spacerBottom}} key="list-spacer-bottom" />);
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

  return forwardRef(function ScrollerList(
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
    }: ScrollerListProps,
    ref: React.Ref<ScrollerListRef>
  ) {
    const scroller = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const scrollerState = useRef<ScrollerListState>(INITIAL_SCROLLER_STATE);
    const getScrollerState = useCallback(() => {
      const {current} = scroller;
      const {dirty} = scrollerState.current;
      if (current == null || dirty === 0) {
        return scrollerState.current;
      }
      if (dirty === 1) {
        const {scrollTop} = current;
        scrollerState.current = {
          ...scrollerState.current,
          scrollTop,
          dirty: 0,
        };
      } else {
        const {scrollTop, scrollHeight, offsetHeight} = current;
        scrollerState.current = {scrollTop, scrollHeight, offsetHeight, dirty: 0};
      }
      return scrollerState.current;
    }, [scroller, scrollerState]);
    const [, setForceUpdate] = useState(() => 0);
    const [{spacerTop, spacerBottom, items}, forceUpdateIfNecessary] = useVirtualizedContent({
      sections,
      sectionHeight,
      rowHeight,
      footerHeight,
      paddingTop,
      paddingBottom,
      chunkSize,
      getScrollerState,
    });
    const markStateDirty = useCallback(
      (dirtyType: 1 | 2 = 2) => {
        if (dirtyType > scrollerState.current.dirty) {
          scrollerState.current.dirty = dirtyType;
          forceUpdateIfNecessary(dirtyType);
        }
      },
      [forceUpdateIfNecessary]
    );
    useResizeObserverSubscription(scroller, markStateDirty, resizeObserver, listenerMap);
    useResizeObserverSubscription(content, markStateDirty, resizeObserver, listenerMap);
    useImperativeHandle<ScrollerListRef, ScrollerListRef>(
      ref,
      () => ({
        getScrollerNode() {
          return scroller.current;
        },
        getScrollerState,
        // NOTE(amadeus): Keeping this around for testing
        forceUpdate() {
          setForceUpdate((a) => a + 1);
        },
      }),
      [getScrollerState]
    );
    const spacingRef = usePaddingFixes(paddingFix, orientation, dir, className, scroller, specs);
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
            <div ref={content}>
              {renderListItems({items, renderSection, renderRow, renderFooter, spacerBottom, spacerTop})}
            </div>
          ),
          [items, renderSection, renderRow, renderFooter, spacerBottom, spacerTop]
        )}
        {orientation !== 'auto' && paddingFix && <div aria-hidden className={styles.padding} ref={spacingRef} />}
      </div>
    );
  });
}
