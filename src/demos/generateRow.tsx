import React from 'react';
import styles from './Demo.module.css';

export default function generateRow(key: number | string): React.ReactNode {
  return (
    <div className={styles.item} key={key}>
      An Item
    </div>
  );
}
