import React, {memo, useState} from 'react';
import createAdvancedScroller from '../factories/createAdvancedScroller';
import generateRow from './generateRow';
import {ScrollbarSizes} from './Constants';
import styles from './Demo.module.css';
import scrollbarStyles from './Scrollbars.module.css';

const AdvancedScrollers = Object.freeze({
  [ScrollbarSizes.NONE]: createAdvancedScroller(scrollbarStyles.none),
  [ScrollbarSizes.THIN]: createAdvancedScroller(scrollbarStyles.thin),
  [ScrollbarSizes.AUTO]: createAdvancedScroller(scrollbarStyles.auto),
});

interface ScrollerExampleProps {
  size: ScrollbarSizes;
  dir: 'ltr' | 'rtl';
  chunkSize: number;
}

export default memo(({size, dir}: ScrollerExampleProps) => {
  const Scroller = AdvancedScrollers[size];
  const [children] = useState(() => new Array(100).fill(null).map((_, index) => generateRow(index)));
  return (
    <Scroller className={styles.container} dir={dir}>
      {children}
    </Scroller>
  );
});
