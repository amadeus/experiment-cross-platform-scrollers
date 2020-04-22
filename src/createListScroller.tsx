import React, {useRef, useImperativeHandle, forwardRef, useCallback} from 'react';
import usePaddingFixes from './hooks/usePaddingFixes';
import useResizeObserverSubscription from './hooks/useResizeObserverSubscription';
import useVirtualizedContent from './hooks/useVirtualizedContent';
import renderItems from './core/renderItems';
import getScrollbarSpecs from './core/getScrollbarSpecs';
import styles from './Scroller.module.css';
import type {
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
        <div ref={content}>
          <div style={{height: spacerTop}} />
          {renderItems({items, renderSection, renderRow, renderFooter})}
          <div style={{height: spacerBottom}} />
        </div>
        {orientation !== 'auto' && paddingFix && <div aria-hidden className={styles.padding} ref={spacingRef} />}
      </div>
    );
  });
}
