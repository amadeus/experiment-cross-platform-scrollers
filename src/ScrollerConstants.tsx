import type React from 'react';

export type UpdateCallback = () => void;
export type ScrollEvent = React.UIEvent<HTMLDivElement, UIEvent>;
export type ScrollHandler = (event: ScrollEvent) => void;

export type SectionHeight = number | ((section: number) => number);
export type RowHeight = number | ((section: number, row: number) => number);
export type FooterHeight = number | ((section: number) => number);

export type RenderSection = (specs: {section: number}) => React.ReactNode;
export type RenderRow = (specs: {section: number; row: number}) => React.ReactNode;
export type RenderFooter = (specs: {section: number}) => React.ReactNode;

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

export interface ScrollerListProps extends ScrollerBaseProps {
  // NOTE(amadeus): We should probably not deal with this if possible
  // onScrollerStateUpdate?: () => any;

  sections: number[];
  renderSection: RenderSection;
  renderRow: RenderRow;
  renderFooter?: RenderFooter;

  // NOTE(amadeus): We could potentially assume a function for height
  // calculation is not uniform, but if it's just a number, than it's uniform
  // uniform?: boolean;
  sectionHeight: SectionHeight;
  rowHeight: RowHeight;
  footerHeight?: FooterHeight;

  // NOTE(amadeus): The size in pixels that we should chunk rendering blocks too
  chunkSize?: number;

  // NOTE(amadeus): Figure out how to annotate onResize since it wont actually
  // have any event associated with it... - or even better... DO WE NEED IT?!
  // We have the ResizeObserver, so I could see this being useful as an API...
  // but ideally it's not needed
  // onResize: () => any;

  // NOTE(amadeus): Should we keep this?
  paddingTop?: number;
  paddingBottom?: number;

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
  // A bit of context on the use of two dirty states.  Querying scrollTop on an
  // element is much cheaper than querying offsetHeight and scrollHeight.
  // Therefore we track 2 different types of dirty states, to better track when
  // we actually pull the data from the div node.  Scroll events will set the
  // dirty state to 1, resize events will set the dirty state to 2.  Dirty can
  // only ever go from 1|2->0 or 1->2, but never 2->1
  dirty: 0 | 1 | 2;
}

export interface ScrollerListRef {
  getScrollerNode: () => HTMLDivElement | null;
  getScrollerState: () => ScrollerListState;
}

export interface ScrollerSpecs {
  width: number;
  height: number;
}

export interface ListItem {
  section: number;
  row?: number;
  footer?: boolean;

  // NOTE(amadeus): Do I actually, in effect, need these?
  // index: numbur;
  // rowIndex?: number;
}

export interface ListState {
  spacerTop: number;
  spacerBottom: number;
  items: ListItem[];
}
