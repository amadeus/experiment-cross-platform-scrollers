type StyleKeys = 'position' | 'top' | 'left' | 'width' | 'height' | 'overflow';

export interface ScrollerSpecs {
  width: number;
  height: number;
}

const OuterStyles: [StyleKeys, string][] = [
  ['position', 'absolute'],
  ['top', '-100px'],
  ['left', '-100px'],
  ['width', '100px'],
  ['height', '100px'],
  ['overflow', 'scroll'],
];

const InnerStyles: [StyleKeys, string][] = [
  ['width', '200px'],
  ['height', '200px'],
];

// NOTE(amadeus): So, the requirement for this function is a bit long winded.
// Essentially different browser and different OSes will do different things
// when it comes to scrollbars.  Some will render a scrollbar that takes up
// physical space and sometimes they wont take up any amount of space.  Also
// that space can vary in cases like Firefox where the spec to customize a
// scrollbar is only based on a keyword `thin` or `auto` which can have
// different meanings across OSes or based on OS settings.  The reason this
// becames a problem is often we want to apply uniform padding on both sides of
// an element.  If the scrollbar is taking up physical space than this padding
// can look off - especially if the content is not overflowing and no scrollbar
// is visible (it's still taking up space mind you).  In order to work around
// this, we need to measure the size of the scrollbar based on the css settings
// we are applying, so then we can manually fix padding on the side of the
// scrollbar.  This function essentially creates a hidden element and measures
// the values of the vertical and horizontal scrollbars
export default function getScrollbarSpecs(className: string = ''): ScrollerSpecs {
  const outerEl: HTMLDivElement = document.createElement('div');
  const innerEl: HTMLDivElement = document.createElement('div');
  for (const [key, value] of OuterStyles) {
    outerEl.style[key] = value;
  }
  for (const [key, value] of InnerStyles) {
    innerEl.style[key] = value;
  }
  outerEl.appendChild(innerEl);
  document.body.appendChild(outerEl);
  outerEl.className = className;
  const specs = {width: outerEl.offsetWidth - outerEl.clientWidth, height: outerEl.offsetHeight - outerEl.clientHeight};
  document.body.removeChild(outerEl);
  // NOTE(amadeus): Remove this when actually integrating
  console.log('browser detected scrollbar specs', specs);
  return specs;
}
