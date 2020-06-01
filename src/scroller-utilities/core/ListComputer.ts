export type ListSectionHeight = number | ((section: number) => number);
export type ListRowHeight = number | ((section: number, row: number) => number);
export type ListFooterHeight = number | ((section: number) => number);

export type ListItemSection = {
  type: 'section';
  section: number;
  listIndex: number;
};

export type ListItemRow = {
  type: 'row';
  section: number;
  row: number;
  rowIndex: number;
  listIndex: number;
};

export type ListItemFooter = {
  type: 'footer';
  section: number;
};

export type ListItem = ListItemSection | ListItemRow | ListItemFooter;

export interface ListState {
  spacerTop: number;
  totalHeight: number;
  items: ListItem[];
}

export interface ListComputerProps {
  sectionHeight: ListSectionHeight;
  rowHeight: ListRowHeight;
  footerHeight?: ListFooterHeight;
  paddingTop: number;
  paddingBottom: number;
  sections: number[];
}

class ListComputer {
  sectionHeight: ListSectionHeight = 0;
  rowHeight: ListRowHeight = 0;
  footerHeight: ListFooterHeight | undefined = 0;
  uniform: boolean = true;
  paddingBottom: number = 0;
  paddingTop: number = 0;
  sections: number[] = [];

  mergeProps({sectionHeight, rowHeight, footerHeight, paddingTop, paddingBottom, sections}: ListComputerProps) {
    this.sections = sections;
    this.sectionHeight = sectionHeight;
    this.rowHeight = rowHeight;
    this.footerHeight = footerHeight;
    this.uniform = typeof rowHeight === 'number';
    this.paddingTop = paddingTop;
    this.paddingBottom = paddingBottom;
  }

  getHeight(): number {
    let height = this.paddingTop;
    const {length} = this.sections;
    for (let section = 0; section < length; section++) {
      height += this.getHeightForSection(section);
      if (this.uniform) {
        height += this.sections[section] * this.getHeightForRow(section, 0);
      } else {
        for (let row = 0; row < this.sections[section]; row++) {
          height += this.getHeightForRow(section, row);
        }
      }
      height += this.getHeightForFooter(section);
    }
    return height + this.paddingBottom;
  }

  getHeightForSection(section: number): number {
    const {sectionHeight} = this;
    return typeof sectionHeight === 'number' ? sectionHeight : sectionHeight(section);
  }

  getHeightForRow(section: number, row: number): number {
    const {rowHeight} = this;
    return typeof rowHeight === 'number' ? rowHeight : rowHeight(section, row);
  }

  getHeightForFooter(section: number) {
    const {footerHeight} = this;
    if (footerHeight == null) {
      return 0;
    }
    return typeof footerHeight === 'number' ? footerHeight : footerHeight(section);
  }

  compute(top: number, bottom: number): ListState {
    let height = this.paddingTop;
    let spacerTop = this.paddingTop;
    let rowIndex = 0;
    let listIndex = 0;
    const items: ListItem[] = [];
    const isVisible = (itemHeight: number) => {
      const prevHeight = height;
      height += itemHeight;
      if (height < top) {
        spacerTop += itemHeight;
        return false;
      } else if (prevHeight > bottom) {
        return false;
      } else {
        return true;
      }
    };

    for (let section = 0; section < this.sections.length; section++) {
      const rows = this.sections[section];

      if (rows === 0) {
        continue;
      }

      if (isVisible(this.getHeightForSection(section))) {
        items.push({type: 'section', section, listIndex});
      }
      listIndex += 1;

      if (this.uniform) {
        const rowHeight = this.getHeightForRow(section, 0);
        for (let row = 0; row < rows; row++) {
          if (isVisible(rowHeight)) {
            items.push({type: 'row', section, listIndex, row, rowIndex});
          }
          rowIndex += 1;
          listIndex += 1;
        }
      } else {
        for (let row = 0; row < rows; row++) {
          if (isVisible(this.getHeightForRow(section, row))) {
            items.push({type: 'row', section, listIndex, row, rowIndex});
          }
          rowIndex += 1;
          listIndex += 1;
        }
      }

      if (isVisible(this.getHeightForFooter(section))) {
        items.push({type: 'footer', section});
      }
    }

    return {
      spacerTop,
      totalHeight: height + this.paddingBottom,
      items,
    };
  }

  computeScrollPosition(targetSection: number, targetRow?: number | undefined): [number, number] {
    const {paddingTop} = this;
    let scrollTop = paddingTop;
    let section = 0;
    let foundTarget = false;
    while (section <= targetSection) {
      const rows = this.sections[section];
      if (section === targetSection && targetRow == null) {
        foundTarget = true;
        break;
      }
      scrollTop += this.getHeightForSection(section);
      if (rows === 0) {
        section += 1;
        continue;
      }
      if (this.uniform) {
        const uniformHeight = this.getHeightForRow(section, 0);
        if (section === targetSection && targetRow != null) {
          scrollTop += uniformHeight * targetRow;
          foundTarget = true;
        } else {
          scrollTop += uniformHeight * rows;
        }
      } else {
        for (let row = 0; row < rows; row++) {
          if (section < targetSection || (section === targetSection && targetRow != null && row < targetRow)) {
            scrollTop += this.getHeightForRow(section, row);
          } else if (section === targetSection && targetRow != null && row === targetRow) {
            foundTarget = true;
            break;
          }
        }
      }
      if (!foundTarget) {
        scrollTop += this.getHeightForFooter(section);
      }
      section += 1;
    }

    return [
      scrollTop,
      targetRow != null ? this.getHeightForRow(targetSection, targetRow) : this.getHeightForSection(section),
    ];
  }
}

export default ListComputer;