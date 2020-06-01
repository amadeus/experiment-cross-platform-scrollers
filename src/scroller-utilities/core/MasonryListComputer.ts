export interface MasonryListUnitCoords {
  position: 'absolute' | 'sticky';
  top: number;
  left?: number;
  right?: number;
  width: number;
  height: number;
}

export type MasonryListVisibleSections = {
  [section: string]: [string, number, number][];
};

export type MasonryListCoordsMap = {[itemKey: string]: MasonryListUnitCoords | undefined};
export type MasonryListGrid = string[][];
export type MasonryListGetItemKey = (section: number, item: number) => string;
export type MasonryListGetSectionHeight = (section: number) => number;
export type MasonryListGetItemHeight = (section: number, item: number, columnWidth: number) => number;

export interface MasonryListComputerState {
  coordsMap: MasonryListCoordsMap;
  visibleSections: MasonryListVisibleSections;
  totalHeight: number;
}

export type MasonryListComputerProps = Partial<{
  dir: 'ltr' | 'rtl';
  sections: number[];
  columns: number;
  itemGutter: number;
  sectionGutter: number | null;
  padding: number | null;
  getSectionHeight: MasonryListGetSectionHeight;
  getItemKey: MasonryListGetItemKey;
  getItemHeight: MasonryListGetItemHeight;
  bufferWidth: number;
}>;

export const getMasonryListSectionKey = (section: number) => `__section__${section}`;
export const getMasonryListSectionHeaderKey = (section: number) => `__section_header__${section}`;
export const getMasonryListSectionIndex = (sectionKey: string) => parseInt(sectionKey.replace(/^__section__/, ''), 10);

function getMinColumn(columns: number[]): [number, number] {
  return columns.reduce(
    (acc, height, column) => {
      if (height < acc[0]) {
        return [height, column];
      }
      return acc;
    },
    [columns[0], 0]
  );
}

const DEFAULT_HEIGHT = () => 0;

export default class MasonryListComputer {
  visibleSections: MasonryListVisibleSections = {};
  coordsMap: MasonryListCoordsMap = {};
  columnHeights: number[] = [];
  columnWidth: number = 0;
  totalHeight: number = 0;
  itemGrid: MasonryListGrid = [];
  private needsFullCompute: boolean = true;
  private bufferWidth = 0;
  private sections: number[] = [];
  private columns: number = 0;
  private itemGutter: number = 0;
  private sectionGutter: number | null = null;
  private padding: number | null = null;
  private dir: 'ltr' | 'rtl' = 'ltr';
  private getItemKey: MasonryListGetItemKey = () => {
    throw new Error('MasonryListComputer: getItemKey has not been implemented');
  };
  private getItemHeight: MasonryListGetItemHeight = () => {
    throw new Error('MasonryListComputer: getItemHeight has not been implemented');
  };
  private getSectionHeight: MasonryListGetSectionHeight = DEFAULT_HEIGHT;

  private getPadding() {
    return this.padding != null ? this.padding : this.itemGutter;
  }

  private getSectionGutter() {
    return this.sectionGutter != null ? this.sectionGutter : this.itemGutter;
  }

  mergeProps({
    sections = this.sections,
    columns = this.columns,
    itemGutter = this.itemGutter,
    getItemKey = this.getItemKey,
    getItemHeight = this.getItemHeight,
    getSectionHeight = this.getSectionHeight,
    bufferWidth = this.bufferWidth,
    padding = this.padding,
    sectionGutter = this.sectionGutter,
    dir = this.dir,
  }: MasonryListComputerProps) {
    if (
      this.sections === sections &&
      this.columns === columns &&
      this.itemGutter === itemGutter &&
      this.getItemKey === getItemKey &&
      this.getSectionHeight === getSectionHeight &&
      this.getItemHeight === getItemHeight &&
      this.bufferWidth === bufferWidth &&
      this.padding === padding &&
      this.sectionGutter === sectionGutter &&
      this.dir === dir
    ) {
      return;
    }
    this.needsFullCompute = true;
    this.sections = sections;
    this.columns = columns;
    this.itemGutter = itemGutter;
    this.getItemKey = getItemKey;
    this.getSectionHeight = getSectionHeight;
    this.getItemHeight = getItemHeight;
    this.bufferWidth = bufferWidth;
    this.padding = padding;
    this.sectionGutter = sectionGutter;
    this.dir = dir;
  }

