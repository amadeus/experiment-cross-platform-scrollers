export interface UnitCoords {
  position: 'absolute' | 'sticky';
  top: number;
  left: number;
  width: number;
  height: number;
}

export type GridItem = {
  coords: UnitCoords;
  id: string;
};

export type VisibleSections = {
  [section: string]: [string, number, number][];
};

export type CoordsMap = {[itemId: string]: UnitCoords | undefined};
export type Grid = string[][];
export type GetItemId = (section: number, item: number) => string;
export type GetSectionHeight = (section: number) => number;
export type GetItemHeight = (section: number, item: number, columnWidth: number) => number;

export interface MasonryComputerState {
  coordsMap: CoordsMap;
  visibleSections: VisibleSections;
  totalHeight: number;
}

export type ListComputerProps = Partial<{
  sections: number[];
  columns: number;
  itemGutter: number;
  sectionGutter: number | null;
  padding: number | null;
  getSectionHeight: GetSectionHeight;
  getItemId: GetItemId;
  getItemHeight: GetItemHeight;
  bufferWidth: number;
}>;

export const getSectionId = (section: number) => `__section__${section}`;
export const getSectionHeaderId = (section: number) => `__section_header__${section}`;
export const getSectionIndex = (sectionId: string) => parseInt(sectionId.replace(/^__section__/, ''), 10);

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
  visibleSections: VisibleSections = {};
  coordsMap: CoordsMap = {};
  columnHeights: number[] = [];
  columnWidth: number = 0;
  totalHeight: number = 0;
  itemGrid: Grid = [];
  private needsFullCompute: boolean = true;
  private bufferWidth = 0;
  private sections: number[] = [];
  private columns: number = 0;
  private itemGutter: number = 0;
  private sectionGutter: number | null = null;
  private padding: number | null = null;
  private getItemId: GetItemId = () => {
    throw new Error('MasonryListComputer: getItemId has not been implemented');
  };
  private getItemHeight: GetItemHeight = () => {
    throw new Error('MasonryListComputer: getItemHeight has not been implemented');
  };
  private getSectionHeight: GetSectionHeight = DEFAULT_HEIGHT;

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
    getItemId = this.getItemId,
    getItemHeight = this.getItemHeight,
    getSectionHeight = this.getSectionHeight,
    bufferWidth = this.bufferWidth,
    padding = this.padding,
    sectionGutter = this.sectionGutter,
  }: ListComputerProps) {
    if (
      this.sections === sections &&
      this.columns === columns &&
      this.itemGutter === itemGutter &&
      this.getItemId === getItemId &&
      this.getSectionHeight === getSectionHeight &&
      this.getItemHeight === getItemHeight &&
      this.bufferWidth === bufferWidth &&
      this.padding === padding &&
      this.sectionGutter === sectionGutter
    ) {
      return;
    }
    this.needsFullCompute = true;
    this.sections = sections;
    this.columns = columns;
    this.itemGutter = itemGutter;
    this.getItemId = getItemId;
    this.getSectionHeight = getSectionHeight;
    this.getItemHeight = getItemHeight;
    this.bufferWidth = bufferWidth;
    this.padding = padding;
    this.sectionGutter = sectionGutter;
  }

  computeFullCoords() {
    if (!this.needsFullCompute) {
      return;
    }
    const {columns, getItemId, getItemHeight, itemGutter, getSectionHeight, bufferWidth} = this;
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
        const id = getItemId(section, item);
        // Items that don't have an ID don't get computed
        if (id == null) {
          item++;
          continue;
        }
        const [top, columnIndex] = getMinColumn(this.columnHeights);
        const height = getItemHeight(section, item, this.columnWidth);
        const coords: UnitCoords = {
          position: 'absolute',
          left: this.columnWidth * columnIndex + itemGutter * (columnIndex + 1) - itemGutter,
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
        this.coordsMap[getSectionHeaderId(section)] = {
          position: 'sticky',
          left: 0,
          width: this.columnWidth * columns + itemGutter * columns,
          top: 0,
          height: sectionHeight,
        };
      }
      this.coordsMap[getSectionId(section)] = {
        position: 'absolute',
        left: this.getPadding(),
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
    const {getItemId, coordsMap} = this;
    this.visibleSections = {};
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

      this.visibleSections[sectionId] = [];
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
          this.visibleSections[sectionId].push([id, section, item]);
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
      visibleSections: this.visibleSections,
      totalHeight: this.totalHeight,
    };
  }
}
