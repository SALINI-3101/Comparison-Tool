export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  message: string;
}

export interface ComparisonResult {
  areEqual: boolean;
  differences: Difference[];
  message: string;
  statistics?: {
    added: number;
    removed: number;
    modified: number;
  };
}

export interface Difference {
  path: string;
  leftValue: unknown;
  rightValue: unknown;
  type: 'added' | 'removed' | 'modified';
}

export interface ComparisonOptions {
  ignoreWhitespace?: boolean;
  caseSensitive?: boolean;
  ignoreKeyOrder?: boolean;
  ignoreArrayOrder?: boolean;
  ignoreAttributeOrder?: boolean;
}

/**
 * Validates JSON content
 */
export function validateJSON(content: string): ValidationResult {
  if (!content || content.trim() === '') {
    return {
      isValid: false,
      errors: ['Content is empty'],
      message: 'Please provide JSON content to validate',
    };
  }

  try {
    const parsed = JSON.parse(content);
    const lines = content.split('\n').length;
    const sizeInKB = (new Blob([content]).size / 1024).toFixed(2);
    const type = Array.isArray(parsed) ? 'Array' : typeof parsed === 'object' ? 'Object' : typeof parsed;

    return {
      isValid: true,
      errors: [],
      message: `Valid JSON (${type} with ${lines} lines, ${sizeInKB} KB)`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      isValid: false,
      errors: [errorMessage],
      message: 'Invalid JSON',
    };
  }
}

/**
 * Validates XML content
 */
export function validateXML(content: string): ValidationResult {
  if (!content || content.trim() === '') {
    return {
      isValid: false,
      errors: ['Content is empty'],
      message: 'Please provide XML content to validate',
    };
  }

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    const parserError = xmlDoc.querySelector('parsererror');

    if (parserError) {
      return {
        isValid: false,
        errors: [parserError.textContent || 'XML parsing error'],
        message: 'Invalid XML',
      };
    }

    const lines = content.split('\n').length;
    const sizeInKB = (new Blob([content]).size / 1024).toFixed(2);
    const rootElement = xmlDoc.documentElement.nodeName;
    const elementCount = xmlDoc.getElementsByTagName('*').length;

    return {
      isValid: true,
      errors: [],
      message: `Valid XML (${rootElement} with ${elementCount} elements, ${lines} lines, ${sizeInKB} KB)`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      isValid: false,
      errors: [errorMessage],
      message: `Invalid XML: ${errorMessage}`,
    };
  }
}

/**
 * Compares two JSON strings
 */
export function compareJSON(
  leftContent: string,
  rightContent: string,
  options: ComparisonOptions = {}
): ComparisonResult {
  if (!leftContent || !rightContent) {
    return {
      areEqual: false,
      differences: [],
      message: 'Both left and right content must be provided',
    };
  }

  try {
    // Parse to validate JSON
    let leftObj = JSON.parse(leftContent);
    let rightObj = JSON.parse(rightContent);

    let leftFormatted: string;
    let rightFormatted: string;

    // Apply ignore key order option (sort object keys)
    if (options.ignoreKeyOrder) {
      leftObj = sortObjectKeys(leftObj);
      rightObj = sortObjectKeys(rightObj);
    }

    // Apply ignore array order option (sort arrays)
    if (options.ignoreArrayOrder) {
      leftObj = sortArrays(leftObj);
      rightObj = sortArrays(rightObj);
    }

    // When Ignore Whitespace is enabled, normalize formatting
    // When disabled, preserve original formatting to detect whitespace differences
    if (options.ignoreWhitespace) {
      // Normalize formatting for both sides
      leftFormatted = JSON.stringify(leftObj, null, 2);
      rightFormatted = JSON.stringify(rightObj, null, 2);
    } else {
      // When ignoreWhitespace is OFF, use original content to preserve formatting
      // But still need to apply key/array order transformations if enabled
      if (options.ignoreKeyOrder || options.ignoreArrayOrder) {
        leftFormatted = JSON.stringify(leftObj, null, 2);
        rightFormatted = JSON.stringify(rightObj, null, 2);
      } else {
        // Preserve original formatting completely
        leftFormatted = leftContent;
        rightFormatted = rightContent;
      }
    }

    // Split into lines for line-by-line comparison
    const leftLines = leftFormatted.split('\n');
    const rightLines = rightFormatted.split('\n');

    // Perform line-by-line comparison similar to XML
    const { differences, diffCount, statistics } = compareJSONLines(leftLines, rightLines, options);

    return {
      areEqual: diffCount === 0,
      differences,
      message: diffCount === 0 ? '' : `Found ${diffCount} line(s) with differences`,
      statistics,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      areEqual: false,
      differences: [],
      message: `Error comparing JSON: ${errorMessage}`,
    };
  }
}

/**
 * Helper function to compare JSON line by line with highlighting
 * Similar to compareXMLLines but for JSON
 */
