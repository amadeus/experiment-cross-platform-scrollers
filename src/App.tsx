import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import createScroller, {ScrollerRef} from './Scroller';
import generateRow from './generateRow';
import styles from './App.module.css';

const ScrollerNone = createScroller(styles.none);
const ScrollerThin = createScroller(styles.thin);
const ScrollerAuto = createScroller(styles.auto);

enum ScrollbarSizes {
  NONE = 'NONE',
  THIN = 'THIN',
  AUTO = 'AUTO',
}

// There are a few various contexts we need to be able to support
// * Chrome - supports custom scrollbar styles which automatically pad the
// content for us
// * Firefox - Latest version of firefox supports custom scrollbars but on mac,
// depending on settings the scrollbar may or may not pad the content, so we
// need to detect whether the content is padded or not from the custom
// scrollbar styles
// * All other browsers - if the custom css scrollbar styles affect the
// scrollbar within the desired range then we assume it looks correct,
// otherwise we need to add additional padding to account for the scrollbar

export default () => {
  const ref = useRef<ScrollerRef>(null);
  const [size, setSize] = useState<ScrollbarSizes>(ScrollbarSizes.AUTO);
  const handleChange = useCallback(({currentTarget: {value}}) => {
    switch (value) {
      case ScrollbarSizes.AUTO:
      case ScrollbarSizes.THIN:
      case ScrollbarSizes.NONE:
        setSize(value);
    }
  }, []);

  const [children, setChildren] = useState(() => new Array(30).fill(null).map((_, index) => generateRow(index)));
  const handleClick = useCallback(() => {
    setChildren(children => [...children, generateRow(children.length)]);
  }, []);

  useEffect(() => {
    const {current} = ref;
    // @ts-ignore
    window.DERP = current;
    console.log('current imperative api is', current);
  }, []);

  const selectChildren = useMemo(
    () =>
      Object.keys(ScrollbarSizes).map(size => (
        <option value={size} key={size}>
          {size}
        </option>
      )),
    []
  );

  let Scroller;
  if (size === ScrollbarSizes.NONE) {
    Scroller = ScrollerNone;
  } else if (size === ScrollbarSizes.THIN) {
    Scroller = ScrollerThin;
  } else {
    Scroller = ScrollerAuto;
  }

  return (
    <>
      <div className={styles.tools}>
        <select value={size} onChange={handleChange} className={styles.select}>
          {selectChildren}
        </select>
        <button onClick={handleClick}>Add Item</button>
      </div>
      <Scroller ref={ref} className={styles.container}>
        {children}
      </Scroller>
    </>
  );
};
