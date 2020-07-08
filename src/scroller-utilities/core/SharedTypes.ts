import type React from 'react';

export type ScrollEvent = React.UIEvent<HTMLDivElement>;
export type ScrollerOrientationTypes = 'vertical' | 'horizontal' | 'auto';

export interface ScrollerComponentBaseProps
  extends React.PropsWithoutRef<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>> {
  dir?: 'rtl' | 'ltr';
  paddingFix?: boolean;
}

export interface ScrollerState {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  scrollWidth: number;
  offsetHeight: number;
  offsetWidth: number;
  // A bit of context on the use of two dirty states.  Querying scrollTop on an
  // element is much cheaper than querying offsetHeight and scrollHeight.
  // Therefore we track 2 different types of dirty states, to better track when
  // we actually pull the data from the div node.  Scroll events will set the
  // dirty state to 1, resize events will set the dirty state to 2.  Dirty can
  // only ever go from 1|2->0 or 1->2, but never 2->1
  dirty: 0 | 1 | 2;
}
