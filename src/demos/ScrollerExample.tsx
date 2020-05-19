import React, {memo, useState} from 'react';
import createScroller from '../factories/createScroller';
import generateRow from './generateRow';
import {ScrollbarSizes} from './Constants';
import styles from './Demo.module.css';
import scrollbarStyles from './Scrollbars.module.css';

const BasicScrollers = Object.freeze({
  [ScrollbarSizes.NONE]: createScroller(scrollbarStyles.none),
  [ScrollbarSizes.THIN]: createScroller(scrollbarStyles.thin),
  [ScrollbarSizes.AUTO]: createScroller(scrollbarStyles.auto),
});

interface ScrollerExampleProps {
  size: ScrollbarSizes;
  dir: 'ltr' | 'rtl';
  chunkSize: number;
}

export default memo(({size, dir}: ScrollerExampleProps) => {
  const Scroller = BasicScrollers[size];
  const [children] = useState(() => new Array(100).fill(null).map((_, index) => generateRow(index)));
  return (
    <Scroller className={styles.container} dir={dir}>
      {children}
    </Scroller>
  );
});
