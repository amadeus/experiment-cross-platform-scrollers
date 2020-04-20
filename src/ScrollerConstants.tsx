import type React from 'react';

export type ScrollEvent = React.UIEvent<HTMLDivElement, UIEvent>;

export type ScrollHandler = (event: ScrollEvent) => void;

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

export const INITIAL_SCROLLER_STATE: ScrollerState = Object.freeze({
  scrollTop: 0,
  scrollHeight: 0,
  offsetHeight: 0,
  dirty: true,
});

export enum ScrollbarSizes {
  NONE = 'NONE',
  THIN = 'THIN',
  AUTO = 'AUTO',
}
