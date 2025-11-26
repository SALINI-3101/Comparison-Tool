// Web Worker for handling heavy comparison operations
// This runs in a separate thread to prevent UI blocking

// Import the comparison functions (we'll inline them here since workers can't import ES modules easily)
self.onmessage = function(e) {
  const { type, data } = e.data;

  try {
    let result;

    switch(type) {
      case 'compareJSON':
        result = compareJSON(data.left, data.right, data.options);
        break;
      case 'compareXML':
        result = compareXML(data.left, data.right, data.options);
        break;
      case 'compareText':
        result = compareText(data.left, data.right, data.options);
        break;
      default:
        throw new Error('Unknown comparison type');
    }

    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message || 'Comparison failed'
    });
  }
};

// Copy all the comparison utility functions here
// (This is a simplified version - in production, you'd want to properly share code)

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;

  const matrix = [];
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
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const levenshteinDistance = matrix[str1.length][str2.length];
  return 1 - (levenshteinDistance / maxLength);
}

function computeDiff(leftLines, rightLines, options) {
  const normalizeForComparison = (line) => {
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

  const m = leftLines.length;
  const n = rightLines.length;
  const lcs = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (leftNormalized[i - 1] === rightNormalized[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  const result = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && leftNormalized[i - 1] === rightNormalized[j - 1]) {
      result.unshift({
        type: 'keep',
        leftIndex: i - 1,
        rightIndex: j - 1,
        line: leftLines[i - 1]
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      result.unshift({
        type: 'add',
        rightIndex: j - 1,
        line: rightLines[j - 1]
      });
      j--;
    } else if (i > 0) {
      result.unshift({
        type: 'remove',
        leftIndex: i - 1,
        line: leftLines[i - 1]
      });
      i--;
    }
  }

  // Post-process for modifications
  const processed = [];
  let idx = 0;

  while (idx < result.length) {
    const current = result[idx];

    if (current.type !== 'remove') {
      processed.push(current);
      idx++;
      continue;
    }

    const removes = [];
    while (idx < result.length && result[idx].type === 'remove') {
      removes.push(result[idx]);
      idx++;
    }

    const adds = [];
    while (idx < result.length && result[idx].type === 'add') {
      adds.push(result[idx]);
      idx++;
    }

    if (removes.length > 0 && adds.length > 0) {
      const usedAdds = new Set();
      const usedRemoves = new Set();

      for (let r = 0; r < removes.length; r++) {
        if (usedRemoves.has(r)) continue;

        const removeOp = removes[r];
        const leftLine = leftLines[removeOp.leftIndex];

        let bestMatch = -1;
        let bestSimilarity = 0.5; // Lowered from 0.7 to 0.5 - better detection of whitespace-only changes

        for (let a = 0; a < adds.length; a++) {
          if (usedAdds.has(a)) continue;

          const addOp = adds[a];
          const rightLine = rightLines[addOp.rightIndex];
          const similarity = calculateSimilarity(leftLine, rightLine);

          // Special handling: if lines are identical after removing whitespace, treat as high similarity
          const leftTrimmed = leftLine.replace(/\s+/g, ' ').trim();
          const rightTrimmed = rightLine.replace(/\s+/g, ' ').trim();
          const effectiveSimilarity = leftTrimmed === rightTrimmed ? 0.95 : similarity;

          if (effectiveSimilarity > bestSimilarity) {
            bestSimilarity = effectiveSimilarity;
            bestMatch = a;
          }
        }

        if (bestMatch >= 0) {
          const addOp = adds[bestMatch];
          const rightLine = rightLines[addOp.rightIndex];

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

      for (let r = 0; r < removes.length; r++) {
        if (!usedRemoves.has(r)) {
          processed.push(removes[r]);
        }
      }

      for (let a = 0; a < adds.length; a++) {
        if (!usedAdds.has(a)) {
          processed.push(adds[a]);
        }
      }
    } else {
      processed.push(...removes);
      processed.push(...adds);
    }
  }

  return processed;
}

function sortObjectKeys(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  if (typeof obj === 'object') {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = sortObjectKeys(obj[key]);
    }
    return sorted;
  }
  return obj;
}

function sortArrays(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    const processed = obj.map(sortArrays);
    return processed.sort((a, b) => {
      if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      return aStr.localeCompare(bStr);
    });
  }
  if (typeof obj === 'object') {
    const sorted = {};
    for (const key of Object.keys(obj)) {
      sorted[key] = sortArrays(obj[key]);
    }
    return sorted;
  }
  return obj;
}

function highlightJSONDifference(line, compareLine, options) {
  if (!line && !compareLine) return '';
  if (!line) return escapeHtml('(empty line)');
  if (!compareLine) return escapeHtml(line);
  if (line.length > 500) return escapeHtml(line);

  let result = '';
  let inDiff = false;
  let diffStart = -1;

  for (let i = 0; i < line.length; i++) {
    const lineChar = line[i];
    const compareChar = i < compareLine.length ? compareLine[i] : '';
    const lineCharCompare = options.caseSensitive ? lineChar : lineChar.toLowerCase();
    const compareCharCompare = options.caseSensitive ? compareChar : compareChar.toLowerCase();

    if (i < compareLine.length && lineCharCompare === compareCharCompare) {
      if (inDiff) {
        result += '<mark>' + escapeHtml(line.substring(diffStart, i)) + '</mark>';
        inDiff = false;
      }
      result += escapeHtml(line[i]);
    } else {
      if (!inDiff) {
        diffStart = i;
        inDiff = true;
      }
    }
  }

  if (inDiff) {
    result += '<mark>' + escapeHtml(line.substring(diffStart)) + '</mark>';
  }

  return result;
}

function compareJSONLines(leftLines, rightLines, options) {
  const diffOps = computeDiff(leftLines, rightLines, options);

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

  let leftFullContent = '';
  let rightFullContent = '';
  let leftLineNum = 1;
  let rightLineNum = 1;

  diffOps.forEach((op) => {
    if (op.type === 'keep') {
      const escapedLine = escapeHtml(op.line);
      leftFullContent += `<div class="line-same"><span class="line-number">${leftLineNum}</span>${escapedLine}</div>\n`;
      rightFullContent += `<div class="line-same"><span class="line-number">${rightLineNum}</span>${escapedLine}</div>\n`;
      leftLineNum++;
      rightLineNum++;
    } else if (op.type === 'modify') {
      const highlightedLeft = highlightJSONDifference(op.line, op.rightLine || '', { caseSensitive: true, ignoreWhitespace: false });
      const highlightedRight = highlightJSONDifference(op.rightLine || '', op.line, { caseSensitive: true, ignoreWhitespace: false });
      leftFullContent += `<div class="line-modified"><span class="line-number">${leftLineNum}</span>${highlightedLeft}</div>\n`;
      rightFullContent += `<div class="line-modified"><span class="line-number">${rightLineNum}</span>${highlightedRight}</div>\n`;
      leftLineNum++;
      rightLineNum++;
    } else if (op.type === 'remove') {
      const escapedLine = escapeHtml(op.line);
      leftFullContent += `<div class="line-removed"><span class="line-number">${leftLineNum}</span>${escapedLine}</div>\n`;
      leftLineNum++;
    } else if (op.type === 'add') {
      const escapedLine = escapeHtml(op.line);
      rightFullContent += `<div class="line-added"><span class="line-number">${rightLineNum}</span>${escapedLine}</div>\n`;
      rightLineNum++;
    }
  });

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

function compareJSON(leftContent, rightContent, options = {}) {
  if (!leftContent || !rightContent) {
    return {
      areEqual: false,
      differences: [],
      message: 'Both left and right content must be provided',
    };
  }

  try {
    const leftObj = JSON.parse(leftContent);
    const rightObj = JSON.parse(rightContent);

    let leftFormatted;
    let rightFormatted;

    const needsTransformation = options.ignoreKeyOrder || options.ignoreArrayOrder || options.ignoreWhitespace;

    if (needsTransformation) {
      let leftTransformed = leftObj;
      let rightTransformed = rightObj;

      if (options.ignoreKeyOrder) {
        leftTransformed = sortObjectKeys(leftTransformed);
        rightTransformed = sortObjectKeys(rightTransformed);
      }

      if (options.ignoreArrayOrder) {
        leftTransformed = sortArrays(leftTransformed);
        rightTransformed = sortArrays(rightTransformed);
      }

      if (options.ignoreWhitespace) {
        leftFormatted = JSON.stringify(leftTransformed, null, 2);
        rightFormatted = JSON.stringify(rightTransformed, null, 2);
      } else {
        const leftIsCompact = !leftContent.includes('\n');
        const rightIsCompact = !rightContent.includes('\n');
        leftFormatted = leftIsCompact ? JSON.stringify(leftTransformed) : JSON.stringify(leftTransformed, null, 2);
        rightFormatted = rightIsCompact ? JSON.stringify(rightTransformed) : JSON.stringify(rightTransformed, null, 2);
      }
    } else {
      leftFormatted = leftContent;
      rightFormatted = rightContent;
    }

    const leftLines = leftFormatted.split('\n');
    const rightLines = rightFormatted.split('\n');

    // For large files (>1000 lines), use fast simple comparison
    if (leftLines.length > 1000 || rightLines.length > 1000) {
      return fastCompare(leftLines, rightLines);
    }

    const { differences, diffCount, statistics } = compareJSONLines(leftLines, rightLines, options);

    return {
      areEqual: diffCount === 0,
      differences,
      message: diffCount === 0 ? '' : `Found ${diffCount} line(s) with differences`,
      statistics,
    };
  } catch (error) {
    return {
      areEqual: false,
      differences: [],
      message: `Error comparing JSON: ${error.message}`,
    };
  }
}

// Fast comparison for large files - shows actual line-by-line differences with proper add/remove/modify detection
function fastCompare(leftLines, rightLines) {
  const differences = [];
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;
  const maxToShow = 50;

  // Handle different lengths - show added/removed lines
  if (leftLines.length !== rightLines.length) {
    const maxLines = Math.max(leftLines.length, rightLines.length);

    for (let i = 0; i < maxLines && differences.length < maxToShow; i++) {
      const leftLine = i < leftLines.length ? leftLines[i] : null;
      const rightLine = i < rightLines.length ? rightLines[i] : null;

      if (leftLine === null) {
        // Line only exists in right (added)
        addedCount++;
        differences.push({
          path: `Line ${i + 1}`,
          leftValue: '',
          rightValue: rightLine,
          type: 'added',
        });
      } else if (rightLine === null) {
        // Line only exists in left (removed)
        removedCount++;
        differences.push({
          path: `Line ${i + 1}`,
          leftValue: leftLine,
          rightValue: '',
          type: 'removed',
        });
      } else if (leftLine !== rightLine) {
        // Both exist but different (modified)
        modifiedCount++;
        differences.push({
          path: `Line ${i + 1}`,
          leftValue: leftLine,
          rightValue: rightLine,
          type: 'modified',
        });
      }
    }

    const totalDiffs = addedCount + removedCount + modifiedCount;
    return {
      areEqual: false,
      differences,
      message: `Found ${totalDiffs} difference(s): ${addedCount} added, ${removedCount} removed, ${modifiedCount} modified${totalDiffs >= maxToShow ? ' (showing first 50)' : ''}`,
      statistics: { added: addedCount, removed: removedCount, modified: modifiedCount },
    };
  }

  // Same length - just compare line by line
  for (let i = 0; i < leftLines.length && differences.length < maxToShow; i++) {
    if (leftLines[i] !== rightLines[i]) {
      modifiedCount++;
      differences.push({
        path: `Line ${i + 1}`,
        leftValue: leftLines[i],
        rightValue: rightLines[i],
        type: 'modified',
      });
    }
  }

  if (differences.length === 0) {
    return {
      areEqual: true,
      differences: [],
      message: '',
      statistics: { added: 0, removed: 0, modified: 0 },
    };
  }

  return {
    areEqual: false,
    differences,
    message: `Found ${modifiedCount} modified line(s)${modifiedCount >= maxToShow ? ' (showing first 50)' : ''}`,
    statistics: { added: 0, removed: 0, modified: modifiedCount },
  };
}

function compareXML(leftContent, rightContent, options = {}) {
  if (!leftContent || !rightContent) {
    return {
      areEqual: false,
      differences: [],
      message: 'Both left and right content must be provided',
    };
  }

  try {
    // Split into lines for line-by-line comparison
    const leftLines = leftContent.split('\n');
    const rightLines = rightContent.split('\n');

    // For large files (>1000 lines), use fast simple comparison
    if (leftLines.length > 1000 || rightLines.length > 1000) {
      return fastCompare(leftLines, rightLines);
    }

    // Use the same comparison logic as JSON for smaller files
    const { differences, diffCount, statistics } = compareJSONLines(leftLines, rightLines, options);

    return {
      areEqual: diffCount === 0,
      differences,
      message: diffCount === 0 ? '' : `Found ${diffCount} line(s) with differences`,
      statistics,
    };
  } catch (error) {
    return {
      areEqual: false,
      differences: [],
      message: `Error comparing XML: ${error.message}`,
    };
  }
}

function compareText(leftContent, rightContent, options = {}) {
  if (!leftContent && !rightContent) {
    return {
      areEqual: true,
      differences: [],
      message: 'Both contents are empty',
    };
  }

  const leftLines = leftContent.split('\n');
  const rightLines = rightContent.split('\n');

  // For large files (>1000 lines), use fast simple comparison
  if (leftLines.length > 1000 || rightLines.length > 1000) {
    return fastCompare(leftLines, rightLines);
  }

  const { differences, diffCount, statistics } = compareJSONLines(leftLines, rightLines, options);

  return {
    areEqual: diffCount === 0,
    differences,
    message: diffCount === 0 ? '' : `Found ${diffCount} line(s) with differences`,
    statistics,
  };
}
