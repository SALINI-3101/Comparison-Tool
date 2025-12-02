// Type definitions for comparison-worker.js

export interface ComparisonOptions {
  ignoreWhitespace?: boolean;
  caseSensitive?: boolean;
  ignoreKeyOrder?: boolean;
  ignoreArrayOrder?: boolean;
}

export interface DiffOperation {
  type: 'keep' | 'add' | 'remove' | 'modify';
  leftIndex?: number;
  rightIndex?: number;
  line?: string;
  rightLine?: string;
}

export interface ComparisonStatistics {
  added: number;
  removed: number;
  modified: number;
}

export interface Difference {
  path: string;
  leftValue: string;
  rightValue: string;
  type: 'added' | 'removed' | 'modified';
}

export interface ComparisonResult {
  areEqual: boolean;
  differences: Difference[];
  message: string;
  statistics?: ComparisonStatistics;
  usedProgressiveRendering?: boolean;
}

export interface WorkerMessage {
  type: 'compareJSON' | 'compareXML' | 'compareText';
  data: {
    left: string;
    right: string;
    options?: ComparisonOptions;
  };
}

export interface WorkerResponse {
  success: boolean;
  result?: ComparisonResult;
  error?: string;
  isChunk?: boolean;
  isLastChunk?: boolean;
  chunkNumber?: number;
  totalChunks?: number;
}

export interface Token {
  value: string;
}