function compareJSONLines(
  leftLines: string[],
  rightLines: string[],
  options: ComparisonOptions
): { differences: Difference[]; diffCount: number; statistics: { added: number; removed: number; modified: number } } {
  const maxLines = Math.max(leftLines.length, rightLines.length);

  // First pass: identify which lines are different
  const diffLineNumbers: number[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;

  for (let i = 0; i < maxLines; i++) {
    const leftLine = leftLines[i] !== undefined ? leftLines[i] : '';
    const rightLine = rightLines[i] !== undefined ? rightLines[i] : '';

    // Apply options for comparison
    let leftCompare = leftLine;
    let rightCompare = rightLine;

    if (options.ignoreWhitespace) {
      // Remove ALL whitespace characters for comparison
      leftCompare = leftCompare.replace(/\s/g, '');
      rightCompare = rightCompare.replace(/\s/g, '');
    }

    if (!options.caseSensitive) {
      leftCompare = leftCompare.toLowerCase();
      rightCompare = rightCompare.toLowerCase();
    }

    if (leftCompare !== rightCompare) {
      diffLineNumbers.push(i);

      // Categorize the difference
      if (!leftLine && rightLine) {
        addedCount++;
      } else if (leftLine && !rightLine) {
        removedCount++;
      } else {
        modifiedCount++;
      }
    }
  }

  const diffCount = diffLineNumbers.length;
  const statistics = { added: addedCount, removed: removedCount, modified: modifiedCount };

  if (diffCount === 0) {
    return { differences: [], diffCount: 0, statistics: { added: 0, removed: 0, modified: 0 } };
  }

  // Show ALL lines, not just differences with context
  const finalLinesToDisplay = Array.from({ length: maxLines }, (_, i) => i);

  // Build content with ALL lines
  let leftFullContent = '';
  let rightFullContent = '';

  finalLinesToDisplay.forEach((i) => {
    const leftLine = leftLines[i] !== undefined ? leftLines[i] : '';
    const rightLine = rightLines[i] !== undefined ? rightLines[i] : '';
    const leftOriginal = leftLine;
    const rightOriginal = rightLine;

    // Apply options for comparison
    let leftCompare = leftLine;
    let rightCompare = rightLine;

    if (options.ignoreWhitespace) {
      // Remove ALL whitespace characters for comparison
      leftCompare = leftCompare.replace(/\s/g, '');
      rightCompare = rightCompare.replace(/\s/g, '');
    }

    if (!options.caseSensitive) {
      leftCompare = leftCompare.toLowerCase();
      rightCompare = rightCompare.toLowerCase();
    }

    const lineNum = i + 1;

    // Check if lines are different
    if (leftCompare !== rightCompare) {
      // Highlight the differences within the line
      const highlightedLeft = highlightJSONDifference(leftOriginal, rightOriginal, options);
      const highlightedRight = highlightJSONDifference(rightOriginal, leftOriginal, options);

      leftFullContent += `<div class="line-diff"><span class="line-number">${lineNum}</span>${highlightedLeft}</div>\n`;
      rightFullContent += `<div class="line-diff"><span class="line-number">${lineNum}</span>${highlightedRight}</div>\n`;
    } else {
      // Show unchanged lines with HTML-escaped content
      const escapedLeft = escapeHtml(leftOriginal);
      const escapedRight = escapeHtml(rightOriginal);
      leftFullContent += `<div class="line-same"><span class="line-number">${lineNum}</span>${escapedLeft}</div>\n`;
      rightFullContent += `<div class="line-same"><span class="line-number">${lineNum}</span>${escapedRight}</div>\n`;
    }
  });

  // Return a single difference containing the content
  return {
    differences: [{
      path: 'Full Document',
      leftValue: leftFullContent,
      rightValue: rightFullContent,
      type: 'modified',
    }],
    diffCount,
    statistics,
  };
}

/**
 * Helper function to highlight differences within JSON lines
 */
function highlightJSONDifference(line: string, compareLine: string, options: ComparisonOptions): string {
  if (!line && !compareLine) return '';
  if (!line) return escapeHtml('(empty line)');
  if (!compareLine) return escapeHtml(line);

  // For very long lines, skip detailed highlighting
  if (line.length > 500) {
    return escapeHtml(line);
  }

  // Find differences character by character for JSON
  let result = '';
  let inDiff = false;
  let diffStart = -1;

  for (let i = 0; i < line.length; i++) {
    const lineChar = line[i];
    const compareChar = i < compareLine.length ? compareLine[i] : '';

    // Apply case sensitivity option
    const lineCharCompare = options.caseSensitive ? lineChar : lineChar.toLowerCase();
    const compareCharCompare = options.caseSensitive ? compareChar : compareChar.toLowerCase();

    if (i < compareLine.length && lineCharCompare === compareCharCompare) {
      // Characters match
      if (inDiff) {
        // End of difference region
        result += '<mark>' + escapeHtml(line.substring(diffStart, i)) + '</mark>';
        inDiff = false;
      }
      result += escapeHtml(line[i]);
    } else {
      // Characters differ
      if (!inDiff) {
        diffStart = i;
        inDiff = true;
      }
    }
  }

  // Close any remaining diff region
  if (inDiff) {
    result += '<mark>' + escapeHtml(line.substring(diffStart)) + '</mark>';
  }

  return result;
}

/**
 * Helper function to recursively sort attributes in all elements
 */
function sortXMLAttributes(element: Element): void {
  if (element.attributes.length > 0) {
    // Get all attributes
    const attrs: Array<{ name: string; value: string }> = [];
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attrs.push({ name: attr.name, value: attr.value });
    }

    // Sort attributes by name
    attrs.sort((a, b) => a.name.localeCompare(b.name));

    // Remove all attributes
    while (element.attributes.length > 0) {
      element.removeAttribute(element.attributes[0].name);
    }

    // Add attributes back in sorted order
    attrs.forEach(attr => {
      element.setAttribute(attr.name, attr.value);
    });
  }

  // Recursively process child elements
  for (let i = 0; i < element.children.length; i++) {
    sortXMLAttributes(element.children[i]);
  }
}

