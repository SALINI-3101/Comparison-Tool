// Web Worker for handling heavy comparison operations
// This runs in a separate thread to prevent UI blocking
// WORKER VERSION: 2025-12-02-v13-DEBUG-STATISTICS - Debug statistics calculation

console.log('[Worker] Loaded version 2025-12-02-v13-DEBUG-STATISTICS - Debug statistics calculation');

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

// Smart Tiered Diff Algorithm - Use hash-based sliding window for fast comparison
function computeDiff(leftLines, rightLines, options = {}) {
  const startTime = Date.now();
  const m = leftLines.length;
  const n = rightLines.length;

  console.log(`[Worker] Using Fast Hash-Based Sliding Window: ${m} vs ${n} lines...`);
  return computeHashBasedDiff(leftLines, rightLines, options, startTime);
}

// Fast Hash-Based Diff with Sliding Window - O(N) for small diffs, handles line shifts
function computeHashBasedDiff(leftLines, rightLines, options, startTime) {
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

  console.log(`[Worker] Hash-Based: Building hash map for ${n} right lines...`);

  // Build hash map of right file lines (line -> array of indices)
  const rightHashMap = new Map();
  for (let i = 0; i < n; i++) {
    const line = rightNormalized[i];
    if (!rightHashMap.has(line)) {
      rightHashMap.set(line, []);
    }
    rightHashMap.get(line).push(i);
  }

  console.log(`[Worker] Hash-Based: Scanning ${m} left lines with sliding window...`);

  const result = [];
  let leftIdx = 0;
  let rightIdx = 0;

  while (leftIdx < m || rightIdx < n) {
    // Progress logging every 10000 lines
    if (leftIdx % 10000 === 0 && leftIdx > 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const progress = ((leftIdx / m) * 100).toFixed(1);
      console.log(`[Worker] Hash-Based: ${leftIdx}/${m} (${progress}%, ${elapsed}s)`);
    }

    // Handle end cases
    if (leftIdx >= m) {
      result.push({ type: 'add', rightIndex: rightIdx, line: rightLines[rightIdx] });
      rightIdx++;
      continue;
    }
    if (rightIdx >= n) {
      result.push({ type: 'remove', leftIndex: leftIdx, line: leftLines[leftIdx] });
      leftIdx++;
      continue;
    }

    const leftLine = leftNormalized[leftIdx];
    const rightLine = rightNormalized[rightIdx];

    // Perfect match at current position
    if (leftLine === rightLine) {
      result.push({
        type: 'keep',
        leftIndex: leftIdx,
        rightIndex: rightIdx,
        line: leftLines[leftIdx]
      });
      leftIdx++;
      rightIdx++;
      continue;
    }

    // Lines differ - use hash lookup to find where leftLine appears in right file
    const leftLineInRight = rightHashMap.get(leftLine);

    // Check if current right line appears later in left file (within 50 lines)
    let rightLineInLeft = -1;
    const LOOK_AHEAD = 50;
    for (let i = leftIdx + 1; i < Math.min(leftIdx + LOOK_AHEAD, m); i++) {
      if (leftNormalized[i] === rightLine) {
        rightLineInLeft = i;
        break;
      }
    }

    // Decide: was line removed from left, or added to right?
    const leftLineFoundInRight = leftLineInRight && leftLineInRight.length > 0;
    const rightLineFoundInLeft = rightLineInLeft !== -1;

    if (!leftLineFoundInRight && rightLineFoundInLeft) {
      // Left line doesn't exist in right, but right line exists in left
      // This means: left line was REMOVED
      result.push({ type: 'remove', leftIndex: leftIdx, line: leftLines[leftIdx] });
      leftIdx++;
    } else if (leftLineFoundInRight && !rightLineFoundInLeft) {
      // Left line exists in right (later), but right line doesn't exist in left
      // This means: right line was ADDED
      result.push({ type: 'add', rightIndex: rightIdx, line: rightLines[rightIdx] });
      rightIdx++;
    } else if (leftLineFoundInRight && rightLineFoundInLeft) {
      // Both lines exist elsewhere - check which is closer
      const leftDistanceToMatch = leftLineInRight[0] - rightIdx;
      const rightDistanceToMatch = rightLineInLeft - leftIdx;

      if (rightDistanceToMatch <= leftDistanceToMatch) {
        // Right line is closer in left -> left line was removed
        result.push({ type: 'remove', leftIndex: leftIdx, line: leftLines[leftIdx] });
        leftIdx++;
      } else {
        // Left line is closer in right -> right line was added
        result.push({ type: 'add', rightIndex: rightIdx, line: rightLines[rightIdx] });
        rightIdx++;
      }
    } else {
      // Neither line exists elsewhere - they were modified
      const similarity = calculateSimilarity(leftLines[leftIdx], rightLines[rightIdx]);
      if (similarity > 0.5) {
        result.push({
          type: 'modify',
          leftIndex: leftIdx,
          rightIndex: rightIdx,
          leftLine: leftLines[leftIdx],
          rightLine: rightLines[rightIdx]
        });
        leftIdx++;
        rightIdx++;
      } else {
        // Too different - treat as remove + add
        result.push({ type: 'remove', leftIndex: leftIdx, line: leftLines[leftIdx] });
        result.push({ type: 'add', rightIndex: rightIdx, line: rightLines[rightIdx] });
        leftIdx++;
        rightIdx++;
      }
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[Worker] Hash-Based Diff: Complete in ${totalTime}s`);

  return postProcessDiff(result, leftLines, rightLines);
}

// Myers' Diff Algorithm - O(ND) complexity, very fast for files with few differences
// Based on "An O(ND) Difference Algorithm and Its Variations" by Eugene W. Myers
function computeMyersDiffFast(leftLines, rightLines, options, startTime) {
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

  const aLines = leftLines.map(normalizeForComparison);
  const bLines = rightLines.map(normalizeForComparison);
  const N = aLines.length;
  const M = bLines.length;
  const MAX = N + M;

  const v = new Int32Array(2 * MAX + 1);
  const trace = [];

  // Forward search
  for (let d = 0; d <= MAX; d++) {
    const vCopy = new Int32Array(v);
    trace.push(vCopy);

    for (let k = -d; k <= d; k += 2) {
      let x;
      if (k === -d || (k !== d && v[k - 1 + MAX] < v[k + 1 + MAX])) {
        x = v[k + 1 + MAX];
      } else {
        x = v[k - 1 + MAX] + 1;
      }

      let y = x - k;

      // Extend diagonal
      while (x < N && y < M && aLines[x] === bLines[y]) {
        x++;
        y++;
      }

      v[k + MAX] = x;

      if (x >= N && y >= M) {
        // Found the end
        console.log(`[Worker] Myers' Diff: Found solution at d=${d} (${((Date.now() - startTime) / 1000).toFixed(2)}s)`);
        return myersBacktrack(trace, aLines, bLines, leftLines, rightLines, d, MAX);
      }
    }

    // Progress logging
    if (d % 1000 === 0 && d > 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Worker] Myers' Diff: d=${d}, elapsed=${elapsed}s`);
    }
  }

  // Should never reach here
  console.log(`[Worker] Myers' Diff: Failed, fallback to LCS`);
  return computeOptimizedLCS(leftLines, rightLines, options, startTime);
}

