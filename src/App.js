// @flow strict
import React, {useState} from 'react';
import classNames from 'classnames';
import Scroller, {Themes, Orientations} from './Scroller';
import styles from './App.module.css';

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
  const [orientation, setOrientation] = useState<$Values<typeof Orientations>>(Orientations.VERTICAL);
  const [theme, setTheme] = useState<$Values<typeof Themes>>(Themes.THINN);
  const [fade, setFade] = useState<boolean>(false);
  return (
    <>
      <div className={styles.tools}>
        <Select value={orientation} setValue={setOrientation} base={Orientations} />
        <Select value={theme} setValue={setTheme} base={Themes} />
        <label>
          <input type="checkbox" value={fade} onChange={({currentTarget}) => setFade(currentTarget.checked)} /> Fade
        </label>
      </div>
      <Scroller
        fade={fade}
        theme={theme}
        orientation={orientation}
        className={classNames({
          [styles.container]: true,
          [styles.vertical]: orientation === Orientations.VERTICAL,
          [styles.horizontal]: orientation === Orientations.HORIZONTAL,
        })}>
        {new Array(25).fill(null).map((_, key) => (
          <div className={styles.item} key={key}>
            An Item
          </div>
        ))}
      </Scroller>
    </>
  );
};
