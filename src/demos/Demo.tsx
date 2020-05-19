import React, {useState, useCallback, useMemo} from 'react';
import ScrollerExample from './ScrollerExample';
import ListExample from './ListExample';
import MasonryListExample from './MasonryListExample';
import {ScrollbarSizes} from './Constants';
import styles from './Demo.module.css';

enum ScrollerTypes {
  BASIC = 'BASIC',
  LIST = 'LIST',
  MASONRY = 'MASONRY',
}

type ScrollTypeState = [ScrollerTypes, (event: React.ChangeEvent<HTMLSelectElement>) => void, React.ReactNode];
function useScrollerType(): ScrollTypeState {
  const [type, setType] = useState<ScrollerTypes>(ScrollerTypes.BASIC);
  const children = useMemo(
    () =>
      Object.keys(ScrollerTypes).map((type) => (
        <option value={type} key={type}>
          {type}
        </option>
      )),
    []
  );
  const handleChange = useCallback(({currentTarget: {value}}: React.ChangeEvent<HTMLSelectElement>) => {
    switch (value) {
      case ScrollerTypes.BASIC:
      case ScrollerTypes.LIST:
      case ScrollerTypes.MASONRY:
        setType(value);
    }
  }, []);
  return [type, handleChange, children];
}

type ScrollSizeState = [ScrollbarSizes, (event: React.ChangeEvent<HTMLSelectElement>) => void, React.ReactNode];
function useScrollbarSize(): ScrollSizeState {
  const [size, setSize] = useState<ScrollbarSizes>(ScrollbarSizes.THIN);
  const children = useMemo(
    () =>
      Object.keys(ScrollbarSizes).map((size) => (
        <option value={size} key={size}>
          {size}
        </option>
      )),
    []
  );
  const handleChange = useCallback(({currentTarget: {value}}: React.ChangeEvent<HTMLSelectElement>) => {
    switch (value) {
      case ScrollbarSizes.AUTO:
      case ScrollbarSizes.THIN:
      case ScrollbarSizes.NONE:
        setSize(value);
    }
  }, []);
  return [size, handleChange, children];
}

type DirectionState = ['ltr' | 'rtl', (event: React.ChangeEvent<HTMLSelectElement>) => void, React.ReactNode];
function useDirection(): DirectionState {
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const handleChange = useCallback(({currentTarget: {value}}) => {
    switch (value) {
      case 'ltr':
      case 'rtl':
        setDir(value);
    }
  }, []);
  const children = useMemo(
    () => (
      <>
        <option value="ltr">LTR</option>
        <option value="rtl">RTL</option>
      </>
    ),
    []
  );
  return [dir, handleChange, children];
}

type ChunkState = [number, (event: React.ChangeEvent<HTMLInputElement>) => void];
function useChunkSize(): ChunkState {
  const [chunkSize, setChunkSize] = useState(256);
  const handleChange = useCallback(({currentTarget}) => {
    let value = parseInt(currentTarget.value);
    if (isNaN(value)) {
      value = 256;
    }
    setChunkSize(value);
  }, []);
  return [chunkSize, handleChange];
}

export default function App() {
  const [type, handleTypeChange, typeChildren] = useScrollerType();
  const [size, handleSizeChange, sizeChildren] = useScrollbarSize();
  const [dir, handleDirChange, dirChildren] = useDirection();
  const [chunkSize, handleChunkChange] = useChunkSize();

  let Scroller;
  let disableChunk = false;
  switch (type) {
    case ScrollerTypes.LIST:
      Scroller = ListExample;
      break;
    case ScrollerTypes.MASONRY:
      Scroller = MasonryListExample;
      break;
    case ScrollerTypes.BASIC:
    default:
      disableChunk = true;
      Scroller = ScrollerExample;
  }

  return (
    <div dir={dir} className={styles.wrapper}>
      <div className={styles.tools}>
        <div className={styles.group}>
          <label className={styles.label}>Scroller Type</label>
          <select value={type} onChange={handleTypeChange} className={styles.select}>
            {typeChildren}
          </select>
        </div>
        <div className={styles.group}>
          <label className={styles.label}>Scrollbar Size</label>
          <select value={size} onChange={handleSizeChange} className={styles.select}>
            {sizeChildren}
          </select>
        </div>
        <div className={styles.group}>
          <label className={styles.label}>Content Direction</label>
          <select value={dir} onChange={handleDirChange} className={styles.select}>
            {dirChildren}
          </select>
        </div>
        {!disableChunk ? (
          <div className={styles.group}>
            <label className={styles.label}>Chunk Size</label>
            <input type="text" value={chunkSize} onChange={handleChunkChange} className={styles.input} />
          </div>
        ) : null}
      </div>
      <Scroller size={size} chunkSize={chunkSize} dir={dir} />
    </div>
  );
}
