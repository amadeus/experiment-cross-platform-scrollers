import React, {useRef, useImperativeHandle, forwardRef} from 'react';
import usePaddingFixes from './hooks/usePaddingFixes';
import useScrollerState from './hooks/useScrollerState';
import getScrollbarSpecs from './core/getScrollbarSpecs';
import styles from './Scroller.module.css';
import type {
  ScrollerState,
  ScrollerListState,
  ScrollerProps,
  ScrollerListProps,
  ScrollerRef,
  ScrollerListRef,
} from './ScrollerConstants';

const {ResizeObserver} = window;

const DEFAULT_STATE: ScrollerState = Object.freeze({
  scrollTop: 0,
  scrollHeight: 0,
  offsetHeight: 0,
  dirty: false,
});

export function createScroller(scrollbarClassName?: string) {
  const specs = getScrollbarSpecs(scrollbarClassName);
  return [
    forwardRef(function Scroller(
      {children, className, onScroll, dir = 'ltr', orientation = 'vertical', paddingFix = true}: ScrollerProps,
      ref: React.Ref<ScrollerRef>
    ) {
      const scroller = useRef<HTMLDivElement>(null);
      useImperativeHandle<ScrollerRef, ScrollerRef>(
        ref,
        (): ScrollerRef => ({
          getScrollerNode() {
            return scroller.current;
          },
          getScrollerState() {
            const {current} = scroller;
            if (current != null) {
              const {scrollTop, scrollHeight, offsetHeight} = current;
              return {scrollTop, scrollHeight, offsetHeight, dirty: false};
            }
            return DEFAULT_STATE;
          },
        }),
        []
      );
      const spacingRef = usePaddingFixes(paddingFix, orientation, dir, className, scroller, specs);
      const classes = [
        orientation === 'vertical' ? styles.vertical : orientation === 'horizontal' ? styles.horizontal : styles.auto,
      ];
      scrollbarClassName != null && classes.push(scrollbarClassName);
      className != null && classes.push(className);
      return (
        <div ref={scroller} onScroll={onScroll} className={classes.join(' ')}>
          {children}
          {orientation !== 'auto' && paddingFix && <div aria-hidden className={styles.padding} ref={spacingRef} />}
        </div>
      );
    }),
  ];
}

export function createListScroller(scrollbarClassName?: string) {
  const specs = getScrollbarSpecs(scrollbarClassName);
  const scrollerStates = new Map<Element, React.RefObject<ScrollerListState>>();
  const resizeObserver =
    ResizeObserver != null
      ? new ResizeObserver((entries) => {
          entries.forEach(({target}) => {
            const state = scrollerStates.get(target);
            if (state == null || state.current == null) {
              return;
            }
            !state.current.dirty && (state.current.dirty = true);
          });
        })
      : null;

  return forwardRef(function ScrollerList(
    {className, onScroll, dir = 'ltr', orientation = 'vertical', paddingFix = true}: ScrollerListProps,
    ref: React.Ref<ScrollerListRef>
  ) {
    const {handleScroll, scroller, content, scrollerState} = useScrollerState(onScroll, resizeObserver, scrollerStates);
    useImperativeHandle<ScrollerListRef, ScrollerListRef>(
      ref,
      (): ScrollerListRef => ({
        getScrollerNode() {
          return scroller.current;
        },
        getScrollerState() {
          const {current} = scroller;
          if (current != null && scrollerState.current.dirty) {
            const {scrollTop, scrollHeight, offsetHeight} = current;
            scrollerState.current = {scrollTop, scrollHeight, offsetHeight, dirty: false};
          }
          return scrollerState.current;
        },
      }),
      [scroller, scrollerState]
    );
    const spacingRef = usePaddingFixes(paddingFix, orientation, dir, className, scroller, specs);
    const classes = [
      orientation === 'vertical' ? styles.vertical : orientation === 'horizontal' ? styles.horizontal : styles.auto,
    ];
    scrollbarClassName != null && classes.push(scrollbarClassName);
    className != null && classes.push(className);
    return (
      <div ref={scroller} onScroll={handleScroll} className={classes.join(' ')}>
        <div ref={content}></div>
        {orientation !== 'auto' && paddingFix && <div aria-hidden className={styles.padding} ref={spacingRef} />}
      </div>
    );
  });
}
