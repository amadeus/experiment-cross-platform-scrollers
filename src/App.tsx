import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import createScroller from './createScroller';
import createListScroller from './createListScroller';
import generateRow from './generateRow';
import styles from './App.module.css';
import type {ScrollerListRef, RenderSectionFunction, RenderRowFunction} from './createListScroller';

enum ScrollbarSizes {
  NONE = 'NONE',
  THIN = 'THIN',
  AUTO = 'AUTO',
}

const ScrollerNone = createScroller(styles.none);
const ScrollerThin = createScroller(styles.thin);
const ScrollerAuto = createScroller(styles.auto);
const ListThin = createListScroller(styles.thinBase);

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

const renderSection: RenderSectionFunction = ({section}) => {
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
  const ref = useRef<ScrollerListRef>(null);
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

  let Scroller;
  if (size === ScrollbarSizes.NONE) {
    Scroller = ScrollerNone;
  } else if (size === ScrollbarSizes.THIN) {
    Scroller = ScrollerThin;
  } else {
    Scroller = ScrollerAuto;
  }

  const [scrolling, handleScroll] = useIsScrolling();
  const classes = [styles.container];
  if (scrolling) {
    classes.push(styles.scrolling);
  }

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
      </div>
      <Scroller className={styles.container} dir={dir}>
        {children}
      </Scroller>
      <ListThin
        ref={ref}
        onScroll={handleScroll}
        className={classes.join(' ')}
        sections={LIST_SECTIONS}
        renderSection={renderSection}
        renderRow={renderRow}
        sectionHeight={48}
        rowHeight={24}
        paddingBottom={8}
      />
    </div>
  );
}
