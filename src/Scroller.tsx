import React, {useRef, useLayoutEffect, useImperativeHandle, forwardRef, useCallback} from 'react';
import styles from './Scroller.module.css';

type ScrollEvent = React.UIEvent<HTMLDivElement, UIEvent>;
type ScrollHandler = (event: ScrollEvent) => void;

export interface ScrollerProps {
  className?: string | null | undefined;
  dir?: 'rtl' | 'ltr';
  orientation?: 'vertical' | 'horizontal' | 'auto';
  paddingFix?: boolean;
  children: React.ReactNode;
  onScroll?: ScrollHandler;
}

export interface ScrollerRef {
  getScrollerNode: () => HTMLDivElement | null;
  getScrollerState: () => ScrollerState;
}

export interface ScrollerState {
  scrollTop: number;
  scrollHeight: number;
  offsetHeight: number;
  dirty: boolean;
}

export interface ScrollerSpecs {
  width: number;
  height: number;
}

const INITIAL_SCROLLER_STATE: ScrollerState = Object.freeze({
  scrollTop: 0,
  scrollHeight: 0,
  offsetHeight: 0,
  dirty: true,
});

const {ResizeObserver} = window;

function getScrollbarSpecs(className?: string): ScrollerSpecs {
  let el: HTMLDivElement | null = document.createElement('div');
  let anotherEl: HTMLDivElement | null = document.createElement('div');
  anotherEl.className = styles.testInnerStyles;
  el.appendChild(anotherEl);
  document.body.appendChild(el);
  el.className = [className, styles.testStyles].join(' ');
  const specs = {width: el.offsetWidth - el.clientWidth, height: el.offsetHeight - el.clientHeight};
  document.body.removeChild(el);
  el = null;
  anotherEl = null;
  console.log('browser detected scrollbar specs', specs);
  return specs;
}

function useScrollerState(
  ref: React.Ref<ScrollerRef>,
  onScroll: ScrollHandler | undefined,
  hasRef: boolean,
  resizeObserver: ResizeObserver | null,
  scrollerStates: Map<Element, React.RefObject<ScrollerState>>
) {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollerState = useRef<ScrollerState>(INITIAL_SCROLLER_STATE);
  const handleScroll = useCallback(
    (event: ScrollEvent) => {
      !scrollerState.current.dirty && (scrollerState.current.dirty = true);
      onScroll != null && onScroll(event);
    },
    [onScroll]
  );
  useImperativeHandle<ScrollerRef, ScrollerRef>(
    ref,
    (): ScrollerRef => ({
      getScrollerNode() {
        return scroller.current;
      },
      getScrollerState() {
        const {current} = scroller;
        if (current != null && scrollerState.current.dirty) {
          const {scrollTop, scrollHeight, offsetHeight} = current;
          scrollerState.current = {
            scrollTop,
            scrollHeight,
            offsetHeight,
            dirty: false,
          };
        }
        return scrollerState.current;
      },
    }),
    []
  );
  useLayoutEffect(
    () => {
      const {current} = scroller;
      if (resizeObserver == null || current == null || !hasRef) {
        return;
      }
      scrollerStates.set(current, scrollerState);
      resizeObserver.observe(current);
      return () => {
        resizeObserver.unobserve(current);
        scrollerStates.delete(current);
      };
    },
    [hasRef, resizeObserver, scrollerStates]
  );

  return {handleScroll, scroller};
}

function usePaddingFixes(
  paddingFix: boolean,
  orientation: 'vertical' | 'horizontal' | 'auto',
  dir: 'ltr' | 'rtl',
  className: string | null | undefined,
  scroller: React.RefObject<HTMLDivElement>,
  specs: ScrollerSpecs
) {
  const spacingRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(
    () => {
      const {current} = scroller;
      if (current == null || orientation === 'auto' || !paddingFix) {
        return;
      }
      const computedStyle = window.getComputedStyle(current);
      if (orientation === 'vertical') {
        if (dir === 'rtl') {
          const paddingLeft = parseInt(computedStyle.getPropertyValue('padding-left'), 10);
          current.style.paddingLeft = `${Math.max(0, paddingLeft - specs.width)}px`;
          current.style.paddingRight = '';
        } else {
          const paddingRight = parseInt(computedStyle.getPropertyValue('padding-right'), 10);
          current.style.paddingRight = `${Math.max(0, paddingRight - specs.width)}px`;
          current.style.paddingLeft = '';
        }
        const {current: _current} = spacingRef;
        if (_current != null) {
          _current.style.height = computedStyle.getPropertyValue('padding-bottom');
        }
      } else {
        const paddingBottom = parseInt(computedStyle.getPropertyValue('padding-bottom'), 10);
        current.style.paddingBottom = `${Math.max(0, paddingBottom - specs.height)}px`;
        const {current: _current} = spacingRef;
        if (_current != null) {
          _current.style.width = computedStyle.getPropertyValue('padding-left');
        }
      }
    },
    [orientation, dir, className, scroller, paddingFix, specs]
  );
  return spacingRef;
}

export default function createScroller(scrollbarClassName?: string) {
  const specs = getScrollbarSpecs(scrollbarClassName);
  const scrollerStates = new Map<Element, React.RefObject<ScrollerState>>();
  const resizeObserver =
    ResizeObserver != null
      ? new ResizeObserver(entries => {
          entries.forEach(({target}) => {
            const state = scrollerStates.get(target);
            if (state == null || state.current == null) {
              return;
            }
            !state.current.dirty && (state.current.dirty = true);
          });
        })
      : null;

  return forwardRef(function Scroller(
    {children, className, onScroll, dir = 'ltr', orientation = 'vertical', paddingFix = true}: ScrollerProps,
    ref: React.Ref<ScrollerRef>
  ) {
    const {handleScroll, scroller} = useScrollerState(ref, onScroll, ref != null, resizeObserver, scrollerStates);
    const spacingRef = usePaddingFixes(paddingFix, orientation, dir, className, scroller, specs);
    const classes = [
      orientation === 'vertical' ? styles.vertical : orientation === 'horizontal' ? styles.horizontal : styles.auto,
    ];
    scrollbarClassName != null && classes.push(scrollbarClassName);
    className != null && classes.push(className);
    return (
      <div
        ref={scroller}
        onScroll={ref != null || onScroll != null ? handleScroll : undefined}
        className={classes.join(' ')}>
        {children}
        {orientation !== 'auto' && paddingFix && <div aria-hidden className={styles.padding} ref={spacingRef} />}
      </div>
    );
  });
}
