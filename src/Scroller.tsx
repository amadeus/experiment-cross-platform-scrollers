import React, {useRef, useLayoutEffect, useImperativeHandle, forwardRef, useCallback} from 'react';
import classNames from 'classnames';
import styles from './Scroller.module.css';

type ScrollEvent = React.UIEvent<HTMLDivElement, UIEvent>;
type ScrollHandler = (event: ScrollEvent) => void;

export type ScrollerProps = {
  className?: string | null | undefined;
  children: React.ReactNode;
  type: ScrollbarSizes;
  fade?: boolean;
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

export enum ScrollbarSizes {
  NONE = 'NONE',
  THIN = 'THIN',
  AUTO = 'AUTO',
}

const getScrollbarWidth = (() => {
  const Widths: Record<string, number> = {};
  let el: HTMLDivElement | null = document.createElement('div');
  let anotherEl: HTMLDivElement | null = document.createElement('div');
  anotherEl.style.width = '800px';
  anotherEl.style.height = '800px';
  el.appendChild(anotherEl);
  document.body.appendChild(el);

  // AUTO
  el.className = classNames(styles.testStyles, styles.auto);
  Widths[ScrollbarSizes.AUTO] = el.offsetWidth - el.clientWidth;

  // THIN
  el.className = classNames(styles.testStyles, styles.thin);
  Widths[ScrollbarSizes.THIN] = el.offsetWidth - el.clientWidth;

  // NONE
  el.className = classNames(styles.testStyles, styles.none);
  Widths[ScrollbarSizes.NONE] = el.offsetWidth - el.clientWidth;

  document.body.removeChild(el);
  el = null;
  anotherEl = null;
  console.log('browser detected scrollbar sizes', Widths);
  return (type: ScrollbarSizes) => Widths[type];
})();

function cleanupPadding(ref: React.RefObject<HTMLDivElement>, type: ScrollbarSizes) {
  const {current} = ref;
  if (current == null) {
    return;
  }
  current.style.paddingRight = '';
  const computedStyle = window.getComputedStyle(current);
  const paddingRight = parseInt(computedStyle.getPropertyValue('padding-right'), 10);
  const scrollbarWidth = getScrollbarWidth(type);
  current.style.paddingRight = `${Math.max(0, paddingRight - scrollbarWidth)}px`;
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

function usePaddingFixes(
  type: ScrollbarSizes,
  className: string | null | undefined,
  scroller: React.RefObject<HTMLDivElement>
) {
  // Fix side padding
  useLayoutEffect(() => cleanupPadding(scroller, type), [type, className, scroller]);
  // Fixes for FF and Edge - bottom padding - do I still want to do this?
  // const [paddingBottom, setPaddingBottom] = useState(null);
  // useLayoutEffect(() => {
  //   const paddingBottom = parseInt(computedStyle.getPropertyValue('padding-bottom'), 10);
  //   setPaddingBottom(paddingBottom);
  // })
}

function Scroller({children, className, type, onScroll, fade = false}: ScrollerProps, ref: React.Ref<ScrollerRef>) {
  const {handleScroll, scroller} = useScrollerState(ref, onScroll);
  usePaddingFixes(type, className, scroller);

  return (
    <div
      ref={scroller}
      onScroll={ref != null || onScroll != null ? handleScroll : undefined}
      className={classNames(className, styles.container, {
        [styles.none]: type === ScrollbarSizes.NONE,
        [styles.thin]: type === ScrollbarSizes.THIN,
        [styles.auto]: type === ScrollbarSizes.AUTO,
        [styles.fade]: fade,
      })}>
      {children}
      {/* This is an FF and Edge fix, and not sure if we should include it */}
      {/* <div className={styles.padding} style={{height: paddingBottom}} /> */}
    </div>
  );
}

export default forwardRef(Scroller);
