import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import classNames from 'classnames';
import Scroller, {ScrollbarSizes, ScrollerRef} from './Scroller';
import styles from './App.module.css';

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
  const [size, setSize] = useState<ScrollbarSizes>(ScrollbarSizes.THIN);
  const handleChange = useCallback(({currentTarget: {value}}) => {
    switch (value) {
      case ScrollbarSizes.AUTO:
      case ScrollbarSizes.THIN:
      case ScrollbarSizes.NONE:
        setSize(value);
    }
  }, []);

  useEffect(() => {
    const {current} = ref;
    console.log('current imperative api is', current);
  });

  const selectChildren = useMemo(
    () =>
      Object.keys(ScrollbarSizes).map(size => (
        <option value={size} key={size}>
          {size}
        </option>
      )),
    []
  );

  return (
    <>
      <select value={size} onChange={handleChange} className={styles.select}>
        {selectChildren}
      </select>
      <Scroller
        ref={ref}
        className={classNames(styles.container, {
          [styles.thin]: size === ScrollbarSizes.THIN,
          [styles.auto]: size === ScrollbarSizes.AUTO,
        })}
        type={size}
        fade>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
        <div className={styles.item}>An Item</div>
      </Scroller>
    </>
  );
};
