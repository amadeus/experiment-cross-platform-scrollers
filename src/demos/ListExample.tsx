import React, {memo, useRef} from 'react';
import createListScroller from '../factories/createListScroller';
import useIsScrolling from './useIsScrolling';
import {ScrollbarSizes} from './Constants';
import styles from './Demo.module.css';
import scrollbarStyles from './Scrollbars.module.css';
import type {
  ListScrollerRef,
  RenderSectionFunction,
  RenderRowFunction,
  RenderWrapperFunction,
} from '../factories/createListScroller';

const ListScrollers = Object.freeze({
  [ScrollbarSizes.NONE]: createListScroller(scrollbarStyles.noneBase, ResizeObserver),
  [ScrollbarSizes.THIN]: createListScroller(scrollbarStyles.thinBase, ResizeObserver),
  [ScrollbarSizes.AUTO]: createListScroller(scrollbarStyles.autoBase, ResizeObserver),
});

const LIST_SECTIONS = [10, 3, 30, 10, 42, 92, 10, 3, 30, 10, 42, 92, 10, 3, 30, 10, 42, 92];

const renderListSection: RenderSectionFunction = ({section}) => {
  return (
    <div key={`section-${section}`} className={styles.section}>
      Section {section}
    </div>
  );
};

interface RowProps {
  section: number;
  row: number;
}

function Row({section, row}: RowProps) {
  return (
    <div key={`row-${section}-${row}`} className={styles.row}>
      Row {section}-{row}
    </div>
  );
}

const renderRow: RenderRowFunction = ({section, row}) => {
  return <Row key={`row-${section}-${row}`} section={section} row={row} />;
};

const wrapSection: RenderWrapperFunction = (section, children) => {
  return (
    <div key={`section-wrapper-${section}`} data-section={section}>
      {children}
    </div>
  );
};

interface ListExampleProps {
  size: ScrollbarSizes;
  dir: 'ltr' | 'rtl';
  chunkSize: number;
}

export default memo(({size, dir}: ListExampleProps) => {
  const ref = useRef<ListScrollerRef>(null);
  const List = ListScrollers[size];
  const [isScrolling, handleScroll] = useIsScrolling();
  const classes = [styles.container];
  if (isScrolling) {
    classes.push(styles.scrolling);
  }
  return (
    <List
      // NOTE(amadeus): Add scroll toggling control to this
      ref={ref}
      dir={dir}
      onScroll={handleScroll}
      className={classes.join(' ')}
      sections={LIST_SECTIONS}
      sectionHeight={48}
      rowHeight={24}
      renderSection={renderListSection}
      renderRow={renderRow}
      wrapSection={wrapSection}
      paddingBottom={8}
    />
  );
});