/**
 * Helper function to normalize XML by sorting attributes
 */
function normalizeXMLAttributes(xmlString: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parsing errors
    const error = doc.querySelector('parsererror');
    if (error) {
      return xmlString; // Return original if parsing fails
    }

    if (doc.documentElement) {
      sortXMLAttributes(doc.documentElement);
    }

    // Serialize back to string
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } catch {
    return xmlString; // Return original if any error occurs
  }
}

/**
 * Compares two XML strings
 */
export function compareXML(
  leftContent: string,
  rightContent: string,
  options: ComparisonOptions = {}
): ComparisonResult {
  if (!leftContent || !rightContent) {
    return {
      areEqual: false,
      differences: [],
      message: 'Both left and right content must be provided',
    };
  }

  try {
    // Validate XML syntax first
    const parser = new DOMParser();
    const leftDoc = parser.parseFromString(leftContent, 'text/xml');
    const rightDoc = parser.parseFromString(rightContent, 'text/xml');

    // Check for parsing errors
    const leftError = leftDoc.querySelector('parsererror');
    const rightError = rightDoc.querySelector('parsererror');

    if (leftError || rightError) {
      return {
        areEqual: false,
        differences: [],
        message: 'One or both XML documents contain parsing errors',
      };
    }

    // When ignoreAttributeOrder is ON, normalize (sort) attributes
    // When OFF, use original content for true attribute order comparison
    let leftProcessed = leftContent;
    let rightProcessed = rightContent;

    if (options.ignoreAttributeOrder) {
      leftProcessed = normalizeXMLAttributes(leftContent);
      rightProcessed = normalizeXMLAttributes(rightContent);
    }

    // Split into lines for line-by-line comparison with context
    const leftLines = leftProcessed.split('\n');
    const rightLines = rightProcessed.split('\n');

    // Do line-by-line comparison
    const { differences, diffCount, statistics } = compareXMLLines(leftLines, rightLines, options);

    if (diffCount > 0) {
      return {
        areEqual: false,
        differences,
        message: `Found ${diffCount} line(s) with differences`,
        statistics,
      };
    }

    return {
      areEqual: true,
      differences: [],
      message: '',
      statistics: { added: 0, removed: 0, modified: 0 },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      areEqual: false,
      differences: [],
      message: `Error comparing XML: ${errorMessage}`,
    };
  }
}

/**
 * Helper function to escape HTML special characters while preserving Unicode (emojis, special chars)
 */
function escapeHtml(text: string): string {
  // Manually replace only HTML special characters, preserve Unicode including emojis
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  // Note: We don't encode Unicode characters (including emojis) - they're preserved as-is
}

/**
 * Helper function to compare XML line by line with highlighting
 * Returns all lines with differences highlighted
 * Optimized for large files by showing only context around differences
 */
