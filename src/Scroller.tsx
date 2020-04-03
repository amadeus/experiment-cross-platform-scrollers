import React, {useRef, useLayoutEffect, useImperativeHandle, forwardRef, useCallback} from 'react';
import styles from './Scroller.module.css';

type ScrollEvent = React.UIEvent<HTMLDivElement, UIEvent>;
type ScrollHandler = (event: ScrollEvent) => void;

export type ScrollerProps = {
  className?: string | null | undefined;
  dir?: 'rtl' | 'ltr';
  orientation?: 'vertical' | 'horizontal' | 'manual';
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

function getScrollbarWidth(className?: string): {width: number; height: number} {
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

export default function createScroller(scrollbarClassName?: string) {
  const specs = getScrollbarWidth(scrollbarClassName);

  function usePaddingFixes(
    orientation: 'vertical' | 'horizontal' | 'manual',
    dir: 'ltr' | 'rtl',
    className: string | null | undefined,
    scroller: React.RefObject<HTMLDivElement>
  ) {
    const spacingRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(
      () => {
        const {current} = scroller;
        if (current == null || orientation === 'manual') {
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
      [orientation, dir, className, scroller]
    );
    return spacingRef;
  }

  return forwardRef(function Scroller(
    {children, className, onScroll, dir = 'ltr', orientation = 'vertical'}: ScrollerProps,
    ref: React.Ref<ScrollerRef>
  ) {
    const {handleScroll, scroller} = useScrollerState(ref, onScroll);
    const spacingRef = usePaddingFixes(orientation, dir, className, scroller);
    const classes = [styles.container, orientation === 'vertical' ? styles.vertical : styles.horizontal];
    scrollbarClassName != null && classes.push(scrollbarClassName);
    className != null && classes.push(className);
    return (
      <div
        ref={scroller}
        onScroll={ref != null || onScroll != null ? handleScroll : undefined}
        className={classes.join(' ')}>
        {children}
        {orientation !== 'manual' && <div aria-hidden className={styles.padding} ref={spacingRef} />}
      </div>
    );
  });
}
