// @flow strict
import React, {useRef, useLayoutEffect, type Node} from 'react';
import classNames from 'classnames';
import typeStyles from './ScrollbarTypes.module.css';
import styles from './Scroller.module.css';

type ThemeSpec = {|
  key: string,
  className: string,
  verticalSize: number,
  horizontalSize: number,
|};

const ThemeSpecs: {[string]: ThemeSpec} = {};

// App specific registration codez
export const Themes = Object.freeze({
  THICC: 'THICC',
  THINN: 'THINN',
  NONEE: 'NONEE',
});

registerTheme(Themes.NONEE, typeStyles.nonee);
registerTheme(Themes.THINN, typeStyles.thin);
registerTheme(Themes.THICC, typeStyles.thic);
console.log(ThemeSpecs);

export function registerTheme(key: string, className: string) {
  const {body} = document;
  if (body == null) {
    throw new Error('Scroller.registerTheme: This file must be sourced after the body has loaded');
  }

  let el = document.createElement('div');
  let anotherEl = document.createElement('div');
  anotherEl.style.width = '800px';
  anotherEl.style.height = '800px';
  el.appendChild(anotherEl);
  body.appendChild(el);
  el.className = classNames(styles.testStyles, className);

  ThemeSpecs[key] = Object.freeze({
    key,
    className,
    verticalSize: el.offsetWidth - el.clientWidth,
    horizontalSize: el.offsetHeight - el.clientHeight,
  });
}

export const Orientations = Object.freeze({
  VERTICAL: (styles.orientationVertical: 'VERTICAL'),
  HORIZONTAL: (styles.orientationHorizontal: 'HORIZONTAL'),
});

function hasVerticalOrientation(orientation: $Values<typeof Orientations>): boolean {
  return orientation === Orientations.VERTICAL;
}

function hasHorizontalOrientation(orientation: $Values<typeof Orientations>): boolean {
  return orientation === Orientations.HORIZONTAL;
}

function cleanupPaddings(
  scrollerRef: {|current: HTMLDivElement | null|},
  paddingRef: {|current: HTMLDivElement | null|},
  orientation: $Values<typeof Orientations> = Orientations.VERTICAL,
  specs: ThemeSpec
) {
  const {current: scroller} = scrollerRef;
  if (scroller == null) {
    return;
  }
  const computedStyle = window.getComputedStyle(scroller);
  scroller.style.paddingRight = '';
  scroller.style.paddingBottom = '';
  if (hasVerticalOrientation(orientation)) {
    const paddingRight = parseInt(computedStyle.getPropertyValue('padding-right'), 10);
    const scrollbarWidth = specs.verticalSize;
    scroller.style.paddingRight = `${Math.max(0, paddingRight - scrollbarWidth)}px`;
    const {current} = paddingRef;
    if (current != null) {
      current.style.height = `${parseInt(computedStyle.getPropertyValue('padding-bottom'), 10)}px`;
      scroller.style.paddingBottom = '0';
    }
  }
  if (hasHorizontalOrientation(orientation)) {
    const paddingBottom = parseInt(computedStyle.getPropertyValue('padding-bottom'), 10);
    const scrollbarHeight = specs.horizontalSize;
    scroller.style.paddingBottom = `${Math.max(0, paddingBottom - scrollbarHeight)}px`;
    const {current} = paddingRef;
    if (current) {
      current.style.width = `${parseInt(computedStyle.getPropertyValue('padding-right'), 10)}px`;
      scroller.style.paddingRight = '0';
    }
  }
}

type ScrollerProps = {|
  children: Node,
  theme: string,
  fade?: boolean,
  orientation?: $Values<typeof Orientations>,
  className?: ?string,
|};

function Scroller({children, theme, className, fade = false, orientation = Orientations.VERTICAL}: ScrollerProps) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const paddingRef = useRef<HTMLDivElement | null>(null);
  const specs = ThemeSpecs[theme];
  if (specs == null) {
    throw new Error(`Scroller: Invalid theme specified: ${theme}`);
  }
  useLayoutEffect(() => cleanupPaddings(scroller, paddingRef, orientation, specs), [specs, orientation, className]);
  return (
    <div
      ref={scroller}
      className={classNames(className, {
        [styles.container]: true,
        [specs.className]: true,
        [orientation]: true,
        [styles.fade]: fade,
      })}>
      {children}
      <div ref={paddingRef} className={styles.scrollablePadding} />
    </div>
  );
}

export default Scroller;