  computeFullCoords() {
    if (!this.needsFullCompute) {
      return;
    }
    const {columns, getItemKey, getItemHeight, itemGutter, getSectionHeight, bufferWidth} = this;
    const xCoord = this.dir === 'rtl' ? 'right' : 'left';
    this.coordsMap = {};
    this.columnHeights = new Array(columns).fill(this.getPadding());
    this.columnWidth = (bufferWidth - this.getPadding() * 2 - itemGutter * (columns - 1)) / columns;
    this.itemGrid = [];
    let section = 0;
    while (section < this.sections.length) {
      const items = this.sections[section];
      let item = 0;
      let sectionHeight = getSectionHeight(section);
      let sectionTop = this.getMaxColumnHeight(this.columnHeights);
      if (section > 0) {
        sectionTop = sectionTop - itemGutter + this.getSectionGutter();
      }
      const sectionOffset = sectionHeight > 0 ? sectionHeight + itemGutter : 0;
      for (let i = 0; i < this.columnHeights.length; i++) {
        this.columnHeights[i] = sectionTop + sectionOffset;
      }
      while (item < items) {
        const id = getItemKey(section, item);
        // Items that don't have an ID don't get computed
        if (id == null) {
          item++;
          continue;
        }
        const [top, columnIndex] = getMinColumn(this.columnHeights);
        const height = getItemHeight(section, item, this.columnWidth);
        const coords: MasonryListUnitCoords = {
          position: 'absolute',
          [xCoord]: this.columnWidth * columnIndex + itemGutter * (columnIndex + 1) - itemGutter,
          width: this.columnWidth,
          top: top - sectionTop,
          height,
        };
        this.coordsMap[id] = coords;
        this.columnHeights[columnIndex] = top + height + itemGutter;
        this.itemGrid[columnIndex] = this.itemGrid[columnIndex] || [];
        this.itemGrid[columnIndex].push(id);
        item++;
      }
      if (sectionHeight > 0) {
        this.coordsMap[getMasonryListSectionHeaderKey(section)] = {
          position: 'sticky',
          [xCoord]: 0,
          width: this.columnWidth * columns + itemGutter * columns,
          top: 0,
          height: sectionHeight,
        };
      }
      this.coordsMap[getMasonryListSectionKey(section)] = {
        position: 'absolute',
        [xCoord]: this.getPadding(),
        width: this.columnWidth * columns + itemGutter * (columns - 1),
        top: sectionTop,
        height: this.getMaxColumnHeight(this.columnHeights) - sectionTop - itemGutter,
      };
      section++;
    }

    this.columnHeights = this.columnHeights.map((height) => height - itemGutter + this.getPadding());
    this.totalHeight = this.getMaxColumnHeight();
    // Always reset visible items on a full compute
    this.visibleSections = {};
    this.needsFullCompute = false;
  }

  computeVisibleSections(bufferTop: number, bufferBottom: number) {
    // This will return early if the compute is not needed
    this.computeFullCoords();
    const {getItemKey, coordsMap} = this;
    this.visibleSections = {};
    let section = 0;
    while (section < this.sections.length) {
      const items = this.sections[section];
      const sectionKey = getMasonryListSectionKey(section);
      const sectionCoords = coordsMap[sectionKey];
      // If we don't have coords for this section, we can't compute it's visibility
      if (sectionCoords == null) {
        section++;
        continue;
      }
      const {top: sectionTop} = sectionCoords;
      const sectionBottom = sectionTop + sectionCoords.height;
      // If top is below bufferBottom then we know it's not in view and we can
      // stop iterating because we always iterate on sections from top down
      if (sectionTop > bufferBottom) {
        break;
      }
      // If bottom is above bufferTop then we can skip visibility checks on all
      // items and move onto the next section.
      if (sectionBottom < bufferTop) {
        section++;
        continue;
      }

      let item = 0;
      let increment = 1;
      // If the bottom is in view, then we should start iterating backwards
      // since we know those items will be in view
      if (sectionBottom < bufferBottom && sectionBottom > bufferTop) {
        item = items - 1;
        increment = -1;
      }

      this.visibleSections[sectionKey] = [];
      while (item >= 0 && item < items) {
        const id = getItemKey(section, item);
        const coords = coordsMap[id];
        // If we don't have coords for this item, we can't compute it's visibility
        if (id == null || coords == null) {
          item += increment;
          continue;
        }
        const {top, height} = coords;
        if (top + sectionTop > bufferTop - height && top + sectionTop < bufferBottom) {
          this.visibleSections[sectionKey].push([id, section, item]);
        }
        item += increment;
      }
      // Quick optimization - if the section extends beyond both bounds of
      // buffer region, then we can stop
      if (sectionTop < bufferTop && sectionBottom > bufferBottom) {
        break;
      }
      section++;
    }
  }

  getMaxColumnHeight(columnHeights: number[] = this.columnHeights) {
    return columnHeights.reduce((acc, height) => Math.max(acc, height), 0);
  }

  getState(): MasonryListComputerState {
    return {
      coordsMap: this.coordsMap,
      visibleSections: this.visibleSections,
      totalHeight: this.totalHeight,
    };
  }
}
