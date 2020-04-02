import React, {useRef, useLayoutEffect, useImperativeHandle, forwardRef, useCallback} from 'react';
import classNames from 'classnames';
import styles from './Scroller.module.css';

type ScrollEvent = React.UIEvent<HTMLDivElement, UIEvent>;
type ScrollHandler = (event: ScrollEvent) => void;

export type ScrollerProps = {
  className?: string | null | undefined;
  children: React.ReactNode;
  onScroll?: ScrollHandler;
};

export type ScrollerRef = {
  getScrollerNode: () => HTMLDivElement | null;
  getScrollerState: () => ScrollerState;
};

export type ScrollerState = {
  scrollTop: number;
  scrollHeight: number;
  offsetHeight: number;
  dirty: boolean;
};

// @ts-ignore
const ResizeObserver: any = window.ResizeObserver;

function getScrollbarWidth(className: string): {width: number; height: number} {
  let el: HTMLDivElement | null = document.createElement('div');
  let anotherEl: HTMLDivElement | null = document.createElement('div');
  anotherEl.className = styles.testInnerStyles;
  el.appendChild(anotherEl);
  document.body.appendChild(el);
  el.className = classNames(className, styles.testStyles);
  const specs = {width: el.offsetWidth - el.clientWidth, height: el.offsetHeight - el.clientHeight};
  document.body.removeChild(el);
  el = null;
  anotherEl = null;
  console.log('browser detected scrollbar sizes', specs);
  return specs;
}

function useScrollerState(ref: React.Ref<ScrollerRef>, onScroll: ScrollHandler | undefined) {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollerState = useRef<ScrollerState>({scrollTop: 0, scrollHeight: 0, offsetHeight: 0, dirty: true});
  const handleScroll = useCallback(
    (event: ScrollEvent) => {
      scrollerState.current.dirty = true;
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
  useLayoutEffect(() => {
    if (ResizeObserver == null) {
      return;
    }
    const resizeObserver = new ResizeObserver(() => {
      scrollerState.current.dirty = true;
    });
    resizeObserver.observe(scroller.current);
    return () => resizeObserver.disconnect();
  }, []);

  return {handleScroll, scroller};
}

export default function createScroller(scrollbarClassName: string = '') {
  const specs = getScrollbarWidth(scrollbarClassName);

  function usePaddingFixes(className: string | null | undefined, scroller: React.RefObject<HTMLDivElement>) {
    const bottomRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(
      () => {
        const {current} = scroller;
        if (current == null) {
          return;
        }
        const computedStyle = window.getComputedStyle(current);
        const paddingRight = parseInt(computedStyle.getPropertyValue('padding-right'), 10);
        current.style.paddingRight = `${Math.max(0, paddingRight - specs.width)}px`;

        const {current: _current} = bottomRef;
        if (_current != null) {
          _current.style.height = computedStyle.getPropertyValue('padding-bottom');
        }
      },
      [className, scroller]
    );
    return bottomRef;
  }

  return forwardRef(function Scroller({children, className, onScroll}: ScrollerProps, ref: React.Ref<ScrollerRef>) {
    const {handleScroll, scroller} = useScrollerState(ref, onScroll);
    const bottomRef = usePaddingFixes(className, scroller);
    return (
      <div
        ref={scroller}
        onScroll={ref != null || onScroll != null ? handleScroll : undefined}
        className={classNames(className, styles.container, scrollbarClassName)}>
        {children}
        {/* This is an FF and Edge fix, and not sure if we should include it */}
        <div aria-hidden className={styles.padding} ref={bottomRef} />
      </div>
    );
  });
}
