import {useLayoutEffect} from 'react';

export type ResizeObserverUpdateCallback = () => unknown;

export declare class ResizeObserverInterface {
  observe(target: Element, options?: {box?: 'content-box' | 'border-box'}): void;
  unobserve(target: Element): void;
}

export interface ResizeObserverSubscriptionProps {
  ref: React.RefObject<HTMLElement>;
  onUpdate: ResizeObserverUpdateCallback;
  resizeObserver: ResizeObserverInterface;
  listenerMap: Map<Element, ResizeObserverUpdateCallback>;
}

const OBSERVE_OPTIONS = Object.freeze({
  box: 'border-box',
} as const);

export default function useResizeObserverSubscription({
  ref,
  onUpdate,
  resizeObserver,
  listenerMap,
}: ResizeObserverSubscriptionProps) {
  useLayoutEffect(() => {
    const {current} = ref;
    if (current != null) {
      listenerMap.set(current, onUpdate);
      resizeObserver.observe(current, OBSERVE_OPTIONS);
    }
    return () => {
      if (current != null) {
        resizeObserver.unobserve(current);
        listenerMap.delete(current);
      }
    };
  }, [onUpdate, resizeObserver, ref, listenerMap]);
}
