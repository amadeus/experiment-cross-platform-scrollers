import React, {memo, useMemo, useCallback} from 'react';
import {ScrollbarSizes} from './Constants';
import CATS from './cats.js';
import createMasonryListScroller from '../factories/createMasonryListScroller';
import useIsScrolling from './useIsScrolling';
import styles from './Demo.module.css';
import scrollbarStyles from './Scrollbars.module.css';
import type {UnitCoords, RenderSection as RenderMasonrySection} from '../factories/createMasonryListScroller';

const MasonryListScrollers = Object.freeze({
  [ScrollbarSizes.NONE]: createMasonryListScroller(scrollbarStyles.noneBase),
  [ScrollbarSizes.THIN]: createMasonryListScroller(scrollbarStyles.thinBase),
  [ScrollbarSizes.AUTO]: createMasonryListScroller(scrollbarStyles.autoBase),
});

type Cat = {
  src: string;
  width: number;
  height: number;
};

const CAT_SECTIONS: Cat[][] = [
  CATS.slice(0, 50),
  CATS.slice(50, 180),
  CATS.slice(180, 402),
  CATS.slice(402, 468),
  CATS.slice(468),
];

const renderMasonrySection: RenderMasonrySection = (section: number, coords: UnitCoords, sectionKey: string) => {
  return section === CAT_SECTIONS.length ? (
    <div style={coords} key={sectionKey} className={styles.masonryFooter}>
      <strong>THIS IS AN EXAMPLE FOOTER</strong>
      <span>It uses a section with no items</span>
    </div>
  ) : (
    <div style={coords} key={sectionKey} className={styles.masonrySection}>
      Section {section + 1}
    </div>
  );
};

const renderMasonryItem = (section: number, item: number, coords: UnitCoords, itemKey: string) => {
  const cat = CAT_SECTIONS[section][item];
  return cat != null ? <img src={cat.src} key={itemKey} style={coords} className={styles.masonryImage} alt="" /> : null;
};

function useCatState() {
  const sections = useMemo(() => {
    const sections = [];
    for (const items of CAT_SECTIONS) {
      sections.push(items.length);
    }
    // Add an example `footer` - using using sections with no items
    sections.push(0);
    return sections;
  }, []);
  const getItemKey = useCallback((section: number, item: number) => {
    return CAT_SECTIONS[section][item].src;
  }, []);
  const getItemHeight = useCallback((section: number, item: number, width: number) => {
    const cat = CAT_SECTIONS[section][item];
    const ratio = cat.height / cat.width;
    return width * ratio;
  }, []);
  const getSectionHeight = useCallback((section: number) => {
    return section === CAT_SECTIONS.length ? 200 : 40;
  }, []);
  return {sections, getItemKey, getItemHeight, getSectionHeight};
}

interface MasonryListExampleProps {
  size: ScrollbarSizes;
  dir: 'ltr' | 'rtl';
  chunkSize: number;
}

export default memo(({size, dir, chunkSize}: MasonryListExampleProps) => {
  const MasonryList = MasonryListScrollers[size];
  const {sections, getItemKey, getItemHeight, getSectionHeight} = useCatState();
  const [isScrolling, handleScroll] = useIsScrolling();
  const classes = [styles.container];
  if (isScrolling) {
    classes.push(styles.scrolling);
  }
  let padding = 12;
  switch (size) {
    case ScrollbarSizes.AUTO:
      padding = 16;
      break;
    case ScrollbarSizes.THIN:
      padding = 8;
      break;
    case ScrollbarSizes.NONE:
    default:
      padding = 4;
  }
  return (
    <MasonryList
      dir={dir}
      className={classes.join(' ')}
      columns={3}
      itemGutter={4}
      sectionGutter={12}
      chunkSize={chunkSize}
      padding={padding}
      sections={sections}
      getItemKey={getItemKey}
      getItemHeight={getItemHeight}
      getSectionHeight={getSectionHeight}
      renderItem={renderMasonryItem}
      renderSection={renderMasonrySection}
      onScroll={handleScroll}
    />
  );
});
