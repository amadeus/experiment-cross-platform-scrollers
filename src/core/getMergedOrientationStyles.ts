import type React from 'react';
import type {OrientationTypes} from './SharedTypes';

export const STYLES_VERTICAL = Object.freeze({
  overflowY: 'scroll',
  overflowX: 'hidden',
} as const);

export const STYLES_HORIZONTAL = Object.freeze({
  overflowX: 'scroll',
  overflowY: 'hidden',
} as const);

export const STYLES_AUTO = Object.freeze({
  overflow: 'auto',
} as const);

export default function getMergedOrientationStyles(
  orientation: OrientationTypes = 'vertical',
  style: React.CSSProperties | undefined
): React.CSSProperties {
  const orientationStyle =
    orientation === 'vertical' ? STYLES_VERTICAL : orientation === 'horizontal' ? STYLES_HORIZONTAL : STYLES_AUTO;
  return style != null ? {...orientationStyle, ...style} : orientationStyle;
}
