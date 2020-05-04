import type {SectionHeight, RowHeight, FooterHeight, ListState} from '../ScrollerConstants';

interface ListComputerProps {
  sectionHeight: SectionHeight;
  rowHeight: RowHeight;
  footerHeight?: FooterHeight;
  paddingTop: number;
  paddingBottom: number;
  sections: number[];
}

class ListComputer {
  sectionHeight: SectionHeight = 0;
  rowHeight: RowHeight = 0;
  footerHeight: FooterHeight | undefined = 0;
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
    const items = [];

    function isVisible(itemHeight: number) {
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
    }

    // NOTE(amadeus): Are we sure we need this?  Attempt to implement without
    // this stuff and see if it is needed later
    // let rowIndex = 0;
    // let index = 0;
    for (let section = 0; section < this.sections.length; section++) {
      const rows = this.sections[section];

      if (rows === 0) {
        continue;
      }

      if (isVisible(this.getHeightForSection(section))) {
        // items.push({section, index});
        items.push({section});
      }
      // index += 1;

      if (this.uniform) {
        const rowHeight = this.getHeightForRow(section, 0);
        for (let row = 0; row < rows; row++) {
          if (isVisible(rowHeight)) {
            // items.push({section, index, row, rowIndex});
            items.push({section, row});
          }
          // rowIndex += 1;
          // index += 1;
        }
      } else {
        for (let row = 0; row < rows; row++) {
          if (isVisible(this.getHeightForRow(section, row))) {
            // items.push({section, index, row, rowIndex});
            items.push({section, row});
          }
          // rowIndex += 1;
          // index += 1;
        }
      }

      if (isVisible(this.getHeightForFooter(section))) {
        // items.push({section, index, footer: true});
        items.push({section, footer: true});
      }
    }

    return {
      spacerTop,
      totalHeight: height + this.paddingBottom,
      items,
    };
  }

  computeScrollPosition(targetSection: number, targetRow?: number | undefined) {
    const {paddingTop} = this;
    let scrollTop = paddingTop;
    let section = 0;
    let foundTarget = false;
    while (section <= targetSection) {
      const rows = this.sections[section];
      if (section === targetSection && targetRow == null) {
        foundTarget = true;
        continue;
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
