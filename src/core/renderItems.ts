import type {RenderSection, RenderRow, RenderFooter, ListItem} from '../ScrollerConstants';

interface RenderItemProps {
  items: ListItem[];
  renderSection: RenderSection;
  renderRow: RenderRow;
  renderFooter: RenderFooter | undefined;
}

export default function renderItems({renderSection, renderRow, renderFooter, items}: RenderItemProps): React.ReactNode {
  const content: React.ReactNodeArray = [];
  let sectionItems: React.ReactNodeArray = [];
  // let lastSection = 0;
  items.forEach(({section, row, footer}) => {
    if (footer === true) {
      // sectionItems.push(renderFooter({section, index}));
      // content.push(wrapSection != null ? wrapSection(lastSection, sectionItems) : sectionItems);
      renderFooter != null && sectionItems.push(renderFooter({section}));
      content.push(sectionItems);
      sectionItems = [];
    } else {
      // lastSection = section;
      if (row == null) {
        sectionItems.push(renderSection({section}));
      } else {
        sectionItems.push(renderRow({section, row}));
      }
    }
  });
  if (sectionItems.length > 0) {
    // content.push(wrapSection ? wrapSection(lastSection, sectionItems) : sectionItems);
    content.push(sectionItems);
  }
  return content;
}
