import React, {memo, useMemo, useCallback, useState, useEffect} from 'react';
import {ScrollbarSizes} from './Constants';
import createMasonryListScroller from '../factories/createMasonryListScroller';
import useIsScrolling from './useIsScrolling';
import styles from './Demo.module.css';
import scrollbarStyles from './Scrollbars.module.css';
import type {RenderSection as RenderMasonrySection} from '../factories/createMasonryListScroller';
import type {MasonryListUnitCoords} from '../scroller-utilities';

const MasonryListScrollers = Object.freeze({
  [ScrollbarSizes.NONE]: createMasonryListScroller(scrollbarStyles.noneBase, ResizeObserver),
  [ScrollbarSizes.THIN]: createMasonryListScroller(scrollbarStyles.thinBase, ResizeObserver),
  [ScrollbarSizes.AUTO]: createMasonryListScroller(scrollbarStyles.autoBase, ResizeObserver),
});

type Cat = {
  src: string;
  width: number;
  height: number;
};

function useCatState() {
  const [catSections, setCatSections] = useState<Cat[][]>([]);
  const sections = useMemo(() => {
    const sections = [];
    for (const items of catSections) {
      sections.push(items.length);
    }
    // Add an example `footer` - using using sections with no items
    sections.push(0);
    return sections;
  }, [catSections]);
  const getItemKey = useCallback((section: number, item: number) => catSections[section][item].src, [catSections]);
  const getItemHeight = useCallback(
    (section: number, item: number, width: number) => {
      const cat = catSections[section][item];
      const ratio = cat.height / cat.width;
      return width * ratio;
    },
    [catSections]
  );
  const getSectionHeight = useCallback((section: number) => (section === catSections.length ? 200 : 40), [catSections]);
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/gh/amadeus/cats@732143d54d883ad791fbe1a0ddd830607078149b/cats.json')
      .then((response) => response.json())
      .then((cats) => {
        // Random made up sections
        setCatSections([
          cats.slice(0, 50),
          cats.slice(50, 180),
          cats.slice(180, 402),
          cats.slice(402, 468),
          cats.slice(468),
        ]);
      });
  }, []);
  return {sections, getItemKey, getItemHeight, getSectionHeight, catSections};
}

interface MasonryListExampleProps {
  size: ScrollbarSizes;
  dir: 'ltr' | 'rtl';
  chunkSize: number;
}

export default memo(({size, dir, chunkSize}: MasonryListExampleProps) => {
  const MasonryList = MasonryListScrollers[size];
  const {sections, catSections, getItemKey, getItemHeight, getSectionHeight} = useCatState();
  const [isScrolling, handleScroll] = useIsScrolling();
  const renderMasonrySection: RenderMasonrySection = useCallback(
    (section: number, coords: MasonryListUnitCoords, sectionKey: string) => {
      return section === catSections.length ? (
        <div style={coords} key={sectionKey} className={styles.masonryFooter}>
          <strong>THIS IS AN EXAMPLE FOOTER</strong>
          <span>It uses a section with no items</span>
        </div>
      ) : (
        <div style={coords} key={sectionKey} className={styles.masonrySection}>
          Section {section + 1}
        </div>
      );
    },
    [catSections]
  );
  const renderMasonryItem = useCallback(
    (section: number, item: number, coords: MasonryListUnitCoords, itemKey: string) => {
      const cat = catSections[section][item];
      return cat != null ? (
        <img src={cat.src} key={itemKey} style={coords} className={styles.masonryImage} alt="" />
      ) : null;
    },
    [catSections]
  );

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
  return catSections.length > 0 ? (
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
  ) : null;
});
