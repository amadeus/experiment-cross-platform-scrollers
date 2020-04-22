import {useLayoutEffect} from 'react';
import type {UpdateCallback} from '../ScrollerConstants';

export default function useResizeObserverSubscription(
  ref: React.RefObject<HTMLElement>,
  onUpdate: UpdateCallback,
  resizeObserver: ResizeObserver | null,
  listenerMap: Map<Element, UpdateCallback>
) {
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
