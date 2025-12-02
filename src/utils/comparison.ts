export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  message: string;
  prettified?: string; // Formatted/corrected JSON
  corrections?: string[]; // List of corrections made
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
    // Remove BOM (Byte Order Mark) and other hidden characters that might cause parsing issues
    let cleanedContent = content;

    // Remove BOM if present (U+FEFF)
    if (cleanedContent.charCodeAt(0) === 0xFEFF) {
      cleanedContent = cleanedContent.slice(1);
    }

    // Remove zero-width characters and other invisible Unicode characters
    cleanedContent = cleanedContent.replace(/[\u200B-\u200D\uFEFF]/g, '');

    const parsed = JSON.parse(cleanedContent);

    // Check if the parsed result is an object or array (not primitive types)
    if (typeof parsed !== 'object' || parsed === null) {
      return {
        isValid: false,
        errors: ['JSON must be an object or array, not a primitive value'],
        message: 'Invalid JSON',
      };
    }

    const lines = content.split('\n').length;
    const sizeInKB = (new Blob([content]).size / 1024).toFixed(2);
    const type = Array.isArray(parsed) ? 'Array' : 'Object';

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
    const leftObj = JSON.parse(leftContent);
    const rightObj = JSON.parse(rightContent);

    let leftFormatted: string;
    let rightFormatted: string;

    // Check if any transformations need to be applied
    const needsTransformation = options.ignoreKeyOrder || options.ignoreArrayOrder || options.ignoreWhitespace;

    if (needsTransformation) {
      // Apply transformations
      let leftTransformed = leftObj;
      let rightTransformed = rightObj;

      // Apply key order transformation if requested
      if (options.ignoreKeyOrder) {
        leftTransformed = sortObjectKeys(leftTransformed);
        rightTransformed = sortObjectKeys(rightTransformed);
      }

      // Apply array order transformation if requested
      if (options.ignoreArrayOrder) {
        leftTransformed = sortArrays(leftTransformed);
        rightTransformed = sortArrays(rightTransformed);
      }

      // Re-stringify based on ignoreWhitespace setting
      if (options.ignoreWhitespace) {
        // Normalize to pretty-printed format
        leftFormatted = JSON.stringify(leftTransformed, null, 2);
        rightFormatted = JSON.stringify(rightTransformed, null, 2);
      } else {
        // Preserve original format style (compact vs pretty-printed)
        const leftIsCompact = !leftContent.includes('\n');
        const rightIsCompact = !rightContent.includes('\n');

        leftFormatted = leftIsCompact ? JSON.stringify(leftTransformed) : JSON.stringify(leftTransformed, null, 2);
        rightFormatted = rightIsCompact ? JSON.stringify(rightTransformed) : JSON.stringify(rightTransformed, null, 2);
      }
    } else {
      // No transformations - preserve original formatting exactly
      leftFormatted = leftContent;
      rightFormatted = rightContent;
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
  // Use LCS-based diff algorithm
  const diffOps = computeDiff(leftLines, rightLines, options);

  // Count statistics
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let diffCount = 0;

  diffOps.forEach(op => {
    if (op.type === 'add') {
      addedCount++;
      diffCount++;
    } else if (op.type === 'remove') {
      removedCount++;
      diffCount++;
    } else if (op.type === 'modify') {
      modifiedCount++;
      diffCount++;
    }
  });

  const statistics = { added: addedCount, removed: removedCount, modified: modifiedCount };

  if (diffCount === 0) {
    return { differences: [], diffCount: 0, statistics: { added: 0, removed: 0, modified: 0 } };
  }

  // Build full document diff view - show all content with optimized spacing
  const differences: Difference[] = [];
  let leftContent = '';
  let rightContent = '';
  let leftLineNum = 1;
  let rightLineNum = 1;

  // Process all lines
  for (let i = 0; i < diffOps.length; i++) {
    const op = diffOps[i];

    if (op.type === 'keep') {
      const escapedLine = escapeHtml(op.line);
      leftContent += `<div class="line-same"><span class="line-number">${leftLineNum}</span>${escapedLine}</div>`;
      rightContent += `<div class="line-same"><span class="line-number">${rightLineNum}</span>${escapedLine}</div>`;
      leftLineNum++;
      rightLineNum++;
    } else if (op.type === 'modify') {
      const highlightedLeft = highlightJSONDifference(op.line, op.rightLine || '', { caseSensitive: true, ignoreWhitespace: false });
      const highlightedRight = highlightJSONDifference(op.rightLine || '', op.line, { caseSensitive: true, ignoreWhitespace: false });
      leftContent += `<div class="line-modified"><span class="line-number">${leftLineNum}</span>${highlightedLeft}</div>`;
      rightContent += `<div class="line-modified"><span class="line-number">${rightLineNum}</span>${highlightedRight}</div>`;
      leftLineNum++;
      rightLineNum++;
    } else if (op.type === 'remove') {
      const escapedLine = escapeHtml(op.line);
      leftContent += `<div class="line-removed"><span class="line-number">${leftLineNum}</span>${escapedLine}</div>`;
      rightContent += `<div class="line-empty"><span class="line-number"></span></div>`;
      leftLineNum++;
    } else if (op.type === 'add') {
      const escapedLine = escapeHtml(op.line);
      leftContent += `<div class="line-empty"><span class="line-number"></span></div>`;
      rightContent += `<div class="line-added"><span class="line-number">${rightLineNum}</span>${escapedLine}</div>`;
      rightLineNum++;
    }
  }

  // Determine primary change type
  let primaryType: 'added' | 'removed' | 'modified' = 'modified';
  if (modifiedCount > 0) primaryType = 'modified';
  else if (addedCount > 0 && removedCount > 0) primaryType = 'modified';
  else if (addedCount > 0) primaryType = 'added';
  else if (removedCount > 0) primaryType = 'removed';

  // Create a single difference entry for the full document
  differences.push({
    path: 'Full Document',
    leftValue: leftContent,
    rightValue: rightContent,
    type: primaryType,
  });

  return {
    differences,
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
 * Compute LCS (Longest Common Subsequence) based diff using Myers algorithm
 * Returns an array of diff operations
 */
interface DiffOp {
  type: 'keep' | 'add' | 'remove' | 'modify';
  leftIndex?: number;
  rightIndex?: number;
  line: string;
  rightLine?: string; // For modify type
}

function computeDiff(leftLines: string[], rightLines: string[], options: ComparisonOptions): DiffOp[] {
  // Normalize lines for comparison based on options
  const normalizeForComparison = (line: string): string => {
    let normalized = line;
    if (options.ignoreWhitespace) {
      normalized = normalized.replace(/\s/g, '');
    }
    if (!options.caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    return normalized;
  };

  const leftNormalized = leftLines.map(normalizeForComparison);
  const rightNormalized = rightLines.map(normalizeForComparison);

  // Build LCS table using dynamic programming
  const m = leftLines.length;
  const n = rightLines.length;
  const lcs: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (leftNormalized[i - 1] === rightNormalized[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff operations
  const result: DiffOp[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && leftNormalized[i - 1] === rightNormalized[j - 1]) {
      // Lines are the same - keep
      result.unshift({
        type: 'keep',
        leftIndex: i - 1,
        rightIndex: j - 1,
        line: leftLines[i - 1]
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      // Line added on right
      result.unshift({
        type: 'add',
        rightIndex: j - 1,
        line: rightLines[j - 1]
      });
      j--;
    } else if (i > 0) {
      // Line removed from left
      result.unshift({
        type: 'remove',
        leftIndex: i - 1,
        line: leftLines[i - 1]
      });
      i--;
    }
  }

  // Post-process: Detect modifications using optimal matching
  const processed: DiffOp[] = [];
  let idx = 0;

  while (idx < result.length) {
    const current = result[idx];

    // If not a remove, just add it
    if (current.type !== 'remove') {
      processed.push(current);
      idx++;
      continue;
    }

    // Collect consecutive removes
    const removes: DiffOp[] = [];
    while (idx < result.length && result[idx].type === 'remove') {
      removes.push(result[idx]);
      idx++;
    }

    // Collect consecutive adds
    const adds: DiffOp[] = [];
    while (idx < result.length && result[idx].type === 'add') {
      adds.push(result[idx]);
      idx++;
    }

    // Try to match removes with adds based on similarity
    if (removes.length > 0 && adds.length > 0) {
      const usedAdds = new Set<number>();
      const usedRemoves = new Set<number>();

      // For each remove, find best matching add
      for (let r = 0; r < removes.length; r++) {
        if (usedRemoves.has(r)) continue;

        const removeOp = removes[r];
        const leftLine = leftLines[removeOp.leftIndex!];

        let bestMatch = -1;
        let bestSimilarity = 0.3; // Lowered from 0.5 to 0.3 - better detection of value changes

        for (let a = 0; a < adds.length; a++) {
          if (usedAdds.has(a)) continue;

          const addOp = adds[a];
          const rightLine = rightLines[addOp.rightIndex!];
          const similarity = calculateSimilarity(leftLine, rightLine);

          // Multi-level whitespace normalization for better modification detection

          // Level 1: Basic whitespace normalization (collapse multiple spaces, trim ends)
          const leftTrimmed = leftLine.replace(/\s+/g, ' ').trim();
          const rightTrimmed = rightLine.replace(/\s+/g, ' ').trim();
          let effectiveSimilarity = leftTrimmed === rightTrimmed ? 0.95 : similarity;

          // Level 2: Aggressive normalization - remove ALL whitespace inside JSON string values
          // This handles: "name": "   gCrtULPQ   " vs "name": "gCrtULPQ"
          const aggressiveNormalize = (line: string) => {
            // Remove ALL whitespace inside quoted strings, not just trim edges
            return line.replace(/":\s*"([^"]*)"/g, (_match, value) => {
              // Remove all leading/trailing spaces from the value
              const cleaned = value.replace(/^\s+|\s+$/g, '');
              return '": "' + cleaned + '"';
            }).replace(/\s+/g, ' ').trim();
          };

          const leftAggressive = aggressiveNormalize(leftLine);
          const rightAggressive = aggressiveNormalize(rightLine);

          // If identical after aggressive normalization, it's just whitespace differences
          if (leftAggressive === rightAggressive) {
            effectiveSimilarity = 0.95;
          }

          // 3. Third check: if both lines have the same JSON key, likely a modification
          // This catches cases where the value changed but key is the same
          const jsonKeyMatch = leftLine.match(/^\s*"([^"]+)"\s*:/);
          if (jsonKeyMatch) {
            const leftKey = jsonKeyMatch[1];
            const rightKeyMatch = rightLine.match(/^\s*"([^"]+)"\s*:/);
            if (rightKeyMatch && rightKeyMatch[1] === leftKey) {
              // Same key found - boost similarity significantly
              // This ensures it's treated as modification, not add/remove
              effectiveSimilarity = Math.max(effectiveSimilarity, 0.65);
            }
          }

          if (effectiveSimilarity > bestSimilarity) {
            bestSimilarity = effectiveSimilarity;
            bestMatch = a;
          }
        }

        if (bestMatch >= 0) {
          // Found match - treat as modification
          const addOp = adds[bestMatch];
          const rightLine = rightLines[addOp.rightIndex!];

          // Matched successfully - similarity above threshold

          processed.push({
            type: 'modify',
            leftIndex: removeOp.leftIndex,
            rightIndex: addOp.rightIndex,
            line: leftLine,
            rightLine: rightLine
          });

          usedRemoves.add(r);
          usedAdds.add(bestMatch);
        }
      }

      // Add unmatched removes
      for (let r = 0; r < removes.length; r++) {
        if (!usedRemoves.has(r)) {
          processed.push(removes[r]);
        }
      }

      // Add unmatched adds
      for (let a = 0; a < adds.length; a++) {
        if (!usedAdds.has(a)) {
          processed.push(adds[a]);
        }
      }
    } else {
      // No matching possible
      processed.push(...removes);
      processed.push(...adds);
    }
  }

  return processed;
}

/**
 * Calculate similarity between two strings (0 = completely different, 1 = identical)
 * Uses Levenshtein distance ratio for better detection of modifications
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;

  // Calculate Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const levenshteinDistance = matrix[str1.length][str2.length];

  // Return similarity ratio (1 - normalized distance)
  return 1 - (levenshteinDistance / maxLength);
}

/**
 * Helper function to compare XML line by line with highlighting using LCS-based diff
 * Returns all lines with differences highlighted
 * Optimized for large files by showing only context around differences
 */
function compareXMLLines(
  leftLines: string[],
  rightLines: string[],
  options: ComparisonOptions
): { differences: Difference[]; diffCount: number; statistics: { added: number; removed: number; modified: number } } {
  // Use LCS-based diff algorithm
  const diffOps = computeDiff(leftLines, rightLines, options);

  // Count statistics
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let diffCount = 0;

  diffOps.forEach(op => {
    if (op.type === 'add') {
      addedCount++;
      diffCount++;
    } else if (op.type === 'remove') {
      removedCount++;
      diffCount++;
    } else if (op.type === 'modify') {
      modifiedCount++;
      diffCount++;
    }
  });

  const statistics = { added: addedCount, removed: removedCount, modified: modifiedCount };

  if (diffCount === 0) {
    return { differences: [], diffCount: 0, statistics: { added: 0, removed: 0, modified: 0 } };
  }

  // Build HTML content
  let leftFullContent = '';
  let rightFullContent = '';
  let leftLineNum = 1;
  let rightLineNum = 1;

  // For very large diff counts, limit the display
  const MAX_DIFFS_TO_DISPLAY = 1000;
  const CONTEXT_LINES = 3;

  // Find indices of diff operations (not 'keep')
  const diffIndices: number[] = [];
  diffOps.forEach((op, idx) => {
    if (op.type !== 'keep') {
      diffIndices.push(idx);
    }
  });

  // Build set of operations to display (diffs + context)
  const opsToDisplay = new Set<number>();
  const diffsToProcess = diffCount > MAX_DIFFS_TO_DISPLAY
    ? diffIndices.slice(0, MAX_DIFFS_TO_DISPLAY)
    : diffIndices;

  diffsToProcess.forEach(idx => {
    for (let j = Math.max(0, idx - CONTEXT_LINES); j <= Math.min(diffOps.length - 1, idx + CONTEXT_LINES); j++) {
      opsToDisplay.add(j);
    }
  });

  const finalOpsToDisplay = Array.from(opsToDisplay).sort((a, b) => a - b);

  // Add warning message if showing limited results
  if (diffCount > MAX_DIFFS_TO_DISPLAY) {
    const infoMsg = `<div class="line-same" style="text-align: center; padding: 16px; background: #fee2e2; color: #991b1b; font-weight: 600; border-radius: 6px; margin-bottom: 12px; border: 2px solid #f87171;">⚠️ Large number of differences detected (${diffCount} lines). Showing first ${MAX_DIFFS_TO_DISPLAY} differences to prevent browser freeze. Consider using "Ignore Whitespace" toggle or comparing smaller sections.</div>\n`;
    leftFullContent += infoMsg;
    rightFullContent += infoMsg;
  }

  let lastDisplayedIdx = -1;

  finalOpsToDisplay.forEach((idx) => {
    const op = diffOps[idx];

    // Add ellipsis if there's a gap
    if (lastDisplayedIdx >= 0 && idx > lastDisplayedIdx + 1) {
      leftFullContent += `<div class="line-same" style="text-align: center; font-style: italic; color: #888;">...</div>\n`;
      rightFullContent += `<div class="line-same" style="text-align: center; font-style: italic; color: #888;">...</div>\n`;
    }

    if (op.type === 'keep') {
      // Same line on both sides
      const escapedLine = escapeHtml(op.line);
      leftFullContent += `<div class="line-same"><span class="line-number">${leftLineNum}</span>${escapedLine}</div>\n`;
      rightFullContent += `<div class="line-same"><span class="line-number">${rightLineNum}</span>${escapedLine}</div>\n`;
      leftLineNum++;
      rightLineNum++;
    } else if (op.type === 'modify') {
      // Line modified (exists on both sides but different)
      const highlightedLeft = highlightXMLDifference(op.line, op.rightLine || '', { caseSensitive: true, ignoreWhitespace: false });
      const highlightedRight = highlightXMLDifference(op.rightLine || '', op.line, { caseSensitive: true, ignoreWhitespace: false });
      leftFullContent += `<div class="line-modified"><span class="line-number">${leftLineNum}</span>${highlightedLeft}</div>\n`;
      rightFullContent += `<div class="line-modified"><span class="line-number">${rightLineNum}</span>${highlightedRight}</div>\n`;
      leftLineNum++;
      rightLineNum++;
    } else if (op.type === 'remove') {
      // Line removed from left (exists in left, not in right)
      const escapedLine = escapeHtml(op.line);
      leftFullContent += `<div class="line-removed"><span class="line-number">${leftLineNum}</span>${escapedLine}</div>\n`;
      // Don't add anything to right side for removed lines
      leftLineNum++;
    } else if (op.type === 'add') {
      // Line added to right (exists in right, not in left)
      const escapedLine = escapeHtml(op.line);
      // Don't add anything to left side for added lines
      rightFullContent += `<div class="line-added"><span class="line-number">${rightLineNum}</span>${escapedLine}</div>\n`;
      rightLineNum++;
    }

    lastDisplayedIdx = idx;
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
  // Use LCS-based diff algorithm
  const diffOps = computeDiff(leftLines, rightLines, options);

  // Count statistics
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  let diffCount = 0;

  diffOps.forEach(op => {
    if (op.type === 'add') {
      addedCount++;
      diffCount++;
    } else if (op.type === 'remove') {
      removedCount++;
      diffCount++;
    } else if (op.type === 'modify') {
      modifiedCount++;
      diffCount++;
    }
  });

  const statistics = { added: addedCount, removed: removedCount, modified: modifiedCount };

  if (diffCount === 0) {
    return { differences: [], diffCount: 0, statistics: { added: 0, removed: 0, modified: 0 } };
  }

  // Build HTML content
  let leftFullContent = '';
  let rightFullContent = '';
  let leftLineNum = 1;
  let rightLineNum = 1;

  // For very large diff counts, limit the display
  const MAX_DIFFS_TO_DISPLAY = 1000;
  const CONTEXT_LINES = 3;

  // Find indices of diff operations (not 'keep')
  const diffIndices: number[] = [];
  diffOps.forEach((op, idx) => {
    if (op.type !== 'keep') {
      diffIndices.push(idx);
    }
  });

  // Build set of operations to display (diffs + context)
  const opsToDisplay = new Set<number>();
  const diffsToProcess = diffCount > MAX_DIFFS_TO_DISPLAY
    ? diffIndices.slice(0, MAX_DIFFS_TO_DISPLAY)
    : diffIndices;

  diffsToProcess.forEach(idx => {
    for (let j = Math.max(0, idx - CONTEXT_LINES); j <= Math.min(diffOps.length - 1, idx + CONTEXT_LINES); j++) {
      opsToDisplay.add(j);
    }
  });

  const finalOpsToDisplay = Array.from(opsToDisplay).sort((a, b) => a - b);

  // Add warning message if showing limited results
  if (diffCount > MAX_DIFFS_TO_DISPLAY) {
    const infoMsg = `<div class="line-same" style="text-align: center; padding: 16px; background: #fee2e2; color: #991b1b; font-weight: 600; border-radius: 6px; margin-bottom: 12px; border: 2px solid #f87171;">⚠️ Large number of differences detected (${diffCount} lines). Showing first ${MAX_DIFFS_TO_DISPLAY} differences to prevent browser freeze. Consider using "Ignore Whitespace" toggle or comparing smaller sections.</div>\n`;
    leftFullContent += infoMsg;
    rightFullContent += infoMsg;
  }

  let lastDisplayedIdx = -1;

  finalOpsToDisplay.forEach((idx) => {
    const op = diffOps[idx];

    // Add ellipsis if there's a gap
    if (lastDisplayedIdx >= 0 && idx > lastDisplayedIdx + 1) {
      leftFullContent += `<div class="line-same" style="text-align: center; font-style: italic; color: #888;">...</div>\n`;
      rightFullContent += `<div class="line-same" style="text-align: center; font-style: italic; color: #888;">...</div>\n`;
    }

    if (op.type === 'keep') {
      // Same line on both sides
      const escapedLine = escapeHtml(op.line);
      leftFullContent += `<div class="line-same"><span class="line-number">${leftLineNum}</span>${escapedLine}</div>\n`;
      rightFullContent += `<div class="line-same"><span class="line-number">${rightLineNum}</span>${escapedLine}</div>\n`;
      leftLineNum++;
      rightLineNum++;
    } else if (op.type === 'modify') {
      // Line modified (exists on both sides but different)
      const highlightedLeft = highlightXMLDifference(op.line, op.rightLine || '', { caseSensitive: true, ignoreWhitespace: false });
      const highlightedRight = highlightXMLDifference(op.rightLine || '', op.line, { caseSensitive: true, ignoreWhitespace: false });
      leftFullContent += `<div class="line-modified"><span class="line-number">${leftLineNum}</span>${highlightedLeft}</div>\n`;
      rightFullContent += `<div class="line-modified"><span class="line-number">${rightLineNum}</span>${highlightedRight}</div>\n`;
      leftLineNum++;
      rightLineNum++;
    } else if (op.type === 'remove') {
      // Line removed from left (exists in left, not in right)
      const escapedLine = escapeHtml(op.line);
      leftFullContent += `<div class="line-removed"><span class="line-number">${leftLineNum}</span>${escapedLine}</div>\n`;
      // Don't add anything to right side for removed lines
      leftLineNum++;
    } else if (op.type === 'add') {
      // Line added to right (exists in right, not in left)
      const escapedLine = escapeHtml(op.line);
      // Don't add anything to left side for added lines
      rightFullContent += `<div class="line-added"><span class="line-number">${rightLineNum}</span>${escapedLine}</div>\n`;
      rightLineNum++;
    }

    lastDisplayedIdx = idx;
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      // Handle different types of values
      if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b);
      }
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }
      // For objects and mixed types, use JSON string comparison
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
 * Prettifies and validates JSON with automatic syntax correction
 * Returns formatted JSON with proper indentation and highlights all corrections made
 */
export function prettifyJSON(content: string): ValidationResult {
  if (!content || content.trim() === '') {
    return {
      isValid: false,
      errors: ['Content is empty'],
      message: 'Please provide JSON content to prettify',
    };
  }

  const corrections: string[] = [];
  let correctedContent = content;

  try {
    // Remove BOM and zero-width characters
    if (correctedContent.charCodeAt(0) === 0xFEFF) {
      correctedContent = correctedContent.slice(1);
      corrections.push('Removed BOM (Byte Order Mark)');
    }
    correctedContent = correctedContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
    if (correctedContent !== content && corrections.length === 0) {
      corrections.push('Removed zero-width invisible characters');
    }

    // Try to parse as-is first
    try {
      const parsed = JSON.parse(correctedContent);

      // Check if it's an object or array
      if (typeof parsed !== 'object' || parsed === null) {
        return {
          isValid: false,
          errors: ['JSON must be an object or array, not a primitive value'],
          message: 'Invalid JSON structure',
        };
      }

      // Successfully parsed - format it
      const prettified = JSON.stringify(parsed, null, 2);
      const lines = prettified.split('\n').length;
      const sizeInKB = (new Blob([prettified]).size / 1024).toFixed(2);
      const type = Array.isArray(parsed) ? 'Array' : 'Object';

      return {
        isValid: true,
        errors: [],
        message: corrections.length > 0
          ? `Valid JSON (${type}, ${lines} lines, ${sizeInKB} KB) - ${corrections.length} correction(s) applied`
          : `Valid JSON (${type}, ${lines} lines, ${sizeInKB} KB)`,
        prettified,
        corrections: corrections.length > 0 ? corrections : undefined,
      };
    } catch {
      // Parsing failed - try to fix common issues

      // 1. Fix trailing commas
      const trailingCommaFixed = correctedContent
        .replace(/,(\s*[}\]])/g, '$1');

      if (trailingCommaFixed !== correctedContent) {
        corrections.push('Removed trailing commas before closing brackets/braces');
        correctedContent = trailingCommaFixed;
      }

      // 2. Fix missing quotes around keys (common JS object notation)
      const unquotedKeyFixed = correctedContent
        .replace(/(\{|,)\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

      if (unquotedKeyFixed !== correctedContent) {
        corrections.push('Added quotes around unquoted object keys');
        correctedContent = unquotedKeyFixed;
      }

      // 3. Fix single quotes to double quotes
      const singleQuoteFixed = correctedContent
        .replace(/'([^']*)'/g, '"$1"');

      if (singleQuoteFixed !== correctedContent) {
        corrections.push('Converted single quotes to double quotes');
        correctedContent = singleQuoteFixed;
      }

      // 4. Fix missing commas between properties
      const missingCommaFixed = correctedContent
        .replace(/"\s*\n\s*"/g, '",\n"')
        .replace(/}\s*\n\s*"/g, '},\n"')
        .replace(/]\s*\n\s*"/g, '],\n"');

      if (missingCommaFixed !== correctedContent) {
        corrections.push('Added missing commas between properties');
        correctedContent = missingCommaFixed;
      }

      // 5. Fix undefined/NaN/Infinity (not valid JSON)
      const undefinedFixed = correctedContent
        .replace(/:\s*undefined\s*([,}\]])/g, ':null$1')
        .replace(/:\s*NaN\s*([,}\]])/g, ':null$1')
        .replace(/:\s*Infinity\s*([,}\]])/g, ':null$1');

      if (undefinedFixed !== correctedContent) {
        corrections.push('Replaced undefined/NaN/Infinity with null');
        correctedContent = undefinedFixed;
      }

      // 6. Fix comments (not valid in JSON)
      const commentFixed = correctedContent
        .replace(/\/\/[^\n]*/g, '')  // Single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '');  // Multi-line comments

      if (commentFixed !== correctedContent) {
        corrections.push('Removed comments (JSON does not support comments)');
        correctedContent = commentFixed;
      }

      // Try parsing again after corrections
      try {
        const parsed = JSON.parse(correctedContent);

        if (typeof parsed !== 'object' || parsed === null) {
          return {
            isValid: false,
            errors: ['JSON must be an object or array, not a primitive value'],
            message: 'Invalid JSON structure',
          };
        }

        const prettified = JSON.stringify(parsed, null, 2);
        const lines = prettified.split('\n').length;
        const sizeInKB = (new Blob([prettified]).size / 1024).toFixed(2);
        const type = Array.isArray(parsed) ? 'Array' : 'Object';

        return {
          isValid: true,
          errors: [],
          message: `Valid JSON (${type}, ${lines} lines, ${sizeInKB} KB) - ${corrections.length} correction(s) applied`,
          prettified,
          corrections,
        };
      } catch (secondError) {
        // Still failed after corrections
        const errorMessage = secondError instanceof Error ? secondError.message : 'Unknown error';
        return {
          isValid: false,
          errors: [errorMessage],
          message: corrections.length > 0
            ? `Invalid JSON (${corrections.length} correction(s) attempted but parsing still failed)`
            : 'Invalid JSON',
          corrections: corrections.length > 0 ? corrections : undefined,
        };
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      isValid: false,
      errors: [errorMessage],
      message: 'Error processing JSON',
      corrections: corrections.length > 0 ? corrections : undefined,
    };
  }
}

/**
 * Prettifies and validates XML with proper indentation
 * Returns formatted XML with proper indentation
 */
export function prettifyXML(content: string): ValidationResult {
  if (!content || content.trim() === '') {
    return {
      isValid: false,
      errors: ['Content is empty'],
      message: 'Please provide XML content to prettify',
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

    // Format XML with indentation
    const serializer = new XMLSerializer();
    let formatted = serializer.serializeToString(xmlDoc);

    // Add proper indentation (2 spaces)
    const PADDING = '  ';
    const reg = /(>)(<)(\/*)/g;
    formatted = formatted.replace(reg, '$1\n$2$3');

    let pad = 0;
    formatted = formatted.split('\n').map((node) => {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/)) {
        if (pad !== 0) {
          pad -= 1;
        }
      } else if (node.match(/^<\w([^>]*[^/])?>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }

      const padding = PADDING.repeat(pad);
      pad += indent;

      return padding + node;
    }).join('\n');

    const lines = formatted.split('\n').length;
    const sizeInKB = (new Blob([formatted]).size / 1024).toFixed(2);
    const rootElement = xmlDoc.documentElement.nodeName;

    return {
      isValid: true,
      errors: [],
      message: `Valid XML (${rootElement}, ${lines} lines, ${sizeInKB} KB)`,
      prettified: formatted,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      isValid: false,
      errors: [errorMessage],
      message: 'Error processing XML',
    };
  }
}

/**
 * Prettifies text with normalized line endings
 * Returns text with consistent line endings
 */
export function prettifyText(content: string): ValidationResult {
  if (!content || content.trim() === '') {
    return {
      isValid: false,
      errors: ['Content is empty'],
      message: 'Please provide text content to prettify',
    };
  }

  try {
    // Normalize line endings to \n
    let formatted = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Remove trailing whitespace from each line
    formatted = formatted.split('\n').map(line => line.trimEnd()).join('\n');

    // Remove trailing empty lines
    formatted = formatted.replace(/\n+$/, '\n');

    const lines = formatted.split('\n').length;
    const sizeInKB = (new Blob([formatted]).size / 1024).toFixed(2);

    return {
      isValid: true,
      errors: [],
      message: `Text formatted (${lines} lines, ${sizeInKB} KB)`,
      prettified: formatted,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      isValid: false,
      errors: [errorMessage],
      message: 'Error processing text',
    };
  }
}

/**
 * Downloads content as a file
 */
export function downloadContent(content: string, filename: string): void {
  if (!content || content.trim() === '') {
    return;
  }

  // Use application/octet-stream to force download without program association
  // This ensures files open with default text editor, not browser
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
// trigger rebuild
