import React, { useState, useContext, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Tabs, TabItem } from '@/components/Tabs';
import { TextArea } from '@/components/TextArea';
import { Toggle } from '@/components/Toggle';

import { ResultsPanel } from '@/components/ResultsPanel';
import { FileUpload } from '@/components/FileUpload';
import { LoadingOverlay } from '@/components/LoadingOverlay';

import { RefreshIcon, PlayIcon, CompareIcon, SunIcon, MoonIcon, DownloadIcon, CopyIcon, ClipboardIcon } from '@/components/Icons';
import { useToast } from '@/components/Toast';
import {
  PageContainer,
  Header,
  HeaderContent,
  Logo,
  HeaderText,
  Title,
  Subtitle,
  ThemeToggleButton,
  ClearButton,
  Content,
  Card,
  InputSection,
  SectionTitle,
  OptionsRow,
  DualEditorContainer,
  ActionButton,
  ValidateButtonGroup,
} from '@/components/ComparisonTool';
import { ThemeContext } from './_app';
import {
  validateJSON,
  validateXML,
  compareJSON,
  compareXML,
  compareText,
  downloadContent,
  prettifyJSON,
  prettifyXML,
  prettifyText,
  ValidationResult,
  ComparisonResult,
} from '@/utils/comparison';

// Helper function to clean hidden characters from stored content (outside component to prevent Fast Refresh issues)
function cleanStoredContent(content: string | null): string {
  if (!content) return '';
  let cleaned = content;
  // Remove BOM if present
  if (cleaned.charCodeAt(0) === 0xFEFF) {
    cleaned = cleaned.slice(1);
  }
  // Remove zero-width characters
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
  return cleaned;
}

