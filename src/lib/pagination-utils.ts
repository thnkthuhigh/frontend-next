
// Constants for A4 page
const PIXELS_PER_MM = 3.78; // at 96 DPI
const A4_HEIGHT_MM = 297;
const MARGIN_TOP_MM = 25;
const MARGIN_BOTTOM_MM = 25;
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM; // 247mm
const CONTENT_HEIGHT_PX = Math.floor(CONTENT_HEIGHT_MM * PIXELS_PER_MM); // ~933px

/**
 * Split HTML content into pages based on A4 height
 */
export function paginateContent(htmlContent: string): string[] {
  if (typeof window === 'undefined') return [htmlContent]; // Server-side fallback

  // Create a temporary container to measure content
  const container = document.createElement('div');
  container.style.width = '210mm'; // A4 width
  container.style.visibility = 'hidden';
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  // Add a class that might affect styling if needed, or inline styles
  // Important: we need to ensure the font and styles match the preview
  // So we assume the rendered content carries the styles or we might need to copy them
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  const pages: string[] = [];
  let currentPageContent: HTMLElement[] = [];
  let currentHeight = 0;

  // Convert HTMLCollection to Array to iterate safely
  const children = Array.from(container.children) as HTMLElement[];

  for (const child of children) {
    // Clone child for measurement
    const childClone = child.cloneNode(true) as HTMLElement;

    // Measure this specific child
    const measureDiv = document.createElement('div');
    measureDiv.style.width = '210mm'; // Ensure width constraint is applied
    measureDiv.style.visibility = 'hidden';
    measureDiv.style.position = 'absolute';
    measureDiv.appendChild(childClone);
    document.body.appendChild(measureDiv);

    const childHeight = measureDiv.offsetHeight + getVerticalMargins(childClone);
    document.body.removeChild(measureDiv);

    // Check if adding this child exceeds page height
    if (currentHeight + childHeight > CONTENT_HEIGHT_PX) {
      // Push current page if it has content
      if (currentPageContent.length > 0) {
        pages.push(elementsToHtml(currentPageContent));
        currentPageContent = [];
        currentHeight = 0;
      }

      // If a single element is taller than the page, it takes a whole page (and might overflow)
      if (childHeight > CONTENT_HEIGHT_PX) {
        pages.push(child.outerHTML);
      } else {
        currentPageContent.push(child);
        currentHeight += childHeight;
      }
    } else {
      currentPageContent.push(child);
      currentHeight += childHeight;
    }
  }

  // Push remaining content
  if (currentPageContent.length > 0) {
    pages.push(elementsToHtml(currentPageContent));
  }

  // Cleanup
  document.body.removeChild(container);

  return pages.length > 0 ? pages : [htmlContent];
}

function getVerticalMargins(element: HTMLElement): number {
  if (typeof window === 'undefined') return 0;
  const style = window.getComputedStyle(element);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  return marginTop + marginBottom;
}

function elementsToHtml(elements: HTMLElement[]): string {
  return elements.map(el => el.outerHTML).join('');
}
