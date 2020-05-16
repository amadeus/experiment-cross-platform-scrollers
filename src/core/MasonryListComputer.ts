export interface UnitCoords {
  position: 'absolute';
  top: number;
  left: number;
  width: number;
  height: number;
}

export type GridItem = {
  coords: UnitCoords;
  id: string;
};

export type CoordsMap = {[itemId: string]: UnitCoords | undefined};
export type Grid = GridItem[][];
export type GetItemId = (section: number, item: number) => string;
export type GetSectionHeight = (section: number) => number;
export type GetItemHeight = (section: number, item: number, columnWidth: number) => number;
export type GetFooterHeight = (columns: number, columnWidth: number, gutterSize: number) => number;

export interface MasonryComputerState {
  coordsMap: CoordsMap;
  visibleItems: VisibleItems;
  totalHeight: number;
}

export type ListComputerProps = Partial<{
  sections: number[];
  columns: number;
  gutterSize: number;
  getSectionHeight: GetSectionHeight;
  getItemId: GetItemId;
  getItemHeight: GetItemHeight;
  getFooterHeight: GetFooterHeight;
  bufferWidth: number;
}>;

const FOOTER_ID = '__footer__';
const getSectionId = (section: number) => `__section__${section}`;

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

export type VisibleItems = {
  [section: string]: string[];
};

export default class MasonryListComputer {
  visibleItems: VisibleItems = {};
  coordsMap: CoordsMap = {};
  columnHeights: number[] = [];
  columnWidth: number = 0;
  totalHeight: number = 0;
  itemGrid: Grid = [];
  private needsFullCompute: boolean = true;
  private bufferWidth = 0;
  private sections: number[] = [];
  private columns: number = 0;
  private gutterSize: number = 0;
  private getItemId: GetItemId = () => {
    throw new Error('MasonryListComputer: getItemId has not been implemented');
  };
  private getItemHeight: GetItemHeight = () => {
    throw new Error('MasonryListComputer: getItemHeight has not been implemented');
  };
  private getSectionHeight: GetSectionHeight = DEFAULT_HEIGHT;
  private getFooterHeight: GetFooterHeight = DEFAULT_HEIGHT;

  mergeProps({
    sections = this.sections,
    columns = this.columns,
    gutterSize = this.gutterSize,
    getItemId = this.getItemId,
    getItemHeight = this.getItemHeight,
    getSectionHeight = this.getSectionHeight,
    getFooterHeight = this.getFooterHeight,
    bufferWidth = this.bufferWidth,
  }: ListComputerProps) {
    if (
      this.sections === sections &&
      this.columns === columns &&
      this.gutterSize === gutterSize &&
      this.getItemId === getItemId &&
      this.getSectionHeight === getSectionHeight &&
      this.getItemHeight === getItemHeight &&
      this.getFooterHeight === getFooterHeight &&
      this.bufferWidth === bufferWidth
    ) {
      return;
    }
    this.needsFullCompute = true;
    this.sections = sections;
    this.columns = columns;
    this.gutterSize = gutterSize;
    this.getItemId = getItemId;
    this.getSectionHeight = getSectionHeight;
    this.getItemHeight = getItemHeight;
    this.getFooterHeight = getFooterHeight;
  }

  computeFullCoords() {
    if (!this.needsFullCompute) {
      return;
    }
    const {columns, getItemId, getItemHeight, gutterSize, getFooterHeight, getSectionHeight, bufferWidth} = this;
    this.coordsMap = {};
    this.columnHeights = new Array(columns).fill(0);
    this.columnWidth = (bufferWidth - gutterSize * (columns + 1)) / columns;
    this.itemGrid = [];
    let section = 0;
    while (section < this.sections.length) {
      const items = this.sections[section];
      let item = 0;
      // Sections are full width - regardless of number of columns, so we need
      // to figure out the tallest column height, and use that as a basis going
      // forward
      const sectionTop = this.getMaxColumnHeight(this.columnHeights) + gutterSize;
      const sectionHeight = getSectionHeight(section);
      for (let i = 0; i < this.columnHeights.length; i++) {
        this.columnHeights[i] = sectionTop + sectionHeight;
      }
      while (item < items) {
        const id = getItemId(section, item);
        // Items that don't have an ID don't get computed
        if (id == null) {
          item++;
          continue;
        }
        const [columnHeight, columnIndex] = getMinColumn(this.columnHeights);
        const height = getItemHeight(section, item, this.columnWidth);
        const top = columnHeight + gutterSize;
        const coords: UnitCoords = {
          position: 'absolute',
          left: this.columnWidth * columnIndex + gutterSize * (columnIndex + 1),
          width: this.columnWidth,
          top: top - sectionTop,
          height,
        };
        this.coordsMap[id] = coords;
        this.columnHeights[columnIndex] = top + height;
        if (this.itemGrid[columnIndex] == null) {
          this.itemGrid[columnIndex] = [];
        }
        this.itemGrid[columnIndex].push({coords, id});
        item++;
      }
      this.coordsMap[getSectionId(section)] = {
        position: 'absolute',
        left: gutterSize,
        width: this.columnWidth * columns + gutterSize * columns,
        top: sectionTop,
        height: this.getMaxColumnHeight(this.columnHeights) - sectionTop,
      };
      section++;
    }

    this.columnHeights = this.columnHeights.map((height) => height + gutterSize);
    const footerHeight = getFooterHeight(columns, this.columnWidth, gutterSize);
    let totalHeight = this.getMaxColumnHeight();
    if (footerHeight > 0) {
      this.coordsMap[FOOTER_ID] = {
        position: 'absolute',
        left: gutterSize,
        width: bufferWidth - gutterSize * 2,
        top: totalHeight,
        height: footerHeight,
      };
      totalHeight += footerHeight + gutterSize;
    }
    this.totalHeight = totalHeight;
    // Always reset visible items on a full compute
    this.visibleItems = {};
    this.needsFullCompute = false;
  }

  computeVisibleItems(bufferTop: number, bufferBottom: number) {
    // This will return early if the compute is not needed
    this.computeFullCoords();
    const {getItemId, coordsMap} = this;
    this.visibleItems = {};
    let section = 0;
    while (section < this.sections.length) {
      const items = this.sections[section];
      const sectionId = getSectionId(section);
      const sectionCoords = coordsMap[sectionId];
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

      while (item >= 0 && item < items) {
        const id = getItemId(section, item);
        const coords = coordsMap[id];
        // If we don't have coords for this item, we can't compute it's visibility
        if (id == null || coords == null) {
          item += increment;
          continue;
        }
        const {top, height} = coords;
        if (top + sectionTop > bufferTop - height && top + sectionTop < bufferBottom) {
          this.visibleItems[sectionId] = this.visibleItems[sectionId] || [];
          this.visibleItems[sectionId].push(id);
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

  getState(): MasonryComputerState {
    return {
      coordsMap: this.coordsMap,
      visibleItems: this.visibleItems,
      totalHeight: this.totalHeight,
      // Some ish to figure out with dat footer?
    };
  }
}
