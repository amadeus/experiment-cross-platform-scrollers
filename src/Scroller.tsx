import React, {useRef, useLayoutEffect, useImperativeHandle, forwardRef} from 'react';
import classNames from 'classnames';
import styles from './Scroller.module.css';

export type ScrollerProps = {
  className?: string | null | undefined;
  children: React.ReactNode;
  type: ScrollbarSizes;
  fade?: boolean;
};

export type ScrollerRef = {
  getScrollerNode: () => HTMLDivElement | null;
};

export enum ScrollbarSizes {
  NONE = 'NONE',
  THIN = 'THIN',
  AUTO = 'AUTO',
}

const getScrollbarWidth = (() => {
  const Widths: Record<string, number> = {};
  let el = document.createElement('div');
  let anotherEl = document.createElement('div');
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
  // @ts-ignore
  el = null;
  // @ts-ignore
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

function Scroller({children, className, type, fade = false}: ScrollerProps, ref: React.Ref<ScrollerRef>) {
  const scroller = useRef<HTMLDivElement>(null);

  // Fix side padding
  useLayoutEffect(() => cleanupPadding(scroller, type), [type, className]);

  // Fixes for FF and Edge - bottom padding - do I still want to do this?
  // const [paddingBottom, setPaddingBottom] = useState(null);
  // useLayoutEffect(() => {
  //   const paddingBottom = parseInt(computedStyle.getPropertyValue('padding-bottom'), 10);
  //   setPaddingBottom(paddingBottom);
  // })

  // Scroller API - fill out with more features
  useImperativeHandle(ref, () => ({getScrollerNode: () => scroller.current}), []);

  return (
    <div
      ref={scroller}
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
