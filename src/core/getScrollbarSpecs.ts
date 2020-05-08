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

export default function getScrollbarSpecs(className: string = ''): ScrollerSpecs {
  let outerEl: HTMLDivElement | null = document.createElement('div');
  let innerEl: HTMLDivElement | null = document.createElement('div');
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
  outerEl = null;
  innerEl = null;
  console.log('browser detected scrollbar specs', specs);
  return specs;
}
