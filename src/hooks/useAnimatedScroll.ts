import {useState} from 'react';
import ManualSpring from '../core/ManualSpring';

export default function useAnimatedScroll(nodeRef: React.RefObject<HTMLElement>) {
  const [spring] = useState(
    () =>
      new ManualSpring({
        // Some decent settings for managing a range of scroll speeds
        tension: 200,
        friction: 35,
        mass: 2,
        clamp: true,
        callback: (value: number, abort: () => void) => {
          const {current} = nodeRef;
          if (current == null) {
            abort();
            return;
          }
          current.scrollTop = value;
        },
      })
  );
  return spring;
}
