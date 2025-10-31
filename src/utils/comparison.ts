export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  message: string;
}

export interface ComparisonResult {
  areEqual: boolean;
  differences: Difference[];
  message: string;
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
    JSON.parse(content);
    return {
      isValid: true,
      errors: [],
      message: 'Valid JSON',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      isValid: false,
      errors: [errorMessage],
      message: `Invalid JSON: ${errorMessage}`,
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

    return {
      isValid: true,
      errors: [],
      message: 'Valid XML',
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
    let leftObj = JSON.parse(leftContent);
    let rightObj = JSON.parse(rightContent);

    // Store original objects for key order comparison
    const leftOriginal = leftObj;
    const rightOriginal = rightObj;

    // Apply case sensitivity option
    if (!options.caseSensitive) {
      leftObj = normalizeCase(leftObj);
      rightObj = normalizeCase(rightObj);
    }

    // Apply ignore key order option (sort object keys)
    if (options.ignoreKeyOrder) {
      leftObj = sortObjectKeys(leftObj);
      rightObj = sortObjectKeys(rightObj);
    }

    // When ignoreKeyOrder is OFF, check for key order differences
    if (options.ignoreKeyOrder === false) {
      // Create sorted versions to check if only key order differs
      let leftSorted = sortObjectKeys(leftOriginal);
      let rightSorted = sortObjectKeys(rightOriginal);

      // Apply case sensitivity to sorted versions for fair comparison
      if (!options.caseSensitive) {
        leftSorted = normalizeCase(leftSorted);
        rightSorted = normalizeCase(rightSorted);
      }

      // Stringify to compare
      const leftSortedStr = JSON.stringify(leftSorted);
      const rightSortedStr = JSON.stringify(rightSorted);
      const leftStr = JSON.stringify(leftObj);
      const rightStr = JSON.stringify(rightObj);

      // If sorted versions are equal but original order versions are not, it's a key order difference
      if (leftSortedStr === rightSortedStr && leftStr !== rightStr) {
        return {
          areEqual: false,
          differences: [{
            path: 'root',
            leftValue: 'Keys in original order',
            rightValue: 'Keys in different order',
            type: 'modified'
          }],
          message: 'Content differs in key order',
        };
      }
    }

    const differences = findDifferences(leftObj, rightObj, '', options);

    return {
      areEqual: differences.length === 0,
      differences,
      message: differences.length === 0 ? 'Content is identical' : `Found ${differences.length} difference(s)`,
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
    let left = leftContent;
    let right = rightContent;

    if (options.ignoreWhitespace) {
      // Remove all whitespace between tags and normalize internal whitespace
      left = left.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
      right = right.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
    }

    if (!options.caseSensitive) {
      left = left.toLowerCase();
      right = right.toLowerCase();
    }

    const areEqual = left === right;

    return {
      areEqual,
      differences: areEqual ? [] : [{ path: 'root', leftValue: left, rightValue: right, type: 'modified' }],
      message: areEqual ? 'Content is identical' : 'Content differs',
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

  // Split into lines first
  const leftLines = leftContent.split('\n');
  const rightLines = rightContent.split('\n');
  const maxLines = Math.max(leftLines.length, rightLines.length);

  const differences: Difference[] = [];

  // Compare line by line with options applied
  for (let i = 0; i < maxLines; i++) {
    let leftLine = leftLines[i] !== undefined ? leftLines[i] : '';
    let rightLine = rightLines[i] !== undefined ? rightLines[i] : '';

    // Store original lines for display
    const leftOriginal = leftLine;
    const rightOriginal = rightLine;

    // Apply options for comparison
    if (options.ignoreWhitespace) {
      leftLine = leftLine.replace(/\s+/g, ' ').trim();
      rightLine = rightLine.replace(/\s+/g, ' ').trim();
    }

    if (!options.caseSensitive) {
      leftLine = leftLine.toLowerCase();
      rightLine = rightLine.toLowerCase();
    }

    // Check if lines are different after applying options
    if (leftLine !== rightLine) {
      // Find the specific differences for highlighting
      const diff = findTextDifference(leftOriginal, rightOriginal, options);

      differences.push({
        path: `Line ${i + 1}`,
        leftValue: diff.left,
        rightValue: diff.right,
        type: leftOriginal === '' ? 'added' : rightOriginal === '' ? 'removed' : 'modified',
      });
    }
  }

  return {
    areEqual: differences.length === 0,
    differences,
    message: differences.length === 0 ? 'Content is identical' : `Found ${differences.length} line(s) with differences`,
  };
}

/**
 * Helper function to find and highlight differences between two text strings
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function findTextDifference(left: string, right: string, _options: ComparisonOptions): { left: string; right: string } {
  // Return the original strings for display
  return {
    left: left || '(empty line)',
    right: right || '(empty line)',
  };
}

/**
 * Helper function to normalize case for objects
 */
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
 * Helper function to find differences between two objects
 */
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