export default function ComparisonTool() {
  const { themeMode, toggleTheme } = useContext(ThemeContext);
  const { showError, showSuccess } = useToast();

  // Helper function to save to localStorage (debounced)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipNextSaveRef = useRef<Set<string>>(new Set());

  const saveToLocalStorage = (key: string, value: string) => {
    if (typeof window === 'undefined') return;

    // Skip save if this key is in the skip list (during reset)
    if (skipNextSaveRef.current.has(key)) {
      skipNextSaveRef.current.delete(key);
      return;
    }

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule save after 300ms of no typing
    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Skip saving very large content to localStorage (>100KB) to prevent freezing
        // localStorage has a ~5-10MB limit and saving large strings blocks the UI
        const sizeInKB = new Blob([value]).size / 1024;
        if (sizeInKB > 100) {
          console.log(`[Storage] Skipping localStorage save for ${key} (${sizeInKB.toFixed(2)}KB - too large)`);
          return;
        }
        localStorage.setItem(key, value);
      } catch {
        // Silently fail - localStorage might be disabled or quota exceeded
      }
    }, 300);
  };

  // State for validate modes (separate for each type)
  const [jsonValidateContent, setJsonValidateContent] = useState('');
  const [xmlValidateContent, setXmlValidateContent] = useState('');

  // State for compare modes (separate for each type)
  const [jsonCompareLeft, setJsonCompareLeft] = useState('');
  const [jsonCompareRight, setJsonCompareRight] = useState('');
  const [xmlCompareLeft, setXmlCompareLeft] = useState('');
  const [xmlCompareRight, setXmlCompareRight] = useState('');
  const [textCompareLeft, setTextCompareLeft] = useState('');
  const [textCompareRight, setTextCompareRight] = useState('');

  // State for options - Separate for each tab - Default: Only Case Sensitive is ON, all others OFF
  // JSON Compare options
  const [jsonIgnoreWhitespace, setJsonIgnoreWhitespace] = useState(false);
  const [jsonCaseSensitive, setJsonCaseSensitive] = useState(true);
  const [jsonIgnoreKeyOrder, setJsonIgnoreKeyOrder] = useState(false);
  const [jsonIgnoreArrayOrder, setJsonIgnoreArrayOrder] = useState(false);

  // XML Compare options
  const [xmlIgnoreWhitespace, setXmlIgnoreWhitespace] = useState(false);
  const [xmlCaseSensitive, setXmlCaseSensitive] = useState(true);
  const [xmlIgnoreAttributeOrder, setXmlIgnoreAttributeOrder] = useState(false);

  // Text Compare options
  const [textIgnoreWhitespace, setTextIgnoreWhitespace] = useState(false);
  const [textCaseSensitive, setTextCaseSensitive] = useState(true);

  // State to track prettification status for JSON Compare
  const [jsonLeftPrettified, setJsonLeftPrettified] = useState(false);
  const [jsonRightPrettified, setJsonRightPrettified] = useState(false);

  // State for active tab - Initialize with saved value to prevent flicker
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTab = localStorage.getItem('activeTab');
        return savedTab || 'json-validate';
      } catch {
        return 'json-validate';
      }
    }
    return 'json-validate';
  });

  // Track if initial load is complete
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Load from localStorage after component mounts (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedJsonValidate = cleanStoredContent(localStorage.getItem('jsonValidateContent'));
        const savedXmlValidate = cleanStoredContent(localStorage.getItem('xmlValidateContent'));
        const savedJsonLeft = cleanStoredContent(localStorage.getItem('jsonCompareLeft'));
        const savedJsonRight = cleanStoredContent(localStorage.getItem('jsonCompareRight'));
        const savedXmlLeft = cleanStoredContent(localStorage.getItem('xmlCompareLeft'));
        const savedXmlRight = cleanStoredContent(localStorage.getItem('xmlCompareRight'));
        const savedTextLeft = cleanStoredContent(localStorage.getItem('textCompareLeft'));
        const savedTextRight = cleanStoredContent(localStorage.getItem('textCompareRight'));

        // Load toggle states for each tab
        const savedJsonIgnoreWhitespace = localStorage.getItem('jsonIgnoreWhitespace');
        const savedJsonCaseSensitive = localStorage.getItem('jsonCaseSensitive');
        const savedJsonIgnoreKeyOrder = localStorage.getItem('jsonIgnoreKeyOrder');
        const savedJsonIgnoreArrayOrder = localStorage.getItem('jsonIgnoreArrayOrder');

        const savedXmlIgnoreWhitespace = localStorage.getItem('xmlIgnoreWhitespace');
        const savedXmlCaseSensitive = localStorage.getItem('xmlCaseSensitive');
        const savedXmlIgnoreAttributeOrder = localStorage.getItem('xmlIgnoreAttributeOrder');

        const savedTextIgnoreWhitespace = localStorage.getItem('textIgnoreWhitespace');
        const savedTextCaseSensitive = localStorage.getItem('textCaseSensitive');

        // Set cleaned content (empty string is valid, so no need to check)
        setJsonValidateContent(savedJsonValidate);
        setXmlValidateContent(savedXmlValidate);
        setJsonCompareLeft(savedJsonLeft);
        setJsonCompareRight(savedJsonRight);
        setXmlCompareLeft(savedXmlLeft);
        setXmlCompareRight(savedXmlRight);
        setTextCompareLeft(savedTextLeft);
        setTextCompareRight(savedTextRight);

        // Set JSON toggle states with defaults if not saved
        if (savedJsonIgnoreWhitespace !== null) setJsonIgnoreWhitespace(savedJsonIgnoreWhitespace === 'true');
        if (savedJsonCaseSensitive !== null) setJsonCaseSensitive(savedJsonCaseSensitive === 'true');
        if (savedJsonIgnoreKeyOrder !== null) setJsonIgnoreKeyOrder(savedJsonIgnoreKeyOrder === 'true');
        if (savedJsonIgnoreArrayOrder !== null) setJsonIgnoreArrayOrder(savedJsonIgnoreArrayOrder === 'true');

        // Set XML toggle states with defaults if not saved
        if (savedXmlIgnoreWhitespace !== null) setXmlIgnoreWhitespace(savedXmlIgnoreWhitespace === 'true');
        if (savedXmlCaseSensitive !== null) setXmlCaseSensitive(savedXmlCaseSensitive === 'true');
        if (savedXmlIgnoreAttributeOrder !== null) setXmlIgnoreAttributeOrder(savedXmlIgnoreAttributeOrder === 'true');

        // Set Text toggle states with defaults if not saved
        if (savedTextIgnoreWhitespace !== null) setTextIgnoreWhitespace(savedTextIgnoreWhitespace === 'true');
        if (savedTextCaseSensitive !== null) setTextCaseSensitive(savedTextCaseSensitive === 'true');

        // Mark initial load as complete
        setIsInitialLoadComplete(true);
      } catch {
        // Silently fail - localStorage might be disabled
        setIsInitialLoadComplete(true);
      }
    }
  }, []);

  // Track previous values to detect manual content changes
  const prevJsonLeftRef = useRef(jsonCompareLeft);
  const prevJsonRightRef = useRef(jsonCompareRight);

  // Reset prettification flags when content is manually changed (not by prettify)
  useEffect(() => {
    if (isInitialLoadComplete) {
      // Only reset if content actually changed from previous value
      if (jsonCompareLeft !== prevJsonLeftRef.current) {
        setJsonLeftPrettified(false);
        prevJsonLeftRef.current = jsonCompareLeft;
      }
    }
  }, [jsonCompareLeft, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      // Only reset if content actually changed from previous value
      if (jsonCompareRight !== prevJsonRightRef.current) {
        setJsonRightPrettified(false);
        prevJsonRightRef.current = jsonCompareRight;
      }
    }
  }, [jsonCompareRight, isInitialLoadComplete]);

  // State for results
  const [validationResult, setValidationResult] = useState<ValidationResult | undefined>(undefined);
  const [jsonComparisonResult, setJsonComparisonResult] = useState<ComparisonResult | undefined>(undefined);
  const [xmlComparisonResult, setXmlComparisonResult] = useState<ComparisonResult | undefined>(undefined);
  const [textComparisonResult, setTextComparisonResult] = useState<ComparisonResult | undefined>(undefined);

  // State for loading
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Web Worker for heavy comparisons
  const workerRef = useRef<Worker | null>(null);

  // Refs for accumulating progressive chunks
  const chunkAccumulatorRef = useRef<{
    left: string;
    right: string;
    stats: { added: number; removed: number; modified: number };
  }>({ left: '', right: '', stats: { added: 0, removed: 0, modified: 0 } });

  // Ref for throttling DOM updates with requestAnimationFrame
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<boolean>(false);

  // Helper function to throttle DOM updates using requestAnimationFrame
  const scheduleUpdate = (updateFn: () => void) => {
    if (!pendingUpdateRef.current) {
      pendingUpdateRef.current = true;
      rafIdRef.current = requestAnimationFrame(() => {
        updateFn();
        pendingUpdateRef.current = false;
      });
    }
  };

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Initialize Web Worker with aggressive cache busting
   useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use timestamp + random number for maximum cache busting
      const cacheKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Fetch worker file with no-cache headers and create blob URL
      fetch(`/comparison-worker.js?v=${cacheKey}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
        .then(response => response.text())
        .then(workerCode => {
          const blob = new Blob([workerCode], { type: 'application/javascript' });
          const workerUrl = URL.createObjectURL(blob);
          workerRef.current = new Worker(workerUrl);
          console.log('[Main] Worker initialized successfully with enhanced cache busting');
        })
        .catch(error => {
          console.error('[Main] Failed to load worker:', error);
          // Fallback to direct worker if blob approach fails
          try {
            workerRef.current = new Worker(`/comparison-worker.js?v=${cacheKey}`);
            console.log('[Main] Worker initialized with fallback method');
          } catch (fallbackError) {
            console.error('[Main] Fallback worker also failed:', fallbackError);
          }
        });

      return () => {
        workerRef.current?.terminate();
      };
    }
  }, []);

  // Auto-save to localStorage whenever content changes
  useEffect(() => {
    saveToLocalStorage('jsonValidateContent', jsonValidateContent);
    if (!jsonValidateContent) {
      setValidationResult(prev => prev !== undefined ? undefined : prev);
    }
  }, [jsonValidateContent]);

  useEffect(() => {
    saveToLocalStorage('xmlValidateContent', xmlValidateContent);
    if (!xmlValidateContent) {
      setValidationResult(prev => prev !== undefined ? undefined : prev);
    }
  }, [xmlValidateContent]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('jsonCompareLeft', jsonCompareLeft);
    }
  }, [jsonCompareLeft, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('jsonCompareRight', jsonCompareRight);
    }
  }, [jsonCompareRight, isInitialLoadComplete]);

  // Clear JSON comparison result when input changes (improves performance)
  useEffect(() => {
    if (jsonComparisonResult) {
      setJsonComparisonResult(undefined);
    }
  }, [jsonCompareLeft, jsonCompareRight]);

  // Auto-clear JSON Compare results when either side is empty
  useEffect(() => {
    if (!jsonCompareLeft.trim() || !jsonCompareRight.trim()) {
      setValidationResult(prev => prev !== undefined ? undefined : prev);
      setJsonComparisonResult(prev => prev !== undefined ? undefined : prev);
    }
  }, [jsonCompareLeft, jsonCompareRight]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('xmlCompareLeft', xmlCompareLeft);
    }
  }, [xmlCompareLeft, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('xmlCompareRight', xmlCompareRight);
    }
  }, [xmlCompareRight, isInitialLoadComplete]);

  // Clear XML comparison result when input changes (improves performance)
  useEffect(() => {
    if (xmlComparisonResult) {
      setXmlComparisonResult(undefined);
    }
  }, [xmlCompareLeft, xmlCompareRight]);

  // Auto-clear XML Compare results when either side is empty
  useEffect(() => {
    if (!xmlCompareLeft.trim() || !xmlCompareRight.trim()) {
      setValidationResult(prev => prev !== undefined ? undefined : prev);
      setXmlComparisonResult(prev => prev !== undefined ? undefined : prev);
    }
  }, [xmlCompareLeft, xmlCompareRight]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('textCompareLeft', textCompareLeft);
    }
  }, [textCompareLeft, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('textCompareRight', textCompareRight);
    }
  }, [textCompareRight, isInitialLoadComplete]);

  // Clear Text comparison result when input changes (improves performance)
  useEffect(() => {
    if (textComparisonResult) {
      setTextComparisonResult(undefined);
    }
  }, [textCompareLeft, textCompareRight]);

  // Auto-clear Text Compare results when either side is empty
  useEffect(() => {
    if (!textCompareLeft.trim() || !textCompareRight.trim()) {
      setValidationResult(prev => prev !== undefined ? undefined : prev);
      setTextComparisonResult(prev => prev !== undefined ? undefined : prev);
    }
  }, [textCompareLeft, textCompareRight]);

  useEffect(() => {
    saveToLocalStorage('activeTab', activeTab);
  }, [activeTab]);

  // Save JSON toggle states to localStorage (only after initial load)
  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('jsonIgnoreWhitespace', String(jsonIgnoreWhitespace));
    }
  }, [jsonIgnoreWhitespace, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('jsonCaseSensitive', String(jsonCaseSensitive));
    }
  }, [jsonCaseSensitive, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('jsonIgnoreKeyOrder', String(jsonIgnoreKeyOrder));
    }
  }, [jsonIgnoreKeyOrder, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('jsonIgnoreArrayOrder', String(jsonIgnoreArrayOrder));
    }
  }, [jsonIgnoreArrayOrder, isInitialLoadComplete]);

  // Save XML toggle states to localStorage (only after initial load)
  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('xmlIgnoreWhitespace', String(xmlIgnoreWhitespace));
    }
  }, [xmlIgnoreWhitespace, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('xmlCaseSensitive', String(xmlCaseSensitive));
    }
  }, [xmlCaseSensitive, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('xmlIgnoreAttributeOrder', String(xmlIgnoreAttributeOrder));
    }
  }, [xmlIgnoreAttributeOrder, isInitialLoadComplete]);

  // Save Text toggle states to localStorage (only after initial load)
  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('textIgnoreWhitespace', String(textIgnoreWhitespace));
    }
  }, [textIgnoreWhitespace, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('textCaseSensitive', String(textCaseSensitive));
    }
  }, [textCaseSensitive, isInitialLoadComplete]);

  const handleClearAll = () => {
    setJsonValidateContent('');
    setXmlValidateContent('');
    setJsonCompareLeft('');
    setJsonCompareRight('');
    setXmlCompareLeft('');
    setXmlCompareRight('');
    setTextCompareLeft('');
    setTextCompareRight('');
    setValidationResult(undefined);
    setJsonComparisonResult(undefined);
    setXmlComparisonResult(undefined);
    setTextComparisonResult(undefined);

    // Reset toggle states to defaults for all tabs
    setJsonIgnoreWhitespace(false);
    setJsonCaseSensitive(true); // Default ON
    setJsonIgnoreKeyOrder(false);
    setJsonIgnoreArrayOrder(false);

    setXmlIgnoreWhitespace(false);
    setXmlCaseSensitive(true); // Default ON
    setXmlIgnoreAttributeOrder(false);

    setTextIgnoreWhitespace(false);
    setTextCaseSensitive(true); // Default ON

    // Clear all content from localStorage and reset toggles to defaults
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jsonValidateContent');
      localStorage.removeItem('xmlValidateContent');
      localStorage.removeItem('jsonCompareLeft');
      localStorage.removeItem('jsonCompareRight');
      localStorage.removeItem('xmlCompareLeft');
      localStorage.removeItem('xmlCompareRight');
      localStorage.removeItem('textCompareLeft');
      localStorage.removeItem('textCompareRight');

      // Set JSON toggle states to defaults in localStorage
      localStorage.setItem('jsonIgnoreWhitespace', 'false');
      localStorage.setItem('jsonCaseSensitive', 'true');
      localStorage.setItem('jsonIgnoreKeyOrder', 'false');
      localStorage.setItem('jsonIgnoreArrayOrder', 'false');

      // Set XML toggle states to defaults in localStorage
      localStorage.setItem('xmlIgnoreWhitespace', 'false');
      localStorage.setItem('xmlCaseSensitive', 'true');
      localStorage.setItem('xmlIgnoreAttributeOrder', 'false');

      // Set Text toggle states to defaults in localStorage
      localStorage.setItem('textIgnoreWhitespace', 'false');
      localStorage.setItem('textCaseSensitive', 'true');
    }
  };

  const handleValidateJSON = () => {
    setIsProcessing(true);

    // Show appropriate message for large content
    const sizeInMB = new Blob([jsonValidateContent]).size / (1024 * 1024);
    if (sizeInMB > 0.5) {
      setProcessingMessage(`Validating ${sizeInMB.toFixed(2)}MB JSON... Please wait`);
    } else {
      setProcessingMessage('Validating JSON...');
    }

    // Use requestAnimationFrame to allow UI to update before heavy processing
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          const result = validateJSON(jsonValidateContent);
          setValidationResult(result);
          setJsonComparisonResult(undefined);
          setXmlComparisonResult(undefined);
          setTextComparisonResult(undefined);
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 50);
    });
  };

  const handlePrettifyJSON = () => {
    setIsProcessing(true);

    // Show appropriate message for large content
    const sizeInMB = new Blob([jsonValidateContent]).size / (1024 * 1024);
    if (sizeInMB > 0.5) {
      setProcessingMessage(`Prettifying ${sizeInMB.toFixed(2)}MB JSON... Please wait`);
    } else {
      setProcessingMessage('Prettifying JSON...');
    }

    // Use requestAnimationFrame to allow UI to update before heavy processing
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          const result = prettifyJSON(jsonValidateContent);

          // If prettification succeeded and we have prettified content, update the text area
          if (result.isValid && result.prettified) {
            setJsonValidateContent(result.prettified);

            // Show toast notification ONLY (no validation result panel)
            if (result.corrections && result.corrections.length > 0) {
              showSuccess('JSON Prettified', `Formatted successfully with ${result.corrections.length} correction(s)`);
            } else {
              showSuccess('JSON Prettified', 'Formatted successfully');
            }
          } else {
            showError('Prettify Failed', result.errors[0] || 'Unable to prettify');
          }
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 50);
    });
  };

  const handleValidateXML = () => {
    setIsProcessing(true);

    // Show appropriate message for large content
    const sizeInMB = new Blob([xmlValidateContent]).size / (1024 * 1024);
    if (sizeInMB > 0.5) {
      setProcessingMessage(`Validating ${sizeInMB.toFixed(2)}MB XML... Please wait`);
    } else {
      setProcessingMessage('Validating XML...');
    }

    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          const result = validateXML(xmlValidateContent);
          setValidationResult(result);
          setJsonComparisonResult(undefined);
          setXmlComparisonResult(undefined);
          setTextComparisonResult(undefined);
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 50);
    });
  };

  const handleCompareJSON = () => {
    // Show full loader IMMEDIATELY before any processing
    setIsProcessing(true);
    setProcessingMessage('Preparing comparison...');

    // Clear any previous results first
    setValidationResult(undefined);
    setJsonComparisonResult(undefined);

    // Check if both inputs are provided
    if (!jsonCompareLeft.trim() || !jsonCompareRight.trim()) {
      // Show error if content is empty or only whitespace
      setValidationResult({
        isValid: false,
        errors: ['Please provide content on both sides to compare'],
        message: 'Empty content',
      });
      setIsProcessing(false);
      setProcessingMessage('');
      return;
    }

    // Use requestAnimationFrame to ensure loader is visible before heavy processing
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Validate that both inputs are valid JSON objects or arrays (not plain strings/primitives)
        // Clean hidden characters before validation
        const cleanJSON = (content: string) => {
          let cleaned = content;
          // Remove BOM if present
          if (cleaned.charCodeAt(0) === 0xFEFF) {
            cleaned = cleaned.slice(1);
          }
          // Remove zero-width characters
          cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
          return cleaned;
        };

        const errors: string[] = [];

        try {
          const leftParsed = JSON.parse(cleanJSON(jsonCompareLeft));
          if (typeof leftParsed !== 'object' || leftParsed === null) {
            errors.push('JSON must be an object or array, not a primitive value');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Invalid JSON syntax';
          if (!errors.includes(errorMessage)) {
            errors.push(errorMessage);
          }
        }

        try {
          const rightParsed = JSON.parse(cleanJSON(jsonCompareRight));
          if (typeof rightParsed !== 'object' || rightParsed === null) {
            // Only add this error if it's not a duplicate
            if (!errors.includes('JSON must be an object or array, not a primitive value')) {
              errors.push('JSON must be an object or array, not a primitive value');
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Invalid JSON syntax';
          if (!errors.includes(errorMessage)) {
            errors.push(errorMessage);
          }
        }

        // If there are validation errors, show them in the results panel
        if (errors.length > 0) {
          setValidationResult({
            isValid: false,
            message: 'Invalid JSON',
            errors: errors,
          });
          setIsProcessing(false);
          setProcessingMessage('');
          return;
        }

        // Check file size limits
        const totalSize = (new Blob([jsonCompareLeft]).size + new Blob([jsonCompareRight]).size) / (1024 * 1024);

        // Hard limit: 5MB total
        if (totalSize > 5) {
          setValidationResult({
            isValid: false,
            errors: [`File size too large (${totalSize.toFixed(2)}MB). Maximum allowed is 5MB total. Please split your files into smaller parts or use a desktop tool for very large files.`],
            message: 'File size limit exceeded',
          });
          setIsProcessing(false);
          setProcessingMessage('');
          return;
        }

        // Show appropriate message for large files
        if (totalSize > 1) {
          setProcessingMessage(`Comparing ${totalSize.toFixed(2)}MB JSON... Processing large files, please be patient`);
        } else {
          setProcessingMessage('Comparing JSON... Please be patient, processing large files in progress.');
        }

    // Always use Web Worker for files > 0.3MB to prevent blocking
    if (totalSize > 0.3 && workerRef.current) {
      // Reset chunk accumulator at start of new comparison
      chunkAccumulatorRef.current = { left: '', right: '', stats: { added: 0, removed: 0, modified: 0 } };

      workerRef.current.onmessage = (e) => {
        const { success, result, error, isChunk, isLastChunk, chunkNumber, totalChunks } = e.data;

        if (success) {
          if (isChunk) {
            // Progressive chunk received - accumulate
            if (result.differences && result.differences[0]) {
              chunkAccumulatorRef.current.left += result.differences[0].leftValue || '';
              chunkAccumulatorRef.current.right += result.differences[0].rightValue || '';
            }

            // Update processing message immediately
            const progress = Math.round((chunkNumber / totalChunks) * 100);
            setProcessingMessage(`Processing large file: ${progress}% complete (${chunkNumber}/${totalChunks} chunks)`);

            // Only update display on LAST chunk - keep loader visible until complete
            if (isLastChunk) {
              scheduleUpdate(() => {
                setJsonComparisonResult({
                  areEqual: false,
                  differences: [{
                    path: 'Full Document',
                    leftValue: chunkAccumulatorRef.current.left,
                    rightValue: chunkAccumulatorRef.current.right,
                    type: 'modified',
                  }],
                  message: result.message,
                  statistics: result.statistics,
                });
                // Hide loader and show results
                setIsProcessing(false);
                setProcessingMessage('');
              });
              chunkAccumulatorRef.current.stats = result.statistics;
            }
          } else {
            // Non-chunked result (fallback or small files)
            setJsonComparisonResult(result);
            setValidationResult(undefined);
            setIsProcessing(false);
            setProcessingMessage('');
          }
        } else {
          setValidationResult({
            isValid: false,
            errors: [error],
            message: 'Error during comparison',
          });
          setIsProcessing(false);
          setProcessingMessage('');
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        // Fallback to main thread if worker fails
        setTimeout(() => {
          try {
            const result = compareJSON(jsonCompareLeft, jsonCompareRight, {
              ignoreWhitespace: jsonIgnoreWhitespace,
              caseSensitive: jsonCaseSensitive,
              ignoreKeyOrder: jsonIgnoreKeyOrder,
              ignoreArrayOrder: jsonIgnoreArrayOrder,
            });
            setJsonComparisonResult(result);
            setValidationResult(undefined);
          } catch (error) {
            setValidationResult({
              isValid: false,
              errors: [error instanceof Error ? error.message : 'Comparison failed'],
              message: 'Error during comparison',
            });
          } finally {
            setIsProcessing(false);
            setProcessingMessage('');
          }
        }, 100);
      };

      workerRef.current.postMessage({
        type: 'compareJSON',
        data: {
          left: jsonCompareLeft,
          right: jsonCompareRight,
          options: {
            ignoreWhitespace: jsonIgnoreWhitespace,
            caseSensitive: jsonCaseSensitive,
            ignoreKeyOrder: jsonIgnoreKeyOrder,
            ignoreArrayOrder: jsonIgnoreArrayOrder,
          }
        }
      });
    } else {
      // For smaller files, use main thread
      setTimeout(() => {
        try {
          const result = compareJSON(jsonCompareLeft, jsonCompareRight, {
            ignoreWhitespace: jsonIgnoreWhitespace,
            caseSensitive: jsonCaseSensitive,
            ignoreKeyOrder: jsonIgnoreKeyOrder,
            ignoreArrayOrder: jsonIgnoreArrayOrder,
          });
          setJsonComparisonResult(result);
          setValidationResult(undefined);
        } catch (error) {
          setValidationResult({
            isValid: false,
            errors: [error instanceof Error ? error.message : 'Comparison failed'],
            message: 'Error during comparison',
          });
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 100);
    }
      }, 50); // Small delay to ensure loader is visible
    });
  };

  const handleCompareXML = () => {
    // Clear any previous validation results first
    setValidationResult(undefined);
    setXmlComparisonResult(undefined);

    // Check if both inputs are provided
    if (!xmlCompareLeft.trim() || !xmlCompareRight.trim()) {
      // Show error if content is empty or only whitespace
      setValidationResult({
        isValid: false,
        errors: ['Please provide content on both sides to compare'],
        message: 'Empty content',
      });
      return;
    }

    // Check file size limits
    const totalSize = (new Blob([xmlCompareLeft]).size + new Blob([xmlCompareRight]).size) / (1024 * 1024);

    // Hard limit: 5MB total
    if (totalSize > 5) {
      setValidationResult({
        isValid: false,
        errors: [`File size too large (${totalSize.toFixed(2)}MB). Maximum allowed is 5MB total. Please split your files into smaller parts or use a desktop tool for very large files.`],
        message: 'File size limit exceeded',
      });
      return;
    }

    setIsProcessing(true);

    // Show appropriate message for large files
    if (totalSize > 1) {
      setProcessingMessage(`Comparing ${totalSize.toFixed(2)}MB XML... Processing large files, please be patient`);
    } else {
      setProcessingMessage('Comparing XML... Please be patient, processing large files in progress.');
    }

    // Always use Web Worker for files > 0.3MB to prevent blocking
    if (totalSize > 0.3 && workerRef.current) {
      // Reset chunk accumulator at start of new comparison
      chunkAccumulatorRef.current = { left: '', right: '', stats: { added: 0, removed: 0, modified: 0 } };

      workerRef.current.onmessage = (e) => {
        const { success, result, error, isChunk, isLastChunk, chunkNumber, totalChunks } = e.data;

        if (success) {
          if (isChunk) {
            // Progressive chunk received - accumulate
            if (result.differences && result.differences[0]) {
              chunkAccumulatorRef.current.left += result.differences[0].leftValue || '';
              chunkAccumulatorRef.current.right += result.differences[0].rightValue || '';
            }

            // Update processing message immediately
            const progress = Math.round((chunkNumber / totalChunks) * 100);
            setProcessingMessage(`Processing large file: ${progress}% complete (${chunkNumber}/${totalChunks} chunks)`);

            // Only update display on LAST chunk - keep loader visible until complete
            if (isLastChunk) {
              scheduleUpdate(() => {
                setXmlComparisonResult({
                  areEqual: false,
                  differences: [{
                    path: 'Full Document',
                    leftValue: chunkAccumulatorRef.current.left,
                    rightValue: chunkAccumulatorRef.current.right,
                    type: 'modified',
                  }],
                  message: result.message,
                  statistics: result.statistics,
                });
                // Hide loader and show results
                setIsProcessing(false);
                setProcessingMessage('');
              });
              chunkAccumulatorRef.current.stats = result.statistics;
            }
          } else {
            // Non-chunked result (fallback or small files)
            setXmlComparisonResult(result);
            setValidationResult(undefined);
            setIsProcessing(false);
            setProcessingMessage('');
          }
        } else {
          setValidationResult({
            isValid: false,
            errors: [error],
            message: 'Error during comparison',
          });
          setIsProcessing(false);
          setProcessingMessage('');
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        // Fallback to main thread if worker fails
        setTimeout(() => {
          try {
            const result = compareXML(xmlCompareLeft, xmlCompareRight, {
              ignoreWhitespace: xmlIgnoreWhitespace,
              caseSensitive: xmlCaseSensitive,
              ignoreAttributeOrder: xmlIgnoreAttributeOrder,
            });
            setXmlComparisonResult(result);
            setValidationResult(undefined);
          } catch (error) {
            setValidationResult({
              isValid: false,
              errors: [error instanceof Error ? error.message : 'Comparison failed'],
              message: 'Error during comparison',
            });
          } finally {
            setIsProcessing(false);
            setProcessingMessage('');
          }
        }, 100);
      };

      workerRef.current.postMessage({
        type: 'compareXML',
        data: {
          left: xmlCompareLeft,
          right: xmlCompareRight,
          options: {
            ignoreWhitespace: xmlIgnoreWhitespace,
            caseSensitive: xmlCaseSensitive,
            ignoreAttributeOrder: xmlIgnoreAttributeOrder,
          }
        }
      });
    } else {
      // For smaller files, use main thread
      setTimeout(() => {
        try {
          const result = compareXML(xmlCompareLeft, xmlCompareRight, {
            ignoreWhitespace: xmlIgnoreWhitespace,
            caseSensitive: xmlCaseSensitive,
            ignoreAttributeOrder: xmlIgnoreAttributeOrder,
          });
          setXmlComparisonResult(result);
          setValidationResult(undefined);
        } catch (error) {
          setValidationResult({
            isValid: false,
            errors: [error instanceof Error ? error.message : 'Comparison failed'],
            message: 'Error during comparison',
          });
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 100);
    }
  };

  const handleCompareText = () => {
    // Clear any previous validation results first
    setValidationResult(undefined);
    setTextComparisonResult(undefined);

    // Check if both inputs are provided
    if (!textCompareLeft.trim() || !textCompareRight.trim()) {
      // Show error if content is empty or only whitespace
      setValidationResult({
        isValid: false,
        errors: ['Please provide content on both sides to compare'],
        message: 'Empty content',
      });
      return;
    }

    // Check file size limits
    const totalSize = (new Blob([textCompareLeft]).size + new Blob([textCompareRight]).size) / (1024 * 1024);

    // Hard limit: 5MB total
    if (totalSize > 5) {
      setValidationResult({
        isValid: false,
        errors: [`File size too large (${totalSize.toFixed(2)}MB). Maximum allowed is 5MB total. Please split your files into smaller parts or use a desktop tool for very large files.`],
        message: 'File size limit exceeded',
      });
      return;
    }

    setIsProcessing(true);

    // Show appropriate message for large files
    if (totalSize > 1) {
      setProcessingMessage(`Comparing ${totalSize.toFixed(2)}MB text... Processing large files, please be patient`);
    } else {
      setProcessingMessage('Comparing text... Please be patient, processing large files in progress.');
    }

    // Always use Web Worker for files > 0.3MB to prevent blocking
    if (totalSize > 0.3 && workerRef.current) {
      // Reset chunk accumulator at start of new comparison
      chunkAccumulatorRef.current = { left: '', right: '', stats: { added: 0, removed: 0, modified: 0 } };

      workerRef.current.onmessage = (e) => {
        const { success, result, error, isChunk, isLastChunk, chunkNumber, totalChunks } = e.data;

        if (success) {
          if (isChunk) {
            // Progressive chunk received - accumulate
            if (result.differences && result.differences[0]) {
              chunkAccumulatorRef.current.left += result.differences[0].leftValue || '';
              chunkAccumulatorRef.current.right += result.differences[0].rightValue || '';
            }

            // Update processing message immediately
            const progress = Math.round((chunkNumber / totalChunks) * 100);
            setProcessingMessage(`Processing large file: ${progress}% complete (${chunkNumber}/${totalChunks} chunks)`);

            // Only update display on LAST chunk - keep loader visible until complete
            if (isLastChunk) {
              scheduleUpdate(() => {
                setTextComparisonResult({
                  areEqual: false,
                  differences: [{
                    path: 'Full Document',
                    leftValue: chunkAccumulatorRef.current.left,
                    rightValue: chunkAccumulatorRef.current.right,
                    type: 'modified',
                  }],
                  message: result.message,
                  statistics: result.statistics,
                });
                // Hide loader and show results
                setIsProcessing(false);
                setProcessingMessage('');
              });
              chunkAccumulatorRef.current.stats = result.statistics;
            }
          } else {
            // Non-chunked result (fallback or small files)
            setTextComparisonResult(result);
            setValidationResult(undefined);
            setIsProcessing(false);
            setProcessingMessage('');
          }
        } else {
          setValidationResult({
            isValid: false,
            errors: [error],
            message: 'Error during comparison',
          });
          setIsProcessing(false);
          setProcessingMessage('');
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        // Fallback to main thread if worker fails
        setTimeout(() => {
          try {
            const result = compareText(textCompareLeft, textCompareRight, {
              ignoreWhitespace: textIgnoreWhitespace,
              caseSensitive: textCaseSensitive,
            });
            setTextComparisonResult(result);
            setValidationResult(undefined);
          } catch (error) {
            setValidationResult({
              isValid: false,
              errors: [error instanceof Error ? error.message : 'Comparison failed'],
              message: 'Error during comparison',
            });
          } finally {
            setIsProcessing(false);
            setProcessingMessage('');
          }
        }, 100);
      };

      workerRef.current.postMessage({
        type: 'compareText',
        data: {
          left: textCompareLeft,
          right: textCompareRight,
          options: {
            ignoreWhitespace: textIgnoreWhitespace,
            caseSensitive: textCaseSensitive,
          }
        }
      });
    } else {
      // For smaller files, use main thread
      setTimeout(() => {
        try {
          const result = compareText(textCompareLeft, textCompareRight, {
            ignoreWhitespace: textIgnoreWhitespace,
            caseSensitive: textCaseSensitive,
          });
          setTextComparisonResult(result);
          setValidationResult(undefined);
        } catch (error) {
          setValidationResult({
            isValid: false,
            errors: [error instanceof Error ? error.message : 'Comparison failed'],
            message: 'Error during comparison',
          });
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 100);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // Clear results when switching tabs
    setValidationResult(undefined);
    setJsonComparisonResult(undefined);
    setXmlComparisonResult(undefined);
    setTextComparisonResult(undefined);
  };

  // Download handlers
  const handleDownloadJSON = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    downloadContent(jsonValidateContent, `json-validate-${timestamp}.json`);
  };

  const handleDownloadXML = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    downloadContent(xmlValidateContent, `xml-validate-${timestamp}.xml`);
  };

  const handleCopyToClipboard = async (content: string, label: string = 'Content') => {
    try {
      await navigator.clipboard.writeText(content);
      showSuccess('Copied!', `${label} copied to clipboard successfully`);
    } catch {
      showError('Copy Failed', 'Failed to copy content to clipboard');
    }
  };

  const handlePasteFromClipboard = async (setter: React.Dispatch<React.SetStateAction<string>>, label: string = 'Content') => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // Append clipboard content to existing content
        setter((prev) => prev + text);
        showSuccess('Pasted!', `${label} pasted from clipboard successfully`);
      } else {
        showError('Paste Failed', 'Clipboard is empty');
      }
    } catch {
      showError('Paste Failed', 'Failed to read from clipboard. Please use Ctrl+V or Cmd+V instead.');
    }
  };

  // Reset handlers
  const handleResetJSONValidate = () => {
    // Skip auto-save for this reset
    skipNextSaveRef.current.add('jsonValidateContent');

    setJsonValidateContent('');
    setValidationResult(undefined);
    // Note: toggles are NOT reset - they are separate for each tab
    // Note: localStorage is NOT cleared - content will restore on refresh
  };

  const handleResetXMLValidate = () => {
    // Skip auto-save for this reset
    skipNextSaveRef.current.add('xmlValidateContent');

    setXmlValidateContent('');
    setValidationResult(undefined);
    // Note: toggles are NOT reset - they are separate for each tab
    // Note: localStorage is NOT cleared - content will restore on refresh
  };

  const handleResetJSONCompare = () => {
    // Skip auto-save for this reset
    skipNextSaveRef.current.add('jsonCompareLeft');
    skipNextSaveRef.current.add('jsonCompareRight');

    setJsonCompareLeft('');
    setJsonCompareRight('');
    setJsonComparisonResult(undefined);
    // Reset prettification flags
    setJsonLeftPrettified(false);
    setJsonRightPrettified(false);
    // Reset JSON toggles to defaults: Only Case Sensitive ON, all others OFF
    setJsonIgnoreWhitespace(false);
    setJsonCaseSensitive(true);
    setJsonIgnoreKeyOrder(false);
    setJsonIgnoreArrayOrder(false);
    // Note: localStorage is NOT cleared - content will restore on refresh
  };

  const handleResetXMLCompare = () => {
    // Skip auto-save for this reset
    skipNextSaveRef.current.add('xmlCompareLeft');
    skipNextSaveRef.current.add('xmlCompareRight');

    setXmlCompareLeft('');
    setXmlCompareRight('');
    setXmlComparisonResult(undefined);
    // Reset XML toggles to defaults: Only Case Sensitive ON, all others OFF
    setXmlIgnoreWhitespace(false);
    setXmlCaseSensitive(true);
    setXmlIgnoreAttributeOrder(false);
    // Note: localStorage is NOT cleared - content will restore on refresh
  };

  const handleResetTextCompare = () => {
    // Skip auto-save for this reset
    skipNextSaveRef.current.add('textCompareLeft');
    skipNextSaveRef.current.add('textCompareRight');

    setTextCompareLeft('');
    setTextCompareRight('');
    setTextComparisonResult(undefined);
    // Reset Text toggles to defaults: Only Case Sensitive ON, all others OFF
    setTextIgnoreWhitespace(false);
    setTextCaseSensitive(true);
    // Note: localStorage is NOT cleared - content will restore on refresh
  };

  const tabs: TabItem[] = [
    {
      key: 'json-validate',
      label: 'JSON Validate',
      content: (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <SectionTitle style={{ margin: 0, paddingTop: '8px' }}>Input Content</SectionTitle>
            </div>
            <ValidateButtonGroup>
              <ActionButton $variant="secondary" onClick={handleResetJSONValidate} disabled={!jsonValidateContent}>
                <RefreshIcon />
                Reset
              </ActionButton>
              <ActionButton $variant="secondary" onClick={handlePrettifyJSON} disabled={!jsonValidateContent}>
                ✨ Prettify
              </ActionButton>
              <ActionButton $variant="primary" onClick={handleValidateJSON} disabled={!jsonValidateContent}>
                <PlayIcon />
                Check Format
              </ActionButton>
            </ValidateButtonGroup>
          </div>
          <InputSection>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setJsonValidateContent, 'JSON content')} title="Paste">
                <ClipboardIcon />
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => handleCopyToClipboard(jsonValidateContent, 'JSON content')} disabled={!jsonValidateContent} title="Copy">
                <CopyIcon />
              </ActionButton>
              <ActionButton $variant="secondary" onClick={handleDownloadJSON} disabled={!jsonValidateContent} title="Download">
                <DownloadIcon />
              </ActionButton>
            </div>
            <FileUpload
              onFileLoad={(content) => {
                setIsProcessing(true);
                setProcessingMessage('Loading file content...');
                setTimeout(() => {
                  setJsonValidateContent(content);
                  setIsProcessing(false);
                  setProcessingMessage('');
                }, 100);
              }}
              acceptedTypes={['.json']}
              label="json-validate"
              value={jsonValidateContent}
              onError={(message) => showError('Invalid File', message)}
            />
            <TextArea
              label=""
              value={jsonValidateContent}
              onChange={setJsonValidateContent}
              placeholder="Paste your content here to validate..."
            />
          </InputSection>
          {validationResult && <ResultsPanel validationResult={validationResult} />}
        </>
      ),
    },
    {
      key: 'json-compare',
      label: 'JSON Compare',
      content: (
        <>
          <OptionsRow style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Toggle label="Ignore Whitespace" checked={jsonIgnoreWhitespace} onChange={setJsonIgnoreWhitespace} />
              <Toggle label="Case Sensitive" checked={jsonCaseSensitive} onChange={setJsonCaseSensitive} />
              <Toggle label="Ignore Key Order" checked={jsonIgnoreKeyOrder} onChange={setJsonIgnoreKeyOrder} />
              <Toggle label="Ignore Array Order" checked={jsonIgnoreArrayOrder} onChange={setJsonIgnoreArrayOrder} />
            </div>
            <ValidateButtonGroup>
              <ActionButton $variant="secondary" onClick={handleResetJSONCompare} disabled={!jsonCompareLeft && !jsonCompareRight}>
                <RefreshIcon />
                Reset
              </ActionButton>
              <ActionButton
                $variant="primary"
                onClick={handleCompareJSON}
                disabled={!jsonCompareLeft || !jsonCompareRight || !jsonLeftPrettified || !jsonRightPrettified}
                title={!jsonLeftPrettified || !jsonRightPrettified ? "Prettify both sides first" : "Compare JSON"}
              >
                <CompareIcon />
                Spot Differences
              </ActionButton>
            </ValidateButtonGroup>
          </OptionsRow>
          <InputSection>
            <SectionTitle>Input Content</SectionTitle>
            <DualEditorContainer>
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setJsonCompareLeft, 'Base version content')} title="Paste">
                    <ClipboardIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => handleCopyToClipboard(jsonCompareLeft, 'Base version content')} disabled={!jsonCompareLeft} title="Copy">
                    <CopyIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                    downloadContent(jsonCompareLeft, `json-base-version-${timestamp}.json`);
                  }} disabled={!jsonCompareLeft} title="Download">
                    <DownloadIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => {
                    const result = prettifyJSON(jsonCompareLeft);
                    if (result.isValid && result.prettified) {
                      setJsonCompareLeft(result.prettified);
                      prevJsonLeftRef.current = result.prettified; // Update ref to prevent useEffect from resetting flag
                      setJsonLeftPrettified(true);
                      if (result.corrections && result.corrections.length > 0) {
                        showSuccess('Prettified', `${result.corrections.length} correction(s) applied`);
                      } else {
                        showSuccess('Prettified', 'Formatted successfully');
                      }
                    } else {
                      showError('Prettify Failed', result.errors[0] || 'Unable to prettify');
                    }
                  }} disabled={!jsonCompareLeft} title="Prettify JSON">
                    ✨
                  </ActionButton>
                </div>
                <FileUpload
                  onFileLoad={(content) => {
                    setJsonCompareLeft(content);
                  }}
                  acceptedTypes={['.json']}
                  label="json-compare-left"
                  value={jsonCompareLeft}
                  onError={(message) => showError('Invalid File', message)}
                />
                <TextArea
                  label="Base Version"
                  labelColor="#a855f7"
                  value={jsonCompareLeft}
                  onChange={setJsonCompareLeft}
                  placeholder="Paste base version content..."
                />
              </div>
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setJsonCompareRight, 'Modified version content')} title="Paste">
                    <ClipboardIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => handleCopyToClipboard(jsonCompareRight, 'Modified version content')} disabled={!jsonCompareRight} title="Copy">
                    <CopyIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                    downloadContent(jsonCompareRight, `json-modified-version-${timestamp}.json`);
                  }} disabled={!jsonCompareRight} title="Download">
                    <DownloadIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => {
                    const result = prettifyJSON(jsonCompareRight);
                    if (result.isValid && result.prettified) {
                      setJsonCompareRight(result.prettified);
                      prevJsonRightRef.current = result.prettified; // Update ref to prevent useEffect from resetting flag
                      setJsonRightPrettified(true);
                      if (result.corrections && result.corrections.length > 0) {
                        showSuccess('Prettified', `${result.corrections.length} correction(s) applied`);
                      } else {
                        showSuccess('Prettified', 'Formatted successfully');
                      }
                    } else {
                      showError('Prettify Failed', result.errors[0] || 'Unable to prettify');
                    }
                  }} disabled={!jsonCompareRight} title="Prettify JSON">
                    ✨
                  </ActionButton>
                </div>
                <FileUpload
                  onFileLoad={(content) => {
                    setJsonCompareRight(content);
                  }}
                  acceptedTypes={['.json']}
                  label="json-compare-right"
                  value={jsonCompareRight}
                  onError={(message) => showError('Invalid File', message)}
                />
                <TextArea
                  label="Modified Version"
                  labelColor="#3b82f6"
                  value={jsonCompareRight}
                  onChange={setJsonCompareRight}
                  placeholder="Paste modified version content..."
                />
              </div>
            </DualEditorContainer>
          </InputSection>
          {validationResult && <ResultsPanel validationResult={validationResult} />}
          {jsonComparisonResult && <ResultsPanel comparisonResult={jsonComparisonResult} />}
        </>
      ),
    },
    {
      key: 'xml-validate',
      label: 'XML Validate',
      content: (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <SectionTitle style={{ margin: 0, paddingTop: '8px' }}>Input Content</SectionTitle>
            </div>
            <ValidateButtonGroup>
              <ActionButton $variant="secondary" onClick={handleResetXMLValidate} disabled={!xmlValidateContent}>
                <RefreshIcon />
                Reset
              </ActionButton>
              <ActionButton $variant="primary" onClick={handleValidateXML} disabled={!xmlValidateContent}>
                <PlayIcon />
                Check Format
              </ActionButton>
            </ValidateButtonGroup>
          </div>
          <InputSection>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setXmlValidateContent, 'XML content')} title="Paste">
                <ClipboardIcon />
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => handleCopyToClipboard(xmlValidateContent, 'XML content')} disabled={!xmlValidateContent} title="Copy">
                <CopyIcon />
              </ActionButton>
              <ActionButton $variant="secondary" onClick={handleDownloadXML} disabled={!xmlValidateContent} title="Download">
                <DownloadIcon />
              </ActionButton>
            </div>
            <FileUpload
              onFileLoad={(content) => {
                setIsProcessing(true);
                setProcessingMessage('Loading file content...');
                setTimeout(() => {
                  setXmlValidateContent(content);
                  setIsProcessing(false);
                  setProcessingMessage('');
                }, 100);
              }}
              acceptedTypes={['.xml']}
              label="xml-validate"
              value={xmlValidateContent}
              onError={(message) => showError('Invalid File', message)}
            />
            <TextArea
              label=""
              value={xmlValidateContent}
              onChange={setXmlValidateContent}
              placeholder="Paste your content here to validate..."
            />
          </InputSection>
          {validationResult && <ResultsPanel validationResult={validationResult} />}
        </>
      ),
    },
    {
      key: 'xml-compare',
      label: 'XML Compare',
      content: (
        <>
          <OptionsRow style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Toggle label="Ignore Whitespace" checked={xmlIgnoreWhitespace} onChange={setXmlIgnoreWhitespace} />
              <Toggle label="Case Sensitive" checked={xmlCaseSensitive} onChange={setXmlCaseSensitive} />
              <Toggle label="Ignore Attribute Order" checked={xmlIgnoreAttributeOrder} onChange={setXmlIgnoreAttributeOrder} />
            </div>
            <ValidateButtonGroup>
              <ActionButton $variant="secondary" onClick={handleResetXMLCompare} disabled={!xmlCompareLeft && !xmlCompareRight}>
                <RefreshIcon />
                Reset
              </ActionButton>
              <ActionButton $variant="primary" onClick={handleCompareXML} disabled={!xmlCompareLeft || !xmlCompareRight}>
                <CompareIcon />
                Spot Differences
              </ActionButton>
            </ValidateButtonGroup>
          </OptionsRow>
          <InputSection>
            <SectionTitle>Input Content</SectionTitle>
            <DualEditorContainer>
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setXmlCompareLeft, 'Base version content')} title="Paste">
                    <ClipboardIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => handleCopyToClipboard(xmlCompareLeft, 'Base version content')} disabled={!xmlCompareLeft} title="Copy">
                    <CopyIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                    downloadContent(xmlCompareLeft, `xml-base-version-${timestamp}.xml`);
                  }} disabled={!xmlCompareLeft} title="Download">
                    <DownloadIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => {
                    const result = prettifyXML(xmlCompareLeft);
                    if (result.isValid && result.prettified) {
                      setXmlCompareLeft(result.prettified);
                      showSuccess('Prettified', 'XML formatted successfully');
                    } else {
                      showError('Prettify Failed', result.errors[0] || 'Unable to prettify');
                    }
                  }} disabled={!xmlCompareLeft} title="Prettify XML">
                    ✨
                  </ActionButton>
                </div>
                <FileUpload
                  onFileLoad={(content) => {
                    setIsProcessing(true);
                    setProcessingMessage('Loading file content...');
                    setTimeout(() => {
                      setXmlCompareLeft(content);
                      setIsProcessing(false);
                      setProcessingMessage('');
                    }, 100);
                  }}
                  acceptedTypes={['.xml']}
                  label="xml-compare-left"
                  value={xmlCompareLeft}
                  onError={(message) => showError('Invalid File', message)}
                />
                <TextArea
                  label="Base Version"
                  labelColor="#a855f7"
                  value={xmlCompareLeft}
                  onChange={setXmlCompareLeft}
                  placeholder="Paste base version content..."
                />
              </div>
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setXmlCompareRight, 'Modified version content')} title="Paste">
                    <ClipboardIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => handleCopyToClipboard(xmlCompareRight, 'Modified version content')} disabled={!xmlCompareRight} title="Copy">
                    <CopyIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                    downloadContent(xmlCompareRight, `xml-modified-version-${timestamp}.xml`);
                  }} disabled={!xmlCompareRight} title="Download">
                    <DownloadIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => {
                    const result = prettifyXML(xmlCompareRight);
                    if (result.isValid && result.prettified) {
                      setXmlCompareRight(result.prettified);
                      showSuccess('Prettified', 'XML formatted successfully');
                    } else {
                      showError('Prettify Failed', result.errors[0] || 'Unable to prettify');
                    }
                  }} disabled={!xmlCompareRight} title="Prettify XML">
                    ✨
                  </ActionButton>
                </div>
                <FileUpload
                  onFileLoad={(content) => {
                    setIsProcessing(true);
                    setProcessingMessage('Loading file content...');
                    setTimeout(() => {
                      setXmlCompareRight(content);
                      setIsProcessing(false);
                      setProcessingMessage('');
                    }, 100);
                  }}
                  acceptedTypes={['.xml']}
                  label="xml-compare-right"
                  value={xmlCompareRight}
                  onError={(message) => showError('Invalid File', message)}
                />
                <TextArea
                  label="Modified Version"
                  labelColor="#3b82f6"
                  value={xmlCompareRight}
                  onChange={setXmlCompareRight}
                  placeholder="Paste modified version content..."
                />
              </div>
            </DualEditorContainer>
          </InputSection>
          {validationResult && <ResultsPanel validationResult={validationResult} />}
          {xmlComparisonResult && <ResultsPanel comparisonResult={xmlComparisonResult} />}
        </>
      ),
    },
    {
      key: 'text-compare',
      label: 'Text Compare',
      content: (
        <>
          <OptionsRow style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Toggle label="Ignore Whitespace" checked={textIgnoreWhitespace} onChange={setTextIgnoreWhitespace} />
              <Toggle label="Case Sensitive" checked={textCaseSensitive} onChange={setTextCaseSensitive} />
            </div>
            <ValidateButtonGroup>
              <ActionButton $variant="secondary" onClick={handleResetTextCompare} disabled={!textCompareLeft && !textCompareRight}>
                <RefreshIcon />
                Reset
              </ActionButton>
              <ActionButton $variant="primary" onClick={handleCompareText} disabled={!textCompareLeft || !textCompareRight}>
                <CompareIcon />
                Spot Differences
              </ActionButton>
            </ValidateButtonGroup>
          </OptionsRow>
          <InputSection>
            <SectionTitle>Input Content</SectionTitle>
            <DualEditorContainer>
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setTextCompareLeft, 'Base version content')} title="Paste">
                    <ClipboardIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => handleCopyToClipboard(textCompareLeft, 'Base version content')} disabled={!textCompareLeft} title="Copy">
                    <CopyIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                    downloadContent(textCompareLeft, `text-base-version-${timestamp}.txt`);
                  }} disabled={!textCompareLeft} title="Download">
                    <DownloadIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => {
                    const result = prettifyText(textCompareLeft);
                    if (result.isValid && result.prettified) {
                      setTextCompareLeft(result.prettified);
                      showSuccess('Prettified', 'Text formatted successfully');
                    } else {
                      showError('Prettify Failed', result.errors[0] || 'Unable to prettify');
                    }
                  }} disabled={!textCompareLeft} title="Prettify Text">
                    ✨
                  </ActionButton>
                </div>
                <FileUpload
                  onFileLoad={(content) => {
                    setIsProcessing(true);
                    setProcessingMessage('Loading file content...');
                    setTimeout(() => {
                      setTextCompareLeft(content);
                      setIsProcessing(false);
                      setProcessingMessage('');
                    }, 100);
                  }}
                  acceptedTypes={['.txt']}
                  label="text-compare-left"
                  value={textCompareLeft}
                  onError={(message) => showError('Invalid File', message)}
                />
                <TextArea
                  label="Base Version"
                  labelColor="#a855f7"
                  value={textCompareLeft}
                  onChange={setTextCompareLeft}
                  placeholder="Paste base version content..."
                />
              </div>
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setTextCompareRight, 'Modified version content')} title="Paste">
                    <ClipboardIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => handleCopyToClipboard(textCompareRight, 'Modified version content')} disabled={!textCompareRight} title="Copy">
                    <CopyIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                    downloadContent(textCompareRight, `text-modified-version-${timestamp}.txt`);
                  }} disabled={!textCompareRight} title="Download">
                    <DownloadIcon />
                  </ActionButton>
                  <ActionButton $variant="secondary" onClick={() => {
                    const result = prettifyText(textCompareRight);
                    if (result.isValid && result.prettified) {
                      setTextCompareRight(result.prettified);
                      showSuccess('Prettified', 'Text formatted successfully');
                    } else {
                      showError('Prettify Failed', result.errors[0] || 'Unable to prettify');
                    }
                  }} disabled={!textCompareRight} title="Prettify Text">
                    ✨
                  </ActionButton>
                </div>
                <FileUpload
                  onFileLoad={(content) => {
                    setIsProcessing(true);
                    setProcessingMessage('Loading file content...');
                    setTimeout(() => {
                      setTextCompareRight(content);
                      setIsProcessing(false);
                      setProcessingMessage('');
                    }, 100);
                  }}
                  acceptedTypes={['.txt']}
                  label="text-compare-right"
                  value={textCompareRight}
                  onError={(message) => showError('Invalid File', message)}
                />
                <TextArea
                  label="Modified Version"
                  labelColor="#3b82f6"
                  value={textCompareRight}
                  onChange={setTextCompareRight}
                  placeholder="Paste modified version content..."
                />
              </div>
            </DualEditorContainer>
          </InputSection>
          {validationResult && <ResultsPanel validationResult={validationResult} />}
          {textComparisonResult && <ResultsPanel comparisonResult={textComparisonResult} />}
        </>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>Diff & Validate - Comparison and Validation Tool</title>
        <meta name="description" content="Compare and validate JSON, XML, and text files easily" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      </Head>
      <PageContainer>
        <Header>
          <HeaderContent>
            <Logo>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 6V11C4 16.55 7.84 21.74 13 23C18.16 21.74 22 16.55 22 11V6L12 2Z" fill="#8B5CF6" stroke="#8B5CF6" strokeWidth="1.5"/>
                <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Logo>
            <HeaderText>
              <Title>Diff & Validate</Title>
              <Subtitle>Comparison and validation tool</Subtitle>
            </HeaderText>
            <ThemeToggleButton onClick={toggleTheme}>
              {themeMode === 'light' ? <MoonIcon /> : <SunIcon />}
            </ThemeToggleButton>
            <ClearButton onClick={handleClearAll}>
              Clear All
            </ClearButton>
          </HeaderContent>
        </Header>
        <Content>
          <Card>
            <Tabs items={tabs} activeKey={activeTab} onChange={handleTabChange} />
          </Card>
        </Content>
      </PageContainer>
      {isProcessing && (
        <LoadingOverlay
          message={processingMessage}
          subtext="This may take a moment for large files. Feel free to switch tabs."
        />
      )}
    </>
  );
}

