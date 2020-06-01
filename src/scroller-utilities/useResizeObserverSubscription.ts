import {useLayoutEffect} from 'react';

export type ResizeObserverUpdateCallback = () => void;

export interface ResizeObserverSubscriptionProps {
  ref: React.RefObject<HTMLElement>;
  onUpdate: ResizeObserverUpdateCallback;
  resizeObserver: ResizeObserver | null;
  listenerMap: Map<Element, ResizeObserverUpdateCallback>;
}

export default function useResizeObserverSubscription({
  ref,
  onUpdate,
  resizeObserver,
  listenerMap,
}: ResizeObserverSubscriptionProps) {
  useLayoutEffect(() => {
    if (resizeObserver == null) {
      return;
    }
    const {current} = ref;
    if (current != null) {
      listenerMap.set(current, onUpdate);
      resizeObserver.observe(current);
    }
    return () => {
      if (current != null) {
        resizeObserver.unobserve(current);
        listenerMap.delete(current);
      }
    };
  }, [onUpdate, resizeObserver, ref, listenerMap]);
}
