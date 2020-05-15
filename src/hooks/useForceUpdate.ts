import {useCallback, useState} from 'react';

export default function useForceUpdate() {
  const [, updateState] = useState(0);
  return useCallback(() => updateState((i) => i + 1), []);
}