function compareXMLLines(
  leftLines: string[],
  rightLines: string[],
  options: ComparisonOptions
): { differences: Difference[]; diffCount: number; statistics: { added: number; removed: number; modified: number } } {
  const maxLines = Math.max(leftLines.length, rightLines.length);

  // Adjust context based on file size
  const LARGE_FILE_THRESHOLD = 1000; // Consider files with >1000 lines as large
  const isLargeFile = maxLines > LARGE_FILE_THRESHOLD;

  const CONTEXT_LINES = isLargeFile ? 2 : 3; // Show 2 lines for large files, 3 for small

  // First pass: identify which lines are different
  const diffLineNumbers: number[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;

  for (let i = 0; i < maxLines; i++) {
    const leftLine = leftLines[i] !== undefined ? leftLines[i] : '';
    const rightLine = rightLines[i] !== undefined ? rightLines[i] : '';

    // Apply options for comparison
    let leftCompare = leftLine;
    let rightCompare = rightLine;

    if (options.ignoreWhitespace) {
      // Remove ALL whitespace characters for comparison
      leftCompare = leftCompare.replace(/\s/g, '');
      rightCompare = rightCompare.replace(/\s/g, '');
    }

    if (!options.caseSensitive) {
      leftCompare = leftCompare.toLowerCase();
      rightCompare = rightCompare.toLowerCase();
    }

    if (leftCompare !== rightCompare) {
      diffLineNumbers.push(i);

      // Categorize the difference
      if (!leftLine && rightLine) {
        addedCount++;
      } else if (leftLine && !rightLine) {
        removedCount++;
      } else {
        modifiedCount++;
      }
    }
  }

  const diffCount = diffLineNumbers.length;
  const statistics = { added: addedCount, removed: removedCount, modified: modifiedCount };

  if (diffCount === 0) {
    return { differences: [], diffCount: 0, statistics: { added: 0, removed: 0, modified: 0 } };
  }

  // Build set of line numbers to display (differences + context)
  const linesToDisplay = new Set<number>();

  // For very large diff counts, limit the display to prevent browser freeze
  const MAX_DIFFS_TO_DISPLAY = 1000;
  const diffsToProcess = diffCount > MAX_DIFFS_TO_DISPLAY
    ? diffLineNumbers.slice(0, MAX_DIFFS_TO_DISPLAY)
    : diffLineNumbers;

  diffsToProcess.forEach(lineNum => {
    for (let j = Math.max(0, lineNum - CONTEXT_LINES); j <= Math.min(maxLines - 1, lineNum + CONTEXT_LINES); j++) {
      linesToDisplay.add(j);
    }
  });

  const finalLinesToDisplay = Array.from(linesToDisplay).sort((a, b) => a - b);

  // Build content with only selected lines
  let leftFullContent = '';
  let rightFullContent = '';
  let lastDisplayedLine = -1;

  // Add warning message if showing limited results
  if (diffCount > MAX_DIFFS_TO_DISPLAY) {
    const infoMsg = `<div class="line-same" style="text-align: center; padding: 16px; background: #fee2e2; color: #991b1b; font-weight: 600; border-radius: 6px; margin-bottom: 12px; border: 2px solid #f87171;">⚠️ Large number of differences detected (${diffCount} lines). Showing first ${MAX_DIFFS_TO_DISPLAY} differences to prevent browser freeze. Consider using "Ignore Whitespace" toggle or comparing smaller sections.</div>\n`;
    leftFullContent += infoMsg;
    rightFullContent += infoMsg;
  }

  finalLinesToDisplay.forEach((i) => {
    // Add ellipsis if there's a gap
    if (lastDisplayedLine >= 0 && i > lastDisplayedLine + 1) {
      leftFullContent += `<div class="line-same" style="text-align: center; font-style: italic; color: #888;">...</div>\n`;
      rightFullContent += `<div class="line-same" style="text-align: center; font-style: italic; color: #888;">...</div>\n`;
    }

    const leftLine = leftLines[i] !== undefined ? leftLines[i] : '';
    const rightLine = rightLines[i] !== undefined ? rightLines[i] : '';
    const leftOriginal = leftLine;
    const rightOriginal = rightLine;

    // Apply options for comparison
    let leftCompare = leftLine;
    let rightCompare = rightLine;

    if (options.ignoreWhitespace) {
      // Remove ALL whitespace characters for comparison
      leftCompare = leftCompare.replace(/\s/g, '');
      rightCompare = rightCompare.replace(/\s/g, '');
    }

    if (!options.caseSensitive) {
      leftCompare = leftCompare.toLowerCase();
      rightCompare = rightCompare.toLowerCase();
    }

    const lineNum = i + 1;

    // Check if lines are different
    if (leftCompare !== rightCompare) {
      // Highlight the differences within the line
      const highlightedLeft = highlightXMLDifference(leftOriginal, rightOriginal, options);
      const highlightedRight = highlightXMLDifference(rightOriginal, leftOriginal, options);

      leftFullContent += `<div class="line-diff"><span class="line-number">${lineNum}</span>${highlightedLeft}</div>\n`;
      rightFullContent += `<div class="line-diff"><span class="line-number">${lineNum}</span>${highlightedRight}</div>\n`;
    } else {
      // Show unchanged lines with HTML-escaped content
      const escapedLeft = escapeHtml(leftOriginal);
      const escapedRight = escapeHtml(rightOriginal);
      leftFullContent += `<div class="line-same"><span class="line-number">${lineNum}</span>${escapedLeft}</div>\n`;
      rightFullContent += `<div class="line-same"><span class="line-number">${lineNum}</span>${escapedRight}</div>\n`;
    }

    lastDisplayedLine = i;
  });

  // Return a single difference containing the content
  return {
    differences: [{
      path: 'Full Document',
      leftValue: leftFullContent,
      rightValue: rightFullContent,
      type: 'modified',
    }],
    diffCount,
    statistics,
  };
}

/**
 * Helper function to highlight differences within XML lines
 * Optimized for performance with large lines
 */
function highlightXMLDifference(line: string, compareLine: string, options: ComparisonOptions): string {
  if (!line && !compareLine) return '';
  if (!line) return escapeHtml('(empty line)');
  if (!compareLine) return escapeHtml(line);

  // For very long lines (>500 chars), skip detailed highlighting to prevent freezing
  if (line.length > 500) {
    return escapeHtml(line);
  }

  // For XML, we want to show the full line with the changed part highlighted
  // Extract the content between tags
  const tagContentRegex = />([^<]+)</g;
  const attrRegex = /(\w+)=["']([^"']+)["']/g;

  // First, find all differences and their positions
  const differences: { start: number; end: number; replacement: string }[] = [];

  try {
    // Find text content differences
    const lineMatches = Array.from(line.matchAll(tagContentRegex));
    const compareMatches = Array.from(compareLine.matchAll(tagContentRegex));

    lineMatches.forEach((match, idx) => {
      if (compareMatches[idx]) {
        const lineContent = match[1];
        const compareContent = compareMatches[idx][1];

        // Apply comparison options
        const lineCompare = options.caseSensitive ? lineContent : lineContent.toLowerCase();
        const compareCompare = options.caseSensitive ? compareContent : compareContent.toLowerCase();

        if (lineCompare !== compareCompare) {
          // Mark this content as different
          const contentStart = match.index! + 1; // After the '>'
          const contentEnd = contentStart + match[1].length;
          differences.push({
            start: contentStart,
            end: contentEnd,
            replacement: `__MARK_START__${match[1]}__MARK_END__`,
          });
        }
      }
    });

    // Find attribute differences
    const lineAttrs = Array.from(line.matchAll(attrRegex));
    const compareAttrs = Array.from(compareLine.matchAll(attrRegex));

    lineAttrs.forEach((match) => {
      const attrName = match[1];
      const attrValue = match[2];
      const compareAttr = compareAttrs.find(m => m[1] === attrName);

      if (compareAttr) {
        // Apply comparison options
        const valueCompare = options.caseSensitive ? attrValue : attrValue.toLowerCase();
        const compareValueCompare = options.caseSensitive ? compareAttr[2] : compareAttr[2].toLowerCase();

        if (valueCompare !== compareValueCompare) {
          // Mark this attribute value as different
          const valueStart = match.index! + match[0].indexOf(attrValue);
          const valueEnd = valueStart + attrValue.length;
          differences.push({
            start: valueStart,
            end: valueEnd,
            replacement: `__MARK_START__${attrValue}__MARK_END__`,
          });
        }
      } else if (!compareAttr) {
        // Attribute doesn't exist in compare line
        const valueStart = match.index! + match[0].indexOf(attrValue);
        const valueEnd = valueStart + attrValue.length;
        differences.push({
          start: valueStart,
          end: valueEnd,
          replacement: `__MARK_START__${attrValue}__MARK_END__`,
        });
      }
    });

    // Sort differences by position (reverse order to apply from end to start)
    differences.sort((a, b) => b.start - a.start);

    // Apply differences
    let result = line;
    differences.forEach(diff => {
      result = result.substring(0, diff.start) + diff.replacement + result.substring(diff.end);
    });

    // Now escape HTML
    result = escapeHtml(result);

    // Replace markers with actual <mark> tags (after escaping)
    result = result.replace(/__MARK_START__/g, '<mark>').replace(/__MARK_END__/g, '</mark>');

    return result;
  } catch {
    // If highlighting fails, just return the escaped line
    return escapeHtml(line);
  }
}

/**
 * Helper function to compare XML nodes recursively (unused - kept for potential future use)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function compareXMLNodes(
  leftNode: Element | null,
  rightNode: Element | null,
  path: string,
  options: ComparisonOptions
): Difference[] {
  const differences: Difference[] = [];

  if (!leftNode && !rightNode) {
    return differences;
  }

  if (!leftNode) {
    differences.push({
      path: path || 'root',
      leftValue: undefined,
      rightValue: `<${rightNode!.nodeName}>`,
      type: 'added',
    });
    return differences;
  }

  if (!rightNode) {
    differences.push({
      path: path || 'root',
      leftValue: `<${leftNode.nodeName}>`,
      rightValue: undefined,
      type: 'removed',
    });
    return differences;
  }

  const currentPath = path ? `${path}/${leftNode.nodeName}` : leftNode.nodeName;

  // Compare node names
  let leftName = leftNode.nodeName;
  let rightName = rightNode.nodeName;

  if (!options.caseSensitive) {
    leftName = leftName.toLowerCase();
    rightName = rightName.toLowerCase();
  }

  if (leftName !== rightName) {
    differences.push({
      path: currentPath,
      leftValue: `<${leftNode.nodeName}>`,
      rightValue: `<${rightNode.nodeName}>`,
      type: 'modified',
    });
    return differences;
  }

  // Compare attributes
  const leftAttrs = leftNode.attributes;
  const rightAttrs = rightNode.attributes;
  const attrNames = new Set<string>();

  for (let i = 0; i < leftAttrs.length; i++) {
    attrNames.add(leftAttrs[i].name);
  }
  for (let i = 0; i < rightAttrs.length; i++) {
    attrNames.add(rightAttrs[i].name);
  }

  for (const attrName of attrNames) {
    let leftValue = leftNode.getAttribute(attrName);
    let rightValue = rightNode.getAttribute(attrName);

    // Apply options
    if (options.ignoreWhitespace) {
      leftValue = leftValue?.trim() || null;
      rightValue = rightValue?.trim() || null;
    }

    if (!options.caseSensitive) {
      leftValue = leftValue?.toLowerCase() || null;
      rightValue = rightValue?.toLowerCase() || null;
    }

    if (leftValue !== rightValue) {
      differences.push({
        path: `${currentPath}/@${attrName}`,
        leftValue: leftValue || '(not set)',
        rightValue: rightValue || '(not set)',
        type: leftValue === null ? 'added' : rightValue === null ? 'removed' : 'modified',
      });
    }
  }

  // Compare text content (only direct text nodes, not nested)
  let leftText = '';
  let rightText = '';

  for (let i = 0; i < leftNode.childNodes.length; i++) {
    const child = leftNode.childNodes[i];
    if (child.nodeType === Node.TEXT_NODE) {
      leftText += child.textContent || '';
    }
  }

  for (let i = 0; i < rightNode.childNodes.length; i++) {
    const child = rightNode.childNodes[i];
    if (child.nodeType === Node.TEXT_NODE) {
      rightText += child.textContent || '';
    }
  }

  if (options.ignoreWhitespace) {
    leftText = leftText.replace(/\s+/g, ' ').trim();
    rightText = rightText.replace(/\s+/g, ' ').trim();
  }

  if (!options.caseSensitive) {
    leftText = leftText.toLowerCase();
    rightText = rightText.toLowerCase();
  }

  if (leftText !== rightText && (leftText || rightText)) {
    differences.push({
      path: `${currentPath}/text()`,
      leftValue: leftText || '(empty)',
      rightValue: rightText || '(empty)',
      type: 'modified',
    });
  }

  // Compare child elements
  const leftChildren = Array.from(leftNode.children);
  const rightChildren = Array.from(rightNode.children);

  // Create a map of children by tag name for better comparison
  const leftChildMap = new Map<string, Element[]>();
  const rightChildMap = new Map<string, Element[]>();

  leftChildren.forEach((child) => {
    const name = options.caseSensitive ? child.nodeName : child.nodeName.toLowerCase();
    if (!leftChildMap.has(name)) {
      leftChildMap.set(name, []);
    }
    leftChildMap.get(name)!.push(child);
  });

  rightChildren.forEach((child) => {
    const name = options.caseSensitive ? child.nodeName : child.nodeName.toLowerCase();
    if (!rightChildMap.has(name)) {
      rightChildMap.set(name, []);
    }
    rightChildMap.get(name)!.push(child);
  });

  const allChildNames = new Set([...leftChildMap.keys(), ...rightChildMap.keys()]);

  for (const childName of allChildNames) {
    const leftChildrenOfType = leftChildMap.get(childName) || [];
    const rightChildrenOfType = rightChildMap.get(childName) || [];
    const maxLength = Math.max(leftChildrenOfType.length, rightChildrenOfType.length);

    for (let i = 0; i < maxLength; i++) {
      const indexPath = maxLength > 1 ? `${currentPath}/${childName}[${i + 1}]` : currentPath;
      differences.push(
        ...compareXMLNodes(
          leftChildrenOfType[i] || null,
          rightChildrenOfType[i] || null,
          indexPath,
          options
        )
      );
    }
  }

  return differences;
}

/**
 * Compares two text strings
 */
export function compareText(
  leftContent: string,
  rightContent: string,
  options: ComparisonOptions = {}
): ComparisonResult {
  if (!leftContent && !rightContent) {
    return {
      areEqual: true,
      differences: [],
      message: 'Both contents are empty',
    };
  }

  // Split into lines for line-by-line comparison
  const leftLines = leftContent.split('\n');
  const rightLines = rightContent.split('\n');

  // Perform line-by-line comparison similar to JSON/XML
  const { differences, diffCount, statistics } = compareTextLines(leftLines, rightLines, options);

  return {
    areEqual: diffCount === 0,
    differences,
    message: diffCount === 0 ? '' : `Found ${diffCount} line(s) with differences`,
    statistics,
  };
}

/**
 * Helper function to compare text line by line with highlighting
 * Similar to compareJSONLines and compareXMLLines
 */
function compareTextLines(
  leftLines: string[],
  rightLines: string[],
  options: ComparisonOptions
): { differences: Difference[]; diffCount: number; statistics: { added: number; removed: number; modified: number } } {
  const maxLines = Math.max(leftLines.length, rightLines.length);

  // Adjust context based on file size
  const LARGE_FILE_THRESHOLD = 1000;
  const isLargeFile = maxLines > LARGE_FILE_THRESHOLD;
  const CONTEXT_LINES = isLargeFile ? 2 : 3;

  // First pass: identify which lines are different
  const diffLineNumbers: number[] = [];
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;

  for (let i = 0; i < maxLines; i++) {
    const leftLine = leftLines[i] !== undefined ? leftLines[i] : '';
    const rightLine = rightLines[i] !== undefined ? rightLines[i] : '';

    // Apply options for comparison
    let leftCompare = leftLine;
    let rightCompare = rightLine;

    if (options.ignoreWhitespace) {
      // Remove ALL whitespace characters for comparison
      leftCompare = leftCompare.replace(/\s/g, '');
      rightCompare = rightCompare.replace(/\s/g, '');
    }

    if (!options.caseSensitive) {
      leftCompare = leftCompare.toLowerCase();
      rightCompare = rightCompare.toLowerCase();
    }

    if (leftCompare !== rightCompare) {
      diffLineNumbers.push(i);

      // Categorize the difference
      if (!leftLine && rightLine) {
        addedCount++;
      } else if (leftLine && !rightLine) {
        removedCount++;
      } else {
        modifiedCount++;
      }
    }
  }

  const diffCount = diffLineNumbers.length;
  const statistics = { added: addedCount, removed: removedCount, modified: modifiedCount };

  if (diffCount === 0) {
    return { differences: [], diffCount: 0, statistics: { added: 0, removed: 0, modified: 0 } };
  }

  // Build set of line numbers to display (differences + context)
  const linesToDisplay = new Set<number>();

  // For very large diff counts, limit the display
  const MAX_DIFFS_TO_DISPLAY = 1000;
  const diffsToProcess = diffCount > MAX_DIFFS_TO_DISPLAY
    ? diffLineNumbers.slice(0, MAX_DIFFS_TO_DISPLAY)
    : diffLineNumbers;

  diffsToProcess.forEach(lineNum => {
    for (let j = Math.max(0, lineNum - CONTEXT_LINES); j <= Math.min(maxLines - 1, lineNum + CONTEXT_LINES); j++) {
      linesToDisplay.add(j);
    }
  });

  const finalLinesToDisplay = Array.from(linesToDisplay).sort((a, b) => a - b);

  // Build content with only selected lines
  let leftFullContent = '';
  let rightFullContent = '';
  let lastDisplayedLine = -1;

  // Add warning message if showing limited results
  if (diffCount > MAX_DIFFS_TO_DISPLAY) {
    const infoMsg = `<div class="line-same" style="text-align: center; padding: 16px; background: #fee2e2; color: #991b1b; font-weight: 600; border-radius: 6px; margin-bottom: 12px; border: 2px solid #f87171;">⚠️ Large number of differences detected (${diffCount} lines). Showing first ${MAX_DIFFS_TO_DISPLAY} differences to prevent browser freeze. Consider using "Ignore Whitespace" toggle or comparing smaller sections.</div>\n`;
    leftFullContent += infoMsg;
    rightFullContent += infoMsg;
  }

  finalLinesToDisplay.forEach((i) => {
    // Add ellipsis if there's a gap
    if (lastDisplayedLine >= 0 && i > lastDisplayedLine + 1) {
      leftFullContent += `<div class="line-same" style="text-align: center; font-style: italic; color: #888;">...</div>\n`;
      rightFullContent += `<div class="line-same" style="text-align: center; font-style: italic; color: #888;">...</div>\n`;
    }

    const leftLine = leftLines[i] !== undefined ? leftLines[i] : '';
    const rightLine = rightLines[i] !== undefined ? rightLines[i] : '';
    const leftOriginal = leftLine;
    const rightOriginal = rightLine;

    // Apply options for comparison
    let leftCompare = leftLine;
    let rightCompare = rightLine;

    if (options.ignoreWhitespace) {
      // Remove ALL whitespace characters for comparison
      leftCompare = leftCompare.replace(/\s/g, '');
      rightCompare = rightCompare.replace(/\s/g, '');
    }

    if (!options.caseSensitive) {
      leftCompare = leftCompare.toLowerCase();
      rightCompare = rightCompare.toLowerCase();
    }

    const lineNum = i + 1;

    // Check if lines are different
    if (leftCompare !== rightCompare) {
      // Highlight the differences within the line
      const highlightedLeft = highlightTextDifference(leftOriginal, rightOriginal, options);
      const highlightedRight = highlightTextDifference(rightOriginal, leftOriginal, options);

      leftFullContent += `<div class="line-diff"><span class="line-number">${lineNum}</span>${highlightedLeft}</div>\n`;
      rightFullContent += `<div class="line-diff"><span class="line-number">${lineNum}</span>${highlightedRight}</div>\n`;
    } else {
      // Show unchanged lines with HTML-escaped content
      const escapedLeft = escapeHtml(leftOriginal);
      const escapedRight = escapeHtml(rightOriginal);
      leftFullContent += `<div class="line-same"><span class="line-number">${lineNum}</span>${escapedLeft}</div>\n`;
      rightFullContent += `<div class="line-same"><span class="line-number">${lineNum}</span>${escapedRight}</div>\n`;
    }

    lastDisplayedLine = i;
  });

  // Return a single difference containing the content
  return {
    differences: [{
      path: 'Full Document',
      leftValue: leftFullContent,
      rightValue: rightFullContent,
      type: 'modified',
    }],
    diffCount,
    statistics,
  };
}

/**
 * Helper function to highlight differences within text lines
 */
function highlightTextDifference(line: string, compareLine: string, options: ComparisonOptions): string {
  if (!line && !compareLine) return '';
  if (!line) return escapeHtml('(empty line)');
  if (!compareLine) return escapeHtml(line);

  // For very long lines, skip detailed highlighting
  if (line.length > 500) {
    return escapeHtml(line);
  }

  // Convert strings to arrays of Unicode code points to handle emojis correctly
  const lineChars = Array.from(line);
  const compareChars = Array.from(compareLine);

  // Find differences character by character
  let result = '';
  let inDiff = false;
  let diffChars: string[] = [];

  for (let i = 0; i < lineChars.length; i++) {
    const lineChar = lineChars[i];
    const compareChar = i < compareChars.length ? compareChars[i] : '';

    // Apply case sensitivity option
    const lineCharCompare = options.caseSensitive ? lineChar : lineChar.toLowerCase();
    const compareCharCompare = options.caseSensitive ? compareChar : compareChar.toLowerCase();

    if (i < compareChars.length && lineCharCompare === compareCharCompare) {
      // Characters match
      if (inDiff) {
        // End of difference region
        result += '<mark>' + escapeHtml(diffChars.join('')) + '</mark>';
        inDiff = false;
        diffChars = [];
      }
      result += escapeHtml(lineChar);
    } else {
      // Characters differ
      if (!inDiff) {
        inDiff = true;
      }
      diffChars.push(lineChar);
    }
  }

  // Close any remaining diff region
  if (inDiff) {
    result += '<mark>' + escapeHtml(diffChars.join('')) + '</mark>';
  }

  return result;
}

/**
 * Helper function to normalize case for objects (unused - kept for potential future use)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeCase(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return obj.toLowerCase();
  }
  if (Array.isArray(obj)) {
    return obj.map(normalizeCase);
  }
  if (obj !== null && typeof obj === 'object') {
    const normalized: Record<string, unknown> = {};
    for (const key in obj) {
      normalized[key.toLowerCase()] = normalizeCase((obj as Record<string, unknown>)[key]);
    }
    return normalized;
  }
  return obj;
}

/**
 * Helper function to sort object keys recursively
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

/**
 * Helper function to normalize arrays by sorting them recursively
 * This allows array comparison to ignore element order
 */
function sortArrays(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    // Recursively sort nested arrays/objects first
    const processed = obj.map(sortArrays);
    // Sort the array by stringified representation for comparison
    return processed.sort((a, b) => {
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      return aStr.localeCompare(bStr);
    });
  }
  if (typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      sorted[key] = sortArrays((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

/**
 * Helper function to find differences between two objects (unused - kept for potential future use)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function findDifferences(left: unknown, right: unknown, path: string, options: ComparisonOptions): Difference[] {
  const differences: Difference[] = [];

  if (typeof left !== typeof right) {
    differences.push({
      path: path || 'root',
      leftValue: left,
      rightValue: right,
      type: 'modified',
    });
    return differences;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const maxLength = Math.max(left.length, right.length);
    for (let i = 0; i < maxLength; i++) {
      const currentPath = `${path}[${i}]`;
      if (i >= left.length) {
        differences.push({
          path: currentPath,
          leftValue: undefined,
          rightValue: right[i],
          type: 'added',
        });
      } else if (i >= right.length) {
        differences.push({
          path: currentPath,
          leftValue: left[i],
          rightValue: undefined,
          type: 'removed',
        });
      } else {
        differences.push(...findDifferences(left[i], right[i], currentPath, options));
      }
    }
    return differences;
  }

  if (left !== null && typeof left === 'object' && right !== null && typeof right === 'object') {
    const leftObj = left as Record<string, unknown>;
    const rightObj = right as Record<string, unknown>;
    const leftKeys = Object.keys(leftObj);
    const rightKeys = Object.keys(rightObj);
    const allKeys = new Set([...leftKeys, ...rightKeys]);

    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      const hasLeft = key in leftObj;
      const hasRight = key in rightObj;

      if (!hasLeft) {
        differences.push({
          path: currentPath,
          leftValue: undefined,
          rightValue: rightObj[key],
          type: 'added',
        });
      } else if (!hasRight) {
        differences.push({
          path: currentPath,
          leftValue: leftObj[key],
          rightValue: undefined,
          type: 'removed',
        });
      } else {
        differences.push(...findDifferences(leftObj[key], rightObj[key], currentPath, options));
      }
    }
    return differences;
  }

  if (left !== right) {
    differences.push({
      path: path || 'root',
      leftValue: left,
      rightValue: right,
      type: 'modified',
    });
  }

  return differences;
}

/**
 * Downloads content as a file
 */
export function downloadContent(content: string, filename: string, type: 'json' | 'xml' | 'txt'): void {
  if (!content || content.trim() === '') {
    return;
  }

  // Determine MIME type
  const mimeTypes = {
    json: 'application/json',
    xml: 'application/xml',
    txt: 'text/plain',
  };

  const mimeType = mimeTypes[type];

  // Create blob and download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
