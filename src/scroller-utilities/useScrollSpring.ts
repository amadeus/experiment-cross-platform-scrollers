import {useState} from 'react';

import ManualSpring from './core/ManualSpring';

export default function useScrollSpring(
  scrollerRef: React.RefObject<HTMLDivElement>,
  orientation: 'vertical' | 'horizontal' = 'vertical'
): ManualSpring {
  const [spring] = useState(
    () =>
      new ManualSpring({
        // Some decent settings for managing a range of scroll speeds
        tension: 200,
        friction: 35,
        mass: 2,
        clamp: true,
        callback: (value: number, abort: () => void) => {
          const {current} = scrollerRef;
          if (current == null) return abort();
          if (orientation === 'horizontal') {
            current.scrollLeft = value;
          } else {
            current.scrollTop = value;
          }
        },
        getNodeWindow: () => scrollerRef.current?.ownerDocument?.defaultView || null,
      })
  );
  return spring;
}
