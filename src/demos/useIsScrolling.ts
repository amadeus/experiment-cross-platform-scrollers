import {useState, useRef, useCallback} from 'react';

export default function useIsScrolling(): [boolean, () => void] {
  const [, setScrolling] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const scrollingRef = useRef(false);
  const handleScroll = useCallback(() => {
    if (!scrollingRef.current) {
      setScrolling(() => {
        scrollingRef.current = true;
        return scrollingRef.current;
      });
    }
    timeoutRef.current != null && clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setScrolling(() => {
        scrollingRef.current = false;
        return scrollingRef.current;
      });
    }, 60);
  }, []);
  return [scrollingRef.current, handleScroll];
}