function myersBacktrack(trace, aLines, bLines, leftLines, rightLines, d, MAX) {
  const result = [];
  let x = aLines.length;
  let y = bLines.length;

  for (let depth = d; depth >= 0; depth--) {
    const v = trace[depth];
    const k = x - y;

    let prevK;
    if (k === -depth || (k !== depth && v[k - 1 + MAX] < v[k + 1 + MAX])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = v[prevK + MAX];
    const prevY = prevX - prevK;

    // Backtrack through diagonals
    while (x > prevX && y > prevY) {
      x--;
      y--;
      result.unshift({
        type: 'keep',
        leftIndex: x,
        rightIndex: y,
        line: leftLines[x]
      });
    }

    if (depth > 0) {
      if (x === prevX) {
        // Insertion
        y--;
        result.unshift({
          type: 'add',
          rightIndex: y,
          line: rightLines[y]
        });
      } else {
        // Deletion
        x--;
        result.unshift({
          type: 'remove',
          leftIndex: x,
          line: leftLines[x]
        });
      }
    }
  }

  return postProcessDiff(result, leftLines, rightLines);
}

// Optimized LCS - Uses space-efficient approach with progress logging
function computeOptimizedLCS(leftLines, rightLines, options, startTime) {
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

  console.log(`[Worker] Building LCS matrix (${m}x${n})...`);

  // Build LCS matrix with progress logging
  const lcs = new Array(m + 1);
  for (let i = 0; i <= m; i++) {
    lcs[i] = new Uint32Array(n + 1);
  }

  for (let i = 1; i <= m; i++) {
    // Progress logging every 1000 rows
    if (i % 1000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const progress = ((i / m) * 100).toFixed(1);
      console.log(`[Worker] LCS matrix: row ${i}/${m} (${progress}%, ${elapsed}s)`);
    }

    for (let j = 1; j <= n; j++) {
      if (leftNormalized[i - 1] === rightNormalized[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }

  console.log(`[Worker] LCS matrix complete, backtracking...`);

  // Backtrack to generate diff
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

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[Worker] Optimized LCS: Complete in ${totalTime}s`);
  return postProcessDiff(result, leftLines, rightLines);
}

// Block-based LCS for large files (>= 5000 lines)
// Strategy: Scan file line-by-line, when lines match keep scanning, when they differ use LCS on small region
function computeBlockBasedLCS(leftLines, rightLines, options, startTime) {
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

  const result = [];
  let leftIdx = 0;
  let rightIdx = 0;

  console.log(`[Worker] Block-Based: Scanning ${m} vs ${n} lines...`);

  while (leftIdx < m || rightIdx < n) {
    // Progress logging every 5000 lines
    if (leftIdx % 5000 === 0 && leftIdx > 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Worker] Block-Based: Scanned ${leftIdx}/${m} lines (${elapsed}s)`);
    }

    // Handle end cases
    if (leftIdx >= m) {
      result.push({ type: 'add', rightIndex: rightIdx, line: rightLines[rightIdx] });
      rightIdx++;
      continue;
    }
    if (rightIdx >= n) {
      result.push({ type: 'remove', leftIndex: leftIdx, line: leftLines[leftIdx] });
      leftIdx++;
      continue;
    }

    // Check if current lines match
    if (leftNormalized[leftIdx] === rightNormalized[rightIdx]) {
      result.push({
        type: 'keep',
        leftIndex: leftIdx,
        rightIndex: rightIdx,
        line: leftLines[leftIdx]
      });
      leftIdx++;
      rightIdx++;
      continue;
    }

    // Lines differ - find next sync point within 100 lines
    const SYNC_SEARCH = 100;
    let syncFound = false;

    for (let dist = 1; dist <= SYNC_SEARCH; dist++) {
      // Check if skipping left line gives us a match (line was removed)
      if (leftIdx + dist < m && leftNormalized[leftIdx + dist] === rightNormalized[rightIdx]) {
        // Found sync point - removed 'dist' lines from left
        for (let i = 0; i < dist; i++) {
          result.push({ type: 'remove', leftIndex: leftIdx, line: leftLines[leftIdx] });
          leftIdx++;
        }
        syncFound = true;
        break;
      }

      // Check if skipping right line gives us a match (line was added)
      if (rightIdx + dist < n && leftNormalized[leftIdx] === rightNormalized[rightIdx + dist]) {
        // Found sync point - added 'dist' lines to right
        for (let i = 0; i < dist; i++) {
          result.push({ type: 'add', rightIndex: rightIdx, line: rightLines[rightIdx] });
          rightIdx++;
        }
        syncFound = true;
        break;
      }
    }

    if (syncFound) continue;

    // No simple sync point - use LCS on small region (200 lines)
    const regionSize = 200;
    const leftBlock = leftLines.slice(leftIdx, Math.min(leftIdx + regionSize, m));
    const rightBlock = rightLines.slice(rightIdx, Math.min(rightIdx + regionSize, n));

    console.log(`[Worker] Block-Based: Applying LCS to region at line ${leftIdx} (${leftBlock.length}x${rightBlock.length})`);

    const blockResult = computeStandardLCS(leftBlock, rightBlock, options, Date.now());

    // Adjust indices
    let maxLeftProcessed = 0;
    let maxRightProcessed = 0;

    for (const op of blockResult) {
      if (op.leftIndex !== undefined) {
        maxLeftProcessed = Math.max(maxLeftProcessed, op.leftIndex + 1);
        op.leftIndex += leftIdx;
      }
      if (op.rightIndex !== undefined) {
        maxRightProcessed = Math.max(maxRightProcessed, op.rightIndex + 1);
        op.rightIndex += rightIdx;
      }
      result.push(op);
    }

    leftIdx += maxLeftProcessed;
    rightIdx += maxRightProcessed;
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[Worker] Block-Based LCS: Complete in ${totalTime}s`);
  return postProcessDiff(result, leftLines, rightLines);
}

// Post-process diff results to detect modifications with enhanced multi-level similarity detection
function postProcessDiff(result, leftLines, rightLines) {
  // Group consecutive removes and adds to detect modifications
  const processed = [];
  let idx = 0;

  while (idx < result.length) {
    const current = result[idx];

    if (current.type !== 'remove') {
      processed.push(current);
      idx++;
      continue;
    }

    // Collect consecutive removes
    const removes = [];
    while (idx < result.length && result[idx].type === 'remove') {
      removes.push(result[idx]);
      idx++;
    }

    // Collect consecutive adds
    const adds = [];
    while (idx < result.length && result[idx].type === 'add') {
      adds.push(result[idx]);
      idx++;
    }

    // If we have both removes and adds, try to pair them as modifications
    if (removes.length > 0 && adds.length > 0) {
      const usedAdds = new Set();
      const usedRemoves = new Set();

      // Try to pair similar lines as modifications with enhanced detection
      for (let r = 0; r < removes.length; r++) {
        if (usedRemoves.has(r)) continue;

        const removeOp = removes[r];
        const leftLine = leftLines[removeOp.leftIndex];

        let bestMatch = -1;
        let bestSimilarity = 0.3; // Lowered from 0.5 to 0.3 for better detection

        for (let a = 0; a < adds.length; a++) {
          if (usedAdds.has(a)) continue;

          const addOp = adds[a];
          const rightLine = rightLines[addOp.rightIndex];
          const similarity = calculateSimilarity(leftLine, rightLine);

          // Level 1: Basic whitespace normalization
          const leftTrimmed = leftLine.replace(/\s+/g, ' ').trim();
          const rightTrimmed = rightLine.replace(/\s+/g, ' ').trim();
          let effectiveSimilarity = leftTrimmed === rightTrimmed ? 0.95 : similarity;

          // Level 2: Aggressive normalization for JSON values
          const aggressiveNormalize = (line) => {
            return line.replace(/":\s*"([^"]*)"/g, (_match, value) => {
              const cleaned = value.replace(/^\s+|\s+$/g, '');
              return '": "' + cleaned + '"';
            }).replace(/\s+/g, ' ').trim();
          };

          const leftAggressive = aggressiveNormalize(leftLine);
          const rightAggressive = aggressiveNormalize(rightLine);

          if (leftAggressive === rightAggressive) {
            effectiveSimilarity = 0.95;
          }

          // Level 3: JSON key matching - boost similarity if same JSON key
          const jsonKeyMatch = leftLine.match(/^\s*"([^"]+)"\s*:/);
          if (jsonKeyMatch) {
            const leftKey = jsonKeyMatch[1];
            const rightKeyMatch = rightLine.match(/^\s*"([^"]+)"\s*:/);
            if (rightKeyMatch && rightKeyMatch[1] === leftKey) {
              effectiveSimilarity = Math.max(effectiveSimilarity, 0.65);
            }
          }

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

      // Add unpaired removes
      for (let r = 0; r < removes.length; r++) {
        if (!usedRemoves.has(r)) {
          processed.push(removes[r]);
        }
      }

      // Add unpaired adds
      for (let a = 0; a < adds.length; a++) {
        if (!usedAdds.has(a)) {
          processed.push(adds[a]);
        }
      }
    } else {
      // No pairing possible, add all removes and adds as-is
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

function highlightJSONDifference(line, compareLine, options = {}) {
  // Inline word-level highlighting for modified lines
  if (!line && !compareLine) return '';
  if (!line) return escapeHtml('(empty line)');
  if (!compareLine) return escapeHtml(line);

  // Skip inline highlighting for very long lines (>300 chars) to improve performance
  if (line.length > 300 || compareLine.length > 300) {
    return escapeHtml(line);
  }

  // Fast word-level diff using simple token comparison
  const tokens1 = tokenizeLine(line);
  const tokens2 = tokenizeLine(compareLine);

  console.log('[Worker] Highlighting line:', line.substring(0, 50));
  console.log('[Worker] Compare line:', compareLine.substring(0, 50));
  console.log('[Worker] Tokens1:', tokens1.map(t => t.value).join('|'));
  console.log('[Worker] Tokens2:', tokens2.map(t => t.value).join('|'));

  let result = '';
  let i = 0, j = 0;

  while (i < tokens1.length || j < tokens2.length) {
    if (i >= tokens1.length) break;
    if (j >= tokens2.length) {
      // Remaining tokens in line1 are different
      while (i < tokens1.length) {
        result += `<mark style="background-color: #fbbf24; padding: 0 1px; border-radius: 1px;">${escapeHtml(tokens1[i].value)}</mark>`;
        i++;
      }
      break;
    }

    const token1 = tokens1[i];
    const token2 = tokens2[j];

    if (token1.value === token2.value) {
      // Tokens match
      result += escapeHtml(token1.value);
      i++;
      j++;
    } else {
      // Tokens differ - use lookahead to find if this is an insertion, deletion, or modification
      const LOOKAHEAD = 5;
      let matchFoundInRight = -1;
      let matchFoundInLeft = -1;

      // Check if current left token appears soon in right
      for (let ahead = 1; ahead <= LOOKAHEAD && j + ahead < tokens2.length; ahead++) {
        if (token1.value === tokens2[j + ahead].value) {
          matchFoundInRight = ahead;
          break;
        }
      }

      // Check if current right token appears soon in left
      for (let ahead = 1; ahead <= LOOKAHEAD && i + ahead < tokens1.length; ahead++) {
        if (token2.value === tokens1[i + ahead].value) {
          matchFoundInLeft = ahead;
          break;
        }
      }

      // Decide what to do based on matches found
      if (matchFoundInRight !== -1 && matchFoundInLeft === -1) {
        // Left token found later in right, so current right token was inserted (right has extra content)
        // Don't highlight left token, just move left pointer
        result += escapeHtml(token1.value);
        i++;
      } else if (matchFoundInLeft !== -1 && matchFoundInRight === -1) {
        // Right token found later in left, so current left token was deleted (left has content that right doesn't)
        // Highlight left token since it's missing on the right side
        result += `<mark style="background-color: #fbbf24; padding: 0 1px; border-radius: 1px;">${escapeHtml(token1.value)}</mark>`;
        i++;
        // Don't increment j - the right side token still needs to be matched
      } else if (matchFoundInRight === -1 && matchFoundInLeft === -1) {
        // Neither token found ahead - it's a substitution/modification
        // Highlight both tokens
        result += `<mark style="background-color: #fbbf24; padding: 0 1px; border-radius: 1px;">${escapeHtml(token1.value)}</mark>`;
        i++;
        j++;
      } else {
        // Both found ahead - pick the closest match
        if (matchFoundInRight <= matchFoundInLeft) {
          // Left token appears sooner in right - treat as insertion on right side
          result += escapeHtml(token1.value);
          i++;
        } else {
          // Right token appears sooner in left - treat as deletion on left side
          result += `<mark style="background-color: #fbbf24; padding: 0 1px; border-radius: 1px;">${escapeHtml(token1.value)}</mark>`;
          i++;
        }
      }
    }
  }

  console.log('[Worker] Final highlighted result:', result.substring(0, 200));
  return result;
}

// Tokenize a line into words and special characters for inline highlighting
function tokenizeLine(line) {
  const tokens = [];
  let current = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    // Special characters that should be separate tokens (excluding space to prevent extra gaps)
    if (char === ':' || char === ',' || char === '"' || char === '{' || char === '}' || char === '[' || char === ']') {
      if (current) {
        tokens.push({ value: current });
        current = '';
      }
      tokens.push({ value: char });
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push({ value: current });
  }

  return tokens;
}

// Ultra-Fast Hybrid Diff: Optimized for very large files with minimal changes
// Strategy: Use line-by-line comparison with smart lookahead for speed, only use LCS for ambiguous small regions
function computeSmartHybridDiff(leftLines, rightLines, options = {}) {
  const startTime = Date.now();

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

  console.log(`[Worker] Ultra-Fast Hybrid: Processing ${leftLines.length} lines...`);

  const result = [];
  let leftIdx = 0;
  let rightIdx = 0;

  // Build index for fast lookups
  const rightIndex = new Map();
  for (let i = 0; i < rightLines.length; i++) {
    const norm = rightNormalized[i];
    if (!rightIndex.has(norm)) {
      rightIndex.set(norm, []);
    }
    rightIndex.get(norm).push(i);
  }

  while (leftIdx < leftLines.length || rightIdx < rightLines.length) {
    // Handle end cases
    if (leftIdx >= leftLines.length) {
      result.push({ type: 'add', rightIndex: rightIdx, line: rightLines[rightIdx] });
      rightIdx++;
      continue;
    }

    if (rightIdx >= rightLines.length) {
      result.push({ type: 'remove', leftIndex: leftIdx, line: leftLines[leftIdx] });
      leftIdx++;
      continue;
    }

    // Fast path: lines match
    if (leftNormalized[leftIdx] === rightNormalized[rightIdx]) {
      result.push({ type: 'keep', leftIndex: leftIdx, rightIndex: rightIdx, line: leftLines[leftIdx] });
      leftIdx++;
      rightIdx++;
      continue;
    }

    // Lines differ - use smart lookahead (optimized for small changes)
    const LOOKAHEAD = 3; // Small lookahead for speed
    let foundStrategy = false;

    // Check next few lines for simple patterns
    for (let ahead = 1; ahead <= LOOKAHEAD && ahead < 10; ahead++) {
      // Check if skipping left line(s) gives us a match
      if (leftIdx + ahead < leftLines.length &&
          leftNormalized[leftIdx + ahead] === rightNormalized[rightIdx]) {
        // Lines were removed from left
        for (let i = 0; i < ahead; i++) {
          result.push({ type: 'remove', leftIndex: leftIdx, line: leftLines[leftIdx] });
          leftIdx++;
        }
        foundStrategy = true;
        break;
      }

      // Check if skipping right line(s) gives us a match
      if (rightIdx + ahead < rightLines.length &&
          leftNormalized[leftIdx] === rightNormalized[rightIdx + ahead]) {
        // Lines were added to right
        for (let i = 0; i < ahead; i++) {
          result.push({ type: 'add', rightIndex: rightIdx, line: rightLines[rightIdx] });
          rightIdx++;
        }
        foundStrategy = true;
        break;
      }
    }

    if (foundStrategy) continue;

    // No simple pattern found - check if this is an isolated change or larger diff region
    // Look for next sync point within reasonable distance
    let syncFound = false;
    const SYNC_SEARCH = 20;

    for (let searchDist = LOOKAHEAD + 1; searchDist < SYNC_SEARCH; searchDist++) {
      if (leftIdx + searchDist < leftLines.length &&
          rightIdx + searchDist < rightLines.length &&
          leftNormalized[leftIdx + searchDist] === rightNormalized[rightIdx + searchDist]) {

        // Found sync point - use LCS only for this small region
        const leftBlock = leftLines.slice(leftIdx, leftIdx + searchDist);
        const rightBlock = rightLines.slice(rightIdx, rightIdx + searchDist);

        console.log(`[Worker] Ultra-Fast: Small diff region (${leftBlock.length}x${rightBlock.length}), using LCS`);

        const blockDiff = computeDiff(leftBlock, rightBlock, options);

        for (const op of blockDiff) {
          if (op.leftIndex !== undefined) op.leftIndex += leftIdx;
          if (op.rightIndex !== undefined) op.rightIndex += rightIdx;
          result.push(op);
        }

        leftIdx += searchDist;
        rightIdx += searchDist;
        syncFound = true;
        break;
      }
    }

    if (syncFound) continue;

    // No sync point found nearby - treat as modification
    result.push({
      type: 'modify',
      leftIndex: leftIdx,
      rightIndex: rightIdx,
      line: leftLines[leftIdx],
      rightLine: rightLines[rightIdx]
    });
    leftIdx++;
    rightIdx++;
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Worker] Ultra-Fast Hybrid: Complete in ${totalTime}s, generated ${result.length} operations`);

  return result;
}

function compareJSONLines(leftLines, rightLines, options) {
  // ALWAYS use pure LCS - it's the ONLY 100% accurate algorithm
  // This is the same algorithm that works correctly for 500KB files
  console.log(`[Worker] compareJSONLines: Using pure LCS for ${leftLines.length} lines (100% accurate, same as 500KB)`);

  const diffOps = computeDiff(leftLines, rightLines, options);
  return processAndRenderDiff(diffOps, leftLines, rightLines, options);
}

function processAndRenderDiff(diffOps, leftLines, rightLines, options) {

  console.log(`[Worker] compareJSONLines: Generated ${diffOps.length} diff operations`);

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

  console.log(`[Worker] Statistics: Added=${addedCount}, Removed=${removedCount}, Modified=${modifiedCount}`);

  const statistics = { added: addedCount, removed: removedCount, modified: modifiedCount };

  if (diffCount === 0) {
    return { differences: [], diffCount: 0, statistics: { added: 0, removed: 0, modified: 0 } };
  }

  // DISABLED: Progressive rendering removed per user request
  // Always build all content at once and show after loader completes
  console.log(`[Worker] Building full content (${diffOps.length} lines)...`);

  // Build all content at once
  const differences = [];
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
      console.log('[Worker] Found MODIFY operation, calling highlightJSONDifference');
      console.log('[Worker] Left line:', op.line);
      console.log('[Worker] Right line:', op.rightLine);
      const highlightedLeft = highlightJSONDifference(op.line, op.rightLine || '', options);
      const highlightedRight = highlightJSONDifference(op.rightLine || '', op.line, options);
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

  console.log(`[Worker] Generated HTML with ${leftLineNum-1} left lines and ${rightLineNum-1} right lines`);

  // Determine primary change type
  let primaryType = 'modified';
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

function compareJSON(leftContent, rightContent, options = {}) {
  if (!leftContent || !rightContent) {
    return {
      areEqual: false,
      differences: [],
      message: 'Both left and right content must be provided',
    };
  }

  try {
    console.log('[Worker] Parsing JSON for normalization...');
    const leftObj = JSON.parse(leftContent);
    const rightObj = JSON.parse(rightContent);
    console.log('[Worker] JSON parsed successfully');

    let leftFormatted;
    let rightFormatted;

    // ALWAYS normalize formatting to ensure consistent comparison
    // Parse and re-stringify to ensure both sides have identical formatting
    console.log('[Worker] Normalizing JSON formatting for accurate comparison');

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

    // Always format both sides identically to avoid false differences from formatting
    leftFormatted = JSON.stringify(leftTransformed, null, 2);
    rightFormatted = JSON.stringify(rightTransformed, null, 2);

    const leftLines = leftFormatted.split('\n');
    const rightLines = rightFormatted.split('\n');

    // compareJSONLines now handles progressive rendering for large files internally
    const result = compareJSONLines(leftLines, rightLines, options);

    // If progressive rendering was used, chunks were already sent via postMessage
    if (result.usedProgressiveRendering) {
      return {
        areEqual: false,
        differences: [],
        message: 'Progressive rendering in progress...',
        statistics: result.statistics,
      };
    }

    const { differences, diffCount, statistics } = result;

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

// Hybrid diff algorithm - combines fast hash-based scanning with accurate LCS
// 1. Quickly scan to find blocks with matching/different content
// 2. Apply LCS only to blocks with differences
// This gives 100% accuracy while being fast for large files
function computeHybridDiff(leftLines, rightLines, options = {}) {
  console.log('[Worker] Hybrid diff: Starting block-based scan...');

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

  const BLOCK_SIZE = 100; // Process in blocks of 100 lines
  const result = [];
  let leftIdx = 0;
  let rightIdx = 0;

  while (leftIdx < leftLines.length || rightIdx < rightLines.length) {
    // Handle end cases first
    if (leftIdx >= leftLines.length) {
      // Only right lines remaining - all are additions
      while (rightIdx < rightLines.length) {
        result.push({
          type: 'add',
          rightIndex: rightIdx,
          line: rightLines[rightIdx]
        });
        rightIdx++;
      }
      break;
    }

    if (rightIdx >= rightLines.length) {
      // Only left lines remaining - all are removals
      while (leftIdx < leftLines.length) {
        result.push({
          type: 'remove',
          leftIndex: leftIdx,
          line: leftLines[leftIdx]
        });
        leftIdx++;
      }
      break;
    }

    // Check if next block of lines match exactly
    let blockMatches = true;
    let blockEndLeft = Math.min(leftIdx + BLOCK_SIZE, leftLines.length);
    let blockEndRight = Math.min(rightIdx + BLOCK_SIZE, rightLines.length);

    // Quick check: if block sizes differ, they don't match
    if ((blockEndLeft - leftIdx) !== (blockEndRight - rightIdx)) {
      blockMatches = false;
    } else {
      // Check if all lines in block match
      for (let i = 0; i < (blockEndLeft - leftIdx); i++) {
        if (normalizeForComparison(leftLines[leftIdx + i]) !== normalizeForComparison(rightLines[rightIdx + i])) {
          blockMatches = false;
          break;
        }
      }
    }

    if (blockMatches) {
      // Block matches - add all as 'keep'
      for (let i = leftIdx; i < blockEndLeft; i++) {
        result.push({
          type: 'keep',
          leftIndex: i,
          rightIndex: rightIdx + (i - leftIdx),
          line: leftLines[i]
        });
      }
      leftIdx = blockEndLeft;
      rightIdx = blockEndRight;
      console.log(`[Worker] Hybrid diff: Block ${Math.floor(leftIdx/BLOCK_SIZE)} matched (lines ${leftIdx - BLOCK_SIZE}-${leftIdx})`);
    } else {
      // Block has differences - use LCS on this block only
      const leftBlock = leftLines.slice(leftIdx, Math.min(leftIdx + BLOCK_SIZE * 2, leftLines.length));
      const rightBlock = rightLines.slice(rightIdx, Math.min(rightIdx + BLOCK_SIZE * 2, rightLines.length));

      console.log(`[Worker] Hybrid diff: Applying LCS to block at line ${leftIdx} (${leftBlock.length} x ${rightBlock.length} lines)`);

      const blockDiff = computeDiff(leftBlock, rightBlock, options);

      // Track how many lines we actually processed
      let maxLeftProcessed = -1;
      let maxRightProcessed = -1;

      // Adjust indices to match original positions and track progress
      for (const op of blockDiff) {
        if (op.leftIndex !== undefined) {
          op.leftIndex += leftIdx;
          maxLeftProcessed = Math.max(maxLeftProcessed, op.leftIndex - leftIdx);
        }
        if (op.rightIndex !== undefined) {
          op.rightIndex += rightIdx;
          maxRightProcessed = Math.max(maxRightProcessed, op.rightIndex - rightIdx);
        }
        result.push(op);
      }

      // Move indices based on what was actually processed
      leftIdx += (maxLeftProcessed + 1);
      rightIdx += (maxRightProcessed + 1);

      console.log(`[Worker] Hybrid diff: Moved indices to left=${leftIdx}, right=${rightIdx}`);
    }
  }

  console.log(`[Worker] Hybrid diff: Complete, generated ${result.length} operations`);
  return result;
}

// Space-optimized diff algorithm - processes in streaming fashion
// Uses extended lookahead to properly detect removals and avoid false modifications
// Memory-efficient: O(1) space instead of O(N*D)
function computeMyersDiff(leftLines, rightLines, options = {}) {
  console.log('[Worker] Space-optimized diff: Starting...');

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

  // Build index of right lines for fast lookup with positions
  const rightIndex = new Map();
  for (let i = 0; i < rightLines.length; i++) {
    const normalized = normalizeForComparison(rightLines[i]);
    if (!rightIndex.has(normalized)) {
      rightIndex.set(normalized, []);
    }
    rightIndex.get(normalized).push(i);
  }

  const result = [];
  let leftIdx = 0;
  let rightIdx = 0;
  const usedRightIndices = new Set(); // Track which right lines have been matched

  while (leftIdx < leftLines.length || rightIdx < rightLines.length) {
    // Handle end cases
    if (leftIdx >= leftLines.length) {
      result.push({ type: 'add', rightIndex: rightIdx, line: rightLines[rightIdx] });
      rightIdx++;
      continue;
    }

    if (rightIdx >= rightLines.length) {
      result.push({ type: 'remove', leftIndex: leftIdx, line: leftLines[leftIdx] });
      leftIdx++;
      continue;
    }

    const leftNorm = normalizeForComparison(leftLines[leftIdx]);
    const rightNorm = normalizeForComparison(rightLines[rightIdx]);

    // Lines match - keep
    if (leftNorm === rightNorm) {
      result.push({ type: 'keep', leftIndex: leftIdx, rightIndex: rightIdx, line: leftLines[leftIdx] });
      usedRightIndices.add(rightIdx);
      leftIdx++;
      rightIdx++;
      continue;
    }

    // Lines differ - use extended lookahead to detect removals vs modifications
    // Check if current left line exists somewhere ahead in right file (within reasonable distance)
    const LOOKAHEAD = 10; // Look ahead up to 10 lines
    let foundLeftInRight = false;
    let foundRightInLeft = false;

    // Check if left line exists in upcoming right lines
    const rightPositions = rightIndex.get(leftNorm);
    if (rightPositions) {
      for (const pos of rightPositions) {
        if (pos >= rightIdx && pos < rightIdx + LOOKAHEAD && !usedRightIndices.has(pos)) {
          foundLeftInRight = true;
          break;
        }
      }
    }

    // Check if right line exists in upcoming left lines
    for (let i = leftIdx + 1; i < Math.min(leftIdx + LOOKAHEAD, leftLines.length); i++) {
      if (normalizeForComparison(leftLines[i]) === rightNorm) {
        foundRightInLeft = true;
        break;
      }
    }

    // Decision logic:
    // 1. If left exists ahead in right but right doesn't exist ahead in left -> left was removed
    // 2. If right exists ahead in left but left doesn't exist ahead in right -> right was added
    // 3. If neither exists ahead -> true modification
    // 4. If both exist ahead -> look at immediate next line to decide

    if (foundRightInLeft && !foundLeftInRight) {
      // Current left line was removed (right line appears later in left)
      result.push({ type: 'remove', leftIndex: leftIdx, line: leftLines[leftIdx] });
      leftIdx++;
      continue;
    }

    if (foundLeftInRight && !foundRightInLeft) {
      // Current right line was added (left line appears later in right)
      result.push({ type: 'add', rightIndex: rightIdx, line: rightLines[rightIdx] });
      rightIdx++;
      continue;
    }

    // Check immediate next lines for simple patterns
    const nextLeftNorm = leftIdx + 1 < leftLines.length ? normalizeForComparison(leftLines[leftIdx + 1]) : null;
    const nextRightNorm = rightIdx + 1 < rightLines.length ? normalizeForComparison(rightLines[rightIdx + 1]) : null;

    if (nextLeftNorm === rightNorm) {
      // Simple removal: next left matches current right
      result.push({ type: 'remove', leftIndex: leftIdx, line: leftLines[leftIdx] });
      leftIdx++;
      continue;
    }

    if (leftNorm === nextRightNorm) {
      // Simple addition: current left matches next right
      result.push({ type: 'add', rightIndex: rightIdx, line: rightLines[rightIdx] });
      rightIdx++;
      continue;
    }

    // True modification - lines are genuinely different
    result.push({
      type: 'modify',
      leftIndex: leftIdx,
      rightIndex: rightIdx,
      line: leftLines[leftIdx],
      rightLine: rightLines[rightIdx]
    });
    leftIdx++;
    rightIdx++;
  }

  console.log(`[Worker] Space-optimized diff: Generated ${result.length} operations`);
  return result;
}

// Optimized block-based diff algorithm for very large files
// Processes file in blocks, only applying detailed LCS to blocks with differences
// Much faster than previous approach - O(n) scan + O(k) LCS where k = changed lines only
function computeHashBasedDiff(leftLines, rightLines, options = {}) {
  console.log('[Worker] computeHashBasedDiff: Starting optimized block-based algorithm...');

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

  // Build hash map for the right side for quick lookups
  const rightHashMap = new Map();
  for (let i = 0; i < rightLines.length; i++) {
    const hash = normalizeForComparison(rightLines[i]);
    if (!rightHashMap.has(hash)) {
      rightHashMap.set(hash, []);
    }
    rightHashMap.get(hash).push(i);
  }

  const result = [];
  let leftIdx = 0;
  let rightIdx = 0;

  // Process line by line with smart lookahead
  while (leftIdx < leftLines.length || rightIdx < rightLines.length) {
    // If one side is exhausted
    if (leftIdx >= leftLines.length) {
      // Only right lines remaining - all are additions
      result.push({
        type: 'add',
        rightIndex: rightIdx,
        line: rightLines[rightIdx]
      });
      rightIdx++;
      continue;
    }

    if (rightIdx >= rightLines.length) {
      // Only left lines remaining - all are removals
      result.push({
        type: 'remove',
        leftIndex: leftIdx,
        line: leftLines[leftIdx]
      });
      leftIdx++;
      continue;
    }

    const leftHash = normalizeForComparison(leftLines[leftIdx]);
    const rightHash = normalizeForComparison(rightLines[rightIdx]);

    // Case 1: Lines match exactly
    if (leftHash === rightHash) {
      result.push({
        type: 'keep',
        leftIndex: leftIdx,
        rightIndex: rightIdx,
        line: leftLines[leftIdx]
      });
      leftIdx++;
      rightIdx++;
      continue;
    }

    // Case 2: Lines differ - determine if it's remove, add, or modify
    // Check if current left line exists anywhere in the right file
    const leftExistsInRight = rightHashMap.has(leftHash);

    // Check if next line in left matches current line in right (indicates current left was removed)
    if (!leftExistsInRight ||
        (leftIdx + 1 < leftLines.length && normalizeForComparison(leftLines[leftIdx + 1]) === rightHash)) {
      // Current left line was removed (either doesn't exist in right, or next left matches current right)
      result.push({
        type: 'remove',
        leftIndex: leftIdx,
        line: leftLines[leftIdx]
      });
      leftIdx++;
      continue; // Skip to next iteration - compare next left with same right
    }

    // Check if current right line appears in next left line (indicates current right was added)
    if (rightIdx + 1 < rightLines.length && leftHash === normalizeForComparison(rightLines[rightIdx + 1])) {
      // Current right line was added
      result.push({
        type: 'add',
        rightIndex: rightIdx,
        line: rightLines[rightIdx]
      });
      rightIdx++;
      continue; // Skip to next iteration - compare same left with next right
    }

    // Lines are different and don't match next positions - it's a modification
    result.push({
      type: 'modify',
      leftIndex: leftIdx,
      rightIndex: rightIdx,
      line: leftLines[leftIdx],
      rightLine: rightLines[rightIdx]
    });
    leftIdx++;
    rightIdx++;
  }

  console.log(`[Worker] Block-based diff complete: ${result.length} operations`);

  // Apply post-processing to detect modifications with multi-level similarity
  return postProcessDiff(result, leftLines, rightLines);
}

// Fast comparison for large files - uses progressive chunked rendering
// Version: 6.0 - LCS up to 10k lines, optimized hash-based with 1-line lookahead for larger files
function fastCompare(leftLines, rightLines, options = {}) {
  console.log(`[Worker] fastCompare: ${leftLines.length} vs ${rightLines.length} lines`);

  // For very large files (>10000 lines), use hash-based comparison for speed
  // LCS algorithm creates O(n*m) matrix which becomes too slow for 10k+ lines
  const VERY_LARGE_FILE_THRESHOLD = 10000;
  const isVeryLargeFile = leftLines.length > VERY_LARGE_FILE_THRESHOLD || rightLines.length > VERY_LARGE_FILE_THRESHOLD;

  let diffOps;

  if (isVeryLargeFile) {
    // Use hash-based diff for very large files (fast and memory-efficient)
    console.log('[Worker] Using hash-based diff algorithm for very large file...');
    diffOps = computeHashBasedDiff(leftLines, rightLines, options);
    console.log(`[Worker] Hash-based diff completed, generated ${diffOps.length} diff operations`);
  } else {
    // Use proper LCS diff algorithm for smaller files (more accurate)
    console.log('[Worker] Using LCS diff algorithm for accurate comparison...');
    diffOps = computeDiff(leftLines, rightLines, options);
    console.log(`[Worker] LCS diff completed, generated ${diffOps.length} diff operations`);
  }

  console.log('[Worker] Counting statistics...');
  // Count statistics
  let addedCount = 0;
  let removedCount = 0;
  let modifiedCount = 0;

  for (const op of diffOps) {
    if (op.type === 'add') addedCount++;
    else if (op.type === 'remove') removedCount++;
    else if (op.type === 'modify') modifiedCount++;
  }

  console.log(`[Worker] Raw statistics from diff: Added=${addedCount}, Removed=${removedCount}, Modified=${modifiedCount}, Total operations=${diffOps.length}`);

  const statistics = { added: addedCount, removed: removedCount, modified: modifiedCount };
  const totalDiffs = addedCount + removedCount + modifiedCount;

  if (totalDiffs === 0) {
    return {
      areEqual: true,
      differences: [],
      message: '',
      statistics: { added: 0, removed: 0, modified: 0 },
    };
  }

  // PROGRESSIVE RENDERING: Send results in chunks of 200 lines for better performance
  const CHUNK_SIZE = 200;
  let leftLineNum = 1;
  let rightLineNum = 1;

  console.log(`[Worker] Starting progressive rendering in chunks of ${CHUNK_SIZE} lines...`);

  // Process and send chunks
  for (let startIdx = 0; startIdx < diffOps.length; startIdx += CHUNK_SIZE) {
    const endIdx = Math.min(startIdx + CHUNK_SIZE, diffOps.length);
    const chunk = diffOps.slice(startIdx, endIdx);

    const leftChunkLines = [];
    const rightChunkLines = [];

    for (const op of chunk) {
      if (op.type === 'keep') {
        const escapedLine = escapeHtml(op.line);
        leftChunkLines.push(`<div class="line-same"><span class="line-number">${leftLineNum}</span>${escapedLine}</div>`);
        rightChunkLines.push(`<div class="line-same"><span class="line-number">${rightLineNum}</span>${escapedLine}</div>`);
        leftLineNum++;
        rightLineNum++;
      } else if (op.type === 'modify') {
        const highlightedLeft = highlightJSONDifference(op.line, op.rightLine || '', options);
        const highlightedRight = highlightJSONDifference(op.rightLine || '', op.line, options);
        leftChunkLines.push(`<div class="line-modified"><span class="line-number">${leftLineNum}</span>${highlightedLeft}</div>`);
        rightChunkLines.push(`<div class="line-modified"><span class="line-number">${rightLineNum}</span>${highlightedRight}</div>`);
        leftLineNum++;
        rightLineNum++;
      } else if (op.type === 'remove') {
        const escapedLine = escapeHtml(op.line);
        leftChunkLines.push(`<div class="line-removed"><span class="line-number">${leftLineNum}</span>${escapedLine}</div>`);
        rightChunkLines.push(`<div class="line-empty"><span class="line-number"></span></div>`);
        leftLineNum++;
      } else if (op.type === 'add') {
        const escapedLine = escapeHtml(op.line);
        leftChunkLines.push(`<div class="line-empty"><span class="line-number"></span></div>`);
        rightChunkLines.push(`<div class="line-added"><span class="line-number">${rightLineNum}</span>${escapedLine}</div>`);
        rightLineNum++;
      }
    }

    // Send this chunk immediately
    const isLastChunk = endIdx >= diffOps.length;
    const chunkNumber = Math.floor(startIdx / CHUNK_SIZE) + 1;
    const totalChunks = Math.ceil(diffOps.length / CHUNK_SIZE);

    console.log(`[Worker] Sending chunk ${chunkNumber}/${totalChunks} (lines ${startIdx + 1}-${endIdx})`);

    self.postMessage({
      success: true,
      isChunk: true,
      isLastChunk: isLastChunk,
      chunkNumber: chunkNumber,
      totalChunks: totalChunks,
      result: {
        areEqual: false,
        differences: [{
          path: 'Full Document',
          leftValue: leftChunkLines.join(''),
          rightValue: rightChunkLines.join(''),
          type: 'modified',
        }],
        message: isLastChunk ? `Found ${totalDiffs} difference(s)` : `Loading chunk ${chunkNumber}/${totalChunks}...`,
        statistics: isLastChunk ? statistics : { added: 0, removed: 0, modified: 0 },
      }
    });
  }

  console.log('[Worker] Progressive rendering completed');

  // Return a final confirmation (this won't be used, chunks are already sent)
  return {
    areEqual: false,
    differences: [],
    message: `Found ${totalDiffs} difference(s)`,
    statistics,
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

    // compareJSONLines now handles progressive rendering for large files internally
    const result = compareJSONLines(leftLines, rightLines, options);

    // If progressive rendering was used, chunks were already sent via postMessage
    if (result.usedProgressiveRendering) {
      return {
        areEqual: false,
        differences: [],
        message: 'Progressive rendering in progress...',
        statistics: result.statistics,
      };
    }

    const { differences, diffCount, statistics } = result;

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

  // compareJSONLines now handles progressive rendering for large files internally
  const result = compareJSONLines(leftLines, rightLines, options);

  // If progressive rendering was used, chunks were already sent via postMessage
  if (result.usedProgressiveRendering) {
    return {
      areEqual: false,
      differences: [],
      message: 'Progressive rendering in progress...',
      statistics: result.statistics,
    };
  }

  const { differences, diffCount, statistics } = result;

  return {
    areEqual: diffCount === 0,
    differences,
    message: diffCount === 0 ? '' : `Found ${diffCount} line(s) with differences`,
    statistics,
  };
}
