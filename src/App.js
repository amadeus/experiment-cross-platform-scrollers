import React, {Component} from 'react';
import classNames from 'classnames';
import styles from './App.module.css';

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
const padScrollbar = (() => {
  let el = document.createElement('div');
  el.className = styles.testStyles;
  document.body.appendChild(el);
  const difference = el.offsetWidth - el.clientWidth;
  const retValue = !(difference > 0 && difference <= 11);
  document.body.removeChild(el);
  el = null;
  return retValue;
})();

class App extends Component {
  render() {
    return (
      <div className={classNames(styles.container, {[styles.padScrollbar]: padScrollbar})}>
        <div className={styles.padding}>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
          <div className={styles.item}>An Item</div>
        </div>
      </div>
    );
  }
}

export default App;
