import type ManualSpring from './ManualSpring';
import type {ScrollerState} from './SharedTypes';

export interface ScrollToAPI {
  animate?: boolean;
  callback?: () => void | undefined;
}

export interface ScrollToProps extends ScrollToAPI {
  to: number;
}

export interface ScrollIntoViewProps extends ScrollToAPI {
  start: number;
  end: number;
  padding?: number;
}

export interface AnimatedScrollHelperState {
  spring: ManualSpring;
  scrollTo: (props: ScrollToProps) => void;
  scrollIntoView: (props: ScrollIntoViewProps) => void;
  scrollPageUp: (props?: ScrollToAPI) => void;
  scrollPageDown: (props?: ScrollToAPI) => void;
  scrollToTop: (props?: ScrollToAPI) => void;
  scrollToBottom: (props?: ScrollToAPI) => void;
  isScrolledToTop: () => boolean;
  isScrolledToBottom: () => boolean;
}

interface OrientedScrollData {
  scrollPosition: number;
  scrollSize: number;
  offsetSize: number;
}

function getScrollDataFromOrientation(scrollData: any, orientation: 'vertical' | 'horizontal'): OrientedScrollData {
  if (orientation === 'horizontal') {
    const {scrollLeft: scrollPosition, scrollWidth: scrollSize, offsetWidth: offsetSize} = scrollData;
    return {scrollPosition, scrollSize, offsetSize};
  }
  const {scrollTop: scrollPosition, scrollHeight: scrollSize, offsetHeight: offsetSize} = scrollData;
  return {scrollPosition, scrollSize, offsetSize};
}

function constrainScrollPosition(to: number, scrollSize: number, offsetSize: number): number {
  const maxScroll = scrollSize - offsetSize + 1;
  // This is to force account for browser scaling rounding errors - to ensure
  // we scroll to the bottom
  if (to >= maxScroll - 1) {
    return maxScroll;
  }
  return Math.max(0, to);
}

export default function getAnimatedScrollHelpers(
  nodeRef: React.RefObject<HTMLElement>,
  getScrollerState: () => ScrollerState,
  spring: ManualSpring,
  orientation: 'vertical' | 'horizontal' = 'vertical'
): AnimatedScrollHelperState {
  // Your basic scrollTo API - give it a target, maybe a callback, even animate
  // if you want.  If possible - all other methods should thread through this
  // one to perform scrolling, since it provides some specialized helpers for
  // overscroll and browser zoom support.
  const scrollTo = ({to, animate, callback}: ScrollToProps) => {
    const {scrollPosition, scrollSize, offsetSize} = getScrollDataFromOrientation(getScrollerState(), orientation);
    spring.to({to: constrainScrollPosition(to, scrollSize, offsetSize), from: scrollPosition, animate, callback});
  };
  return {
    spring,
    scrollTo,

    // Scrolls one full visual page of content up
    scrollPageUp({animate = false, callback}: ScrollToAPI = {}) {
      const {scrollPosition, offsetSize} = getScrollDataFromOrientation(getScrollerState(), orientation);
      scrollTo({to: scrollPosition - offsetSize, animate, callback});
    },

    // Scrolls one full visual page of content down
    scrollPageDown({animate = false, callback}: ScrollToAPI = {}) {
      const {scrollPosition, offsetSize} = getScrollDataFromOrientation(getScrollerState(), orientation);
      scrollTo({to: scrollPosition + offsetSize, animate, callback});
    },

    // Scroll to the top of the document
    scrollToTop({animate = false, callback}: ScrollToAPI = {}) {
      scrollTo({to: 0, animate, callback});
    },

    // Scroll to the bottom of the document
    scrollToBottom({animate = false, callback}: ScrollToAPI = {}) {
      scrollTo({to: Number.MAX_SAFE_INTEGER, animate, callback});
    },

    // A bit fancier of an API - basically take a rectangle and ensure it's in
    // view, if not, scroll there, with all the optional configuration of the
    // basic API
    scrollIntoView({start, end, padding = 0, animate, callback}: ScrollIntoViewProps) {
      const {scrollPosition, offsetSize} = getScrollDataFromOrientation(getScrollerState(), orientation);
      start -= padding;
      end += padding;
      // If we are already in view - fire the callback and don't do anything
      if (start >= scrollPosition && end <= scrollPosition + offsetSize) {
        callback != null && callback();
      } else if (start < scrollPosition) {
        scrollTo({to: start, animate, callback});
      } else {
        scrollTo({to: end - offsetSize, animate, callback});
      }
    },

    isScrolledToTop() {
      return getScrollDataFromOrientation(getScrollerState(), orientation).scrollPosition === 0;
    },

    isScrolledToBottom() {
      const {scrollPosition, scrollSize, offsetSize} = getScrollDataFromOrientation(getScrollerState(), orientation);
      return scrollPosition >= scrollSize - offsetSize;
    },
  };
}
