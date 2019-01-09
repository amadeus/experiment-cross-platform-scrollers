import React, {Component} from 'react';
import classNames from 'classnames';
import platform from 'platform';
import styles from './App.module.css';

const padScrollbar = (() => {
  const el = document.createElement('div');
  el.className = styles.container;
  el.style.overflow = 'scroll';
  el.style.width = '200px';
  el.style.height = '200px';
  el.style.position = 'absolute';
  el.style.top = '-200px';
  document.body.appendChild(el);
  const retValue = el.clientWidth === el.offsetWidth;
  console.log('retValue is', retValue);
  document.body.removeChild(el);
  if (platform.layout === 'EdgeHTML') {
    return true;
  }
  if (platform.layout !== 'Gecko') {
    return false;
  }
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
