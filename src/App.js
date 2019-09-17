// @flow strict
import React, {useState, useEffect, type Node} from 'react';
import Scroller, {Themes} from './Scroller';
import styles from './App.module.css';

const AppThemes = Object.freeze({
  DARK: 'dark',
  LIGHT: 'light',
});

type ThemeFakerProps = {|
  theme: $Values<typeof AppThemes>,
|};

function ThemeFaker({theme}: ThemeFakerProps) {
  useEffect(
    () => {
      const {documentElement} = document;
      if (documentElement == null) {
        return;
      }
      documentElement.className = `theme-${theme}`;
    },
    [theme]
  );
  return null;
}

type SelectProps<Value> = {|
  value: Value,
  setValue: Value => mixed,
  base: {[key: string]: Value, ...},
|};

function Select<Value>({value, setValue, base}: SelectProps<Value>) {
  return (
    <select value={value} onChange={({currentTarget}) => setValue(currentTarget.value)} className={styles.select}>
      {Object.keys(base).map(key => (
        <option value={base[key]} key={key}>
          {key}
        </option>
      ))}
    </select>
  );
}

type FakeDataProps = {|
  count: number,
  className: string,
  text?: ?string,
|};

function FakeData({count, className, text}: FakeDataProps) {
  return new Array(count).fill(null).map((_, key) => (
    <div className={className} key={key}>
      {text}
    </div>
  ));
}

type FloaterProps = {|
  children: Node,
|};

function Floater({children}: FloaterProps) {
  return (
    <Scroller className={styles.floater} theme={Themes.THINN}>
      {children}
      <FakeData count={20} className={styles.floatingItem} />
    </Scroller>
  );
}

export default () => {
  const [appTheme, setAppTheme] = useState<$Values<typeof AppThemes>>(AppThemes.DARK);
  return (
    <div className={styles.app}>
      <Scroller className={styles.guildList} theme={Themes.NONEE}>
        <FakeData count={25} className={styles.box} />
      </Scroller>
      <Scroller className={styles.channelList} theme={Themes.THINN} fade>
        <FakeData count={100} className={styles.rowItem} text="Channel" />
      </Scroller>
      <Scroller className={styles.messages} theme={Themes.THICC}>
        <FakeData count={25} className={styles.rowItemBig} />
      </Scroller>
      <Scroller className={styles.memberList} theme={Themes.THINN} fade>
        <FakeData count={100} className={styles.rowItem} text="Member" />
      </Scroller>
      <Floater>
        <Select value={appTheme} setValue={setAppTheme} base={AppThemes} />
      </Floater>
      <ThemeFaker theme={appTheme} />
    </div>
  );
};
