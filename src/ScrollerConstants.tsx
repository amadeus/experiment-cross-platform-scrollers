import type React from 'react';

export type ScrollEvent = React.UIEvent<HTMLDivElement, UIEvent>;

export type ScrollHandler = (event: ScrollEvent) => void;

export interface ScrollerBaseProps {
  className?: string | null | undefined;
  dir?: 'rtl' | 'ltr';
  orientation?: 'vertical' | 'horizontal' | 'auto';
  paddingFix?: boolean;

  onScroll?: ScrollHandler;
  onKeyDown?: (event: React.KeyboardEvent) => any;
  onKeyPress?: (event: React.KeyboardEvent) => any;
  onKeyUp?: (event: React.KeyboardEvent) => any;
  onFocus?: (event: React.FocusEvent) => any;
  onBlur?: (event: React.FocusEvent) => any;
}

export interface ScrollerProps extends ScrollerBaseProps {
  children: React.ReactNode;
}

type SectionHeight = number | ((section: number) => number);
type RowHeight = number | ((section: number, row?: number) => number);
type FooterHeight = number | ((section: number) => number);

export interface ScrollerListProps extends ScrollerBaseProps {
  // NOTE(amadeus): We should probably not deal with this if possible
  // onScrollerStateUpdate?: () => any;

  renderSection: () => React.ReactNode;
  renderRow: () => React.ReactNode;
  renderFooter: () => React.ReactNode;

  // NOTE(amadeus): We could potentially assume a function for height
  // calculation is not uniform, but if it's just a number, than it's uniform
  // uniform?: boolean;
  sectionHeight: SectionHeight;
  rowHeight: RowHeight;
  footerHeight: FooterHeight;

  // NOTE(amadeus): Figure out how to annotate onResize since it wont actually
  // have any event associated with it... - or even better... DO WE NEED IT?!
  // We have the ResizeObserver, so I could see this being useful as an API...
  // but ideally it's not needed
  // onResize: () => any;

  // NOTE(amadeus): Should we keep this?
  // paddingTop: number;
  // paddingBottom: number;

  'aria-label'?: string;
  'data-ref-id'?: string;
  tabIndex?: -1 | 0;

  // NOTE(amadeus): This is used specifically in 1 place in the app, but I
  // think ideally we should not support it since it can cause issues with
  // rendering/calculating
  // children?: React.ReactNode;
}

export interface ScrollerState {
  scrollTop: number;
  scrollHeight: number;
  offsetHeight: number;
}

export interface ScrollerRef {
  getScrollerNode: () => HTMLDivElement | null;
  getScrollerState: () => ScrollerState;
}

export interface ScrollerListState extends ScrollerState {
  dirty: boolean;
}

export interface ScrollerListRef {
  getScrollerNode: () => HTMLDivElement | null;
  getScrollerState: () => ScrollerListState;
}

export interface ScrollerSpecs {
  width: number;
  height: number;
}
