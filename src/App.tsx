import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import createScroller from './createScroller';
import createListScroller from './createListScroller';
import createMasonryListScroller from './createMasonryListScroller';
import generateRow from './generateRow';
import styles from './App.module.css';
import cats from './cats.js';
import type {
  ListScrollerRef,
  RenderSectionFunction,
  RenderRowFunction,
  RenderWrapperFunction,
} from './createListScroller';
import type {UnitCoords, RenderSection as RenderMasonrySection} from './createMasonryListScroller';

enum ScrollbarSizes {
  NONE = 'NONE',
  THIN = 'THIN',
  AUTO = 'AUTO',
}

const BasicScrollers = Object.freeze({
  [ScrollbarSizes.NONE]: createScroller(styles.none),
  [ScrollbarSizes.THIN]: createScroller(styles.thin),
  [ScrollbarSizes.AUTO]: createScroller(styles.auto),
});

const ListScrollers = Object.freeze({
  [ScrollbarSizes.NONE]: createListScroller(styles.noneBase),
  [ScrollbarSizes.THIN]: createListScroller(styles.thinBase),
  [ScrollbarSizes.AUTO]: createListScroller(styles.autoBase),
});

const MasonryListScrollers = Object.freeze({
  [ScrollbarSizes.NONE]: createMasonryListScroller(styles.noneBase),
  [ScrollbarSizes.THIN]: createMasonryListScroller(styles.thinBase),
  [ScrollbarSizes.AUTO]: createMasonryListScroller(styles.autoBase),
});

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

type Cat = {
  src: string;
  width: number;
  height: number;
};

const CAT_SECTIONS: Cat[][] = [
  cats.slice(0, 50),
  cats.slice(50, 180),
  cats.slice(180, 402),
  cats.slice(402, 468),
  cats.slice(468),
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

function useIsScrolling(): [boolean, () => void] {
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

export default function App() {
  const ref = useRef<ListScrollerRef>(null);
  const [size, setSize] = useState<ScrollbarSizes>(ScrollbarSizes.THIN);
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const handleScrollbarChange = useCallback(({currentTarget: {value}}) => {
    switch (value) {
      case ScrollbarSizes.AUTO:
      case ScrollbarSizes.THIN:
      case ScrollbarSizes.NONE:
        setSize(value);
    }
  }, []);
  const handleDirChange = useCallback(({currentTarget: {value}}) => {
    switch (value) {
      case 'ltr':
      case 'rtl':
        setDir(value);
    }
  }, []);

  const [children, setChildren] = useState(() => new Array(30).fill(null).map((_, index) => generateRow(index)));
  const handleClick = useCallback(() => {
    setChildren((children) => [...children, generateRow(children.length)]);
  }, []);

  // @ts-ignore
  useEffect(() => void (window.DERP = ref.current));

  const selectChildren = useMemo(
    () =>
      Object.keys(ScrollbarSizes).map((size) => (
        <option value={size} key={size}>
          {size}
        </option>
      )),
    []
  );

  const top = useRef(true);
  const toggleScroll = useCallback(() => {
    const {current} = ref;
    if (current == null) return;
    if (top.current) {
      top.current = false;
      current.scrollTo({to: Number.MAX_SAFE_INTEGER, animate: true});
    } else {
      top.current = true;
      current.scrollTo({to: 0, animate: true});
    }
  }, []);

  const Scroller = BasicScrollers[size];
  const List = ListScrollers[size];
  const MasonryList = MasonryListScrollers[size];

  const [scrolling, handleScroll] = useIsScrolling();
  const classes = [styles.container];
  if (scrolling) {
    classes.push(styles.scrolling);
  }

  const [chunkSize, setChunkSize] = useState(256);
  const handleChunkChange = useCallback(({currentTarget}) => {
    let value = parseInt(currentTarget.value);
    if (isNaN(value)) {
      value = 256;
    }
    setChunkSize(value);
  }, []);

  const [wrapSectionsBool, setWrapSections] = useState(true);
  const handleWrapChange = useCallback(({currentTarget}) => {
    setWrapSections(currentTarget.checked);
  }, []);

  const {sections, getItemKey, getItemHeight, getSectionHeight} = useCatState();

  return (
    <div dir={dir} className={styles.wrapper}>
      <div className={styles.tools}>
        <select value={size} onChange={handleScrollbarChange} className={styles.select}>
          {selectChildren}
        </select>
        <select value={dir} onChange={handleDirChange} className={styles.select}>
          <option value="ltr">LTR</option>
          <option value="rtl">RTL</option>
        </select>
        <button onClick={handleClick}>Add Item</button>
        <button onClick={toggleScroll}>Toggle Scroll</button>
        <input type="text" value={chunkSize} onChange={handleChunkChange} className={styles.input} />
        <label>
          <input type="checkbox" checked={wrapSectionsBool} onChange={handleWrapChange} />
          wrap sections
        </label>
      </div>
      <Scroller className={styles.container} dir={dir}>
        {children}
      </Scroller>
      <List
        ref={ref}
        onScroll={handleScroll}
        className={classes.join(' ')}
        sections={LIST_SECTIONS}
        renderSection={renderListSection}
        renderRow={renderRow}
        wrapSection={wrapSectionsBool ? wrapSection : undefined}
        sectionHeight={48}
        rowHeight={24}
        paddingBottom={8}
        chunkSize={chunkSize}
      />
      <MasonryList
        className={styles.container}
        columns={3}
        itemGutter={4}
        sectionGutter={12}
        padding={8}
        sections={sections}
        getItemKey={getItemKey}
        getItemHeight={getItemHeight}
        getSectionHeight={getSectionHeight}
        renderItem={renderMasonryItem}
        renderSection={renderMasonrySection}
      />
    </div>
  );
}
