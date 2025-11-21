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
  StorageIndicator,
} from '@/components/ComparisonTool';
import { ThemeContext } from './_app';
import {
  validateJSON,
  validateXML,
  compareJSON,
  compareXML,
  compareText,
  downloadContent,
  ValidationResult,
  ComparisonResult,
} from '@/utils/comparison';

export default function ComparisonTool() {
  const { themeMode, toggleTheme } = useContext(ThemeContext);
  const { showError, showSuccess } = useToast();

  // Helper function to save to localStorage (debounced)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveToLocalStorage = (key: string, value: string) => {
    if (typeof window === 'undefined') return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule save after 300ms of no typing
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Silently fail - localStorage might be disabled
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

  // State for options - Default: Only Case Sensitive is ON, all others OFF
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [ignoreKeyOrder, setIgnoreKeyOrder] = useState(false);
  const [ignoreArrayOrder, setIgnoreArrayOrder] = useState(false);
  const [ignoreAttributeOrder, setIgnoreAttributeOrder] = useState(false);

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

  // State for storage size
  const [storageSize, setStorageSize] = useState('0 KB');

  // Function to calculate localStorage size (only content keys, exclude settings)
  const calculateStorageSize = () => {
    if (typeof window === 'undefined') return '0.00 KB';
    try {
      let totalSize = 0;

      // Only count content keys (exclude toggle settings and activeTab)
      const contentKeys = [
        'jsonValidateContent',
        'xmlValidateContent',
        'jsonCompareLeft',
        'jsonCompareRight',
        'xmlCompareLeft',
        'xmlCompareRight',
        'textCompareLeft',
        'textCompareRight'
      ];

      // Only count content data
      for (const key of contentKeys) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          totalSize += value.length + key.length;
        }
      }

      // Convert bytes to KB with 2 decimal places
      const sizeInKB = (totalSize / 1024).toFixed(2);
      return `${sizeInKB} KB`;
    } catch {
      return '0.00 KB';
    }
  };

  // Update storage size whenever content changes
  useEffect(() => {
    if (isInitialLoadComplete) {
      setStorageSize(calculateStorageSize());
    }
  }, [
    jsonValidateContent,
    xmlValidateContent,
    jsonCompareLeft,
    jsonCompareRight,
    xmlCompareLeft,
    xmlCompareRight,
    textCompareLeft,
    textCompareRight,
    ignoreWhitespace,
    caseSensitive,
    ignoreKeyOrder,
    ignoreArrayOrder,
    ignoreAttributeOrder,
    activeTab,
    isInitialLoadComplete,
  ]);

  // Load from localStorage after component mounts (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedJsonValidate = localStorage.getItem('jsonValidateContent');
        const savedXmlValidate = localStorage.getItem('xmlValidateContent');
        const savedJsonLeft = localStorage.getItem('jsonCompareLeft');
        const savedJsonRight = localStorage.getItem('jsonCompareRight');
        const savedXmlLeft = localStorage.getItem('xmlCompareLeft');
        const savedXmlRight = localStorage.getItem('xmlCompareRight');
        const savedTextLeft = localStorage.getItem('textCompareLeft');
        const savedTextRight = localStorage.getItem('textCompareRight');

        // Load toggle states
        const savedIgnoreWhitespace = localStorage.getItem('ignoreWhitespace');
        const savedCaseSensitive = localStorage.getItem('caseSensitive');
        const savedIgnoreKeyOrder = localStorage.getItem('ignoreKeyOrder');
        const savedIgnoreArrayOrder = localStorage.getItem('ignoreArrayOrder');
        const savedIgnoreAttributeOrder = localStorage.getItem('ignoreAttributeOrder');

        if (savedJsonValidate) setJsonValidateContent(savedJsonValidate);
        if (savedXmlValidate) setXmlValidateContent(savedXmlValidate);
        if (savedJsonLeft) setJsonCompareLeft(savedJsonLeft);
        if (savedJsonRight) setJsonCompareRight(savedJsonRight);
        if (savedXmlLeft) setXmlCompareLeft(savedXmlLeft);
        if (savedXmlRight) setXmlCompareRight(savedXmlRight);
        if (savedTextLeft) setTextCompareLeft(savedTextLeft);
        if (savedTextRight) setTextCompareRight(savedTextRight);

        // Set toggle states with defaults if not saved
        if (savedIgnoreWhitespace !== null) setIgnoreWhitespace(savedIgnoreWhitespace === 'true');
        if (savedCaseSensitive !== null) setCaseSensitive(savedCaseSensitive === 'true');
        if (savedIgnoreKeyOrder !== null) setIgnoreKeyOrder(savedIgnoreKeyOrder === 'true');
        if (savedIgnoreArrayOrder !== null) setIgnoreArrayOrder(savedIgnoreArrayOrder === 'true');
        if (savedIgnoreAttributeOrder !== null) setIgnoreAttributeOrder(savedIgnoreAttributeOrder === 'true');

        // Mark initial load as complete and calculate initial storage size
        setStorageSize(calculateStorageSize());
        setIsInitialLoadComplete(true);
      } catch {
        // Silently fail - localStorage might be disabled
        setStorageSize(calculateStorageSize());
        setIsInitialLoadComplete(true);
      }
    }
  }, []);

  // State for results
  const [validationResult, setValidationResult] = useState<ValidationResult | undefined>(undefined);
  const [jsonComparisonResult, setJsonComparisonResult] = useState<ComparisonResult | undefined>(undefined);
  const [xmlComparisonResult, setXmlComparisonResult] = useState<ComparisonResult | undefined>(undefined);
  const [textComparisonResult, setTextComparisonResult] = useState<ComparisonResult | undefined>(undefined);

  // State for loading
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Auto-save to localStorage whenever content changes
  useEffect(() => {
    saveToLocalStorage('jsonValidateContent', jsonValidateContent);
    if (!jsonValidateContent) {
      setValidationResult(prev => prev ? undefined : prev);
    }
  }, [jsonValidateContent]);

  useEffect(() => {
    saveToLocalStorage('xmlValidateContent', xmlValidateContent);
    if (!xmlValidateContent) {
      setValidationResult(prev => prev ? undefined : prev);
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

  // Auto-clear JSON Compare results when either side is empty
  useEffect(() => {
    if (!jsonCompareLeft.trim() || !jsonCompareRight.trim()) {
      setValidationResult(prev => prev ? undefined : prev);
      setJsonComparisonResult(prev => prev ? undefined : prev);
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

  // Auto-clear XML Compare results when either side is empty
  useEffect(() => {
    if (!xmlCompareLeft.trim() || !xmlCompareRight.trim()) {
      setValidationResult(prev => prev ? undefined : prev);
      setXmlComparisonResult(prev => prev ? undefined : prev);
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

  // Auto-clear Text Compare results when either side is empty
  useEffect(() => {
    if (!textCompareLeft.trim() || !textCompareRight.trim()) {
      setValidationResult(prev => prev ? undefined : prev);
      setTextComparisonResult(prev => prev ? undefined : prev);
    }
  }, [textCompareLeft, textCompareRight]);

  useEffect(() => {
    saveToLocalStorage('activeTab', activeTab);
  }, [activeTab]);

  // Save toggle states to localStorage (only after initial load)
  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('ignoreWhitespace', String(ignoreWhitespace));
    }
  }, [ignoreWhitespace, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('caseSensitive', String(caseSensitive));
    }
  }, [caseSensitive, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('ignoreKeyOrder', String(ignoreKeyOrder));
    }
  }, [ignoreKeyOrder, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('ignoreArrayOrder', String(ignoreArrayOrder));
    }
  }, [ignoreArrayOrder, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete) {
      saveToLocalStorage('ignoreAttributeOrder', String(ignoreAttributeOrder));
    }
  }, [ignoreAttributeOrder, isInitialLoadComplete]);

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

    // Reset toggle states to defaults
    setIgnoreWhitespace(false);
    setCaseSensitive(true); // Default ON
    setIgnoreKeyOrder(false);
    setIgnoreArrayOrder(false);
    setIgnoreAttributeOrder(false);

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

      // Set toggle states to defaults in localStorage
      localStorage.setItem('ignoreWhitespace', 'false');
      localStorage.setItem('caseSensitive', 'true');
      localStorage.setItem('ignoreKeyOrder', 'false');
      localStorage.setItem('ignoreArrayOrder', 'false');
      localStorage.setItem('ignoreAttributeOrder', 'false');

      // Update storage size after clearing
      setStorageSize(calculateStorageSize());
    }
  };

  const handleValidateJSON = () => {
    // Warn about large content
    const sizeInMB = new Blob([jsonValidateContent]).size / (1024 * 1024);
    if (sizeInMB > 0.5) {
      const confirmed = window.confirm(
        `This content is ${sizeInMB.toFixed(2)}MB. Processing may take a moment. Continue?`
      );
      if (!confirmed) return;
    }

    setIsProcessing(true);
    setProcessingMessage('Validating JSON...');

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

  const handleValidateXML = () => {
    // Warn about large content
    const sizeInMB = new Blob([xmlValidateContent]).size / (1024 * 1024);
    if (sizeInMB > 0.5) {
      const confirmed = window.confirm(
        `This content is ${sizeInMB.toFixed(2)}MB. Processing may take a moment. Continue?`
      );
      if (!confirmed) return;
    }

    setIsProcessing(true);
    setProcessingMessage('Validating XML...');

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
    // Clear any previous results first
    setValidationResult(undefined);
    setJsonComparisonResult(undefined);

    // Check if both inputs are provided
    if (!jsonCompareLeft.trim() || !jsonCompareRight.trim()) {
      // Don't show error if content is being cleared, just return silently
      return;
    }

    // Validate that both inputs are valid JSON objects or arrays (not plain strings/primitives)
    const errors: string[] = [];

    try {
      const leftParsed = JSON.parse(jsonCompareLeft);
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
      const rightParsed = JSON.parse(jsonCompareRight);
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
      return;
    }

    // Warn about large content
    const totalSize = (new Blob([jsonCompareLeft]).size + new Blob([jsonCompareRight]).size) / (1024 * 1024);
    if (totalSize > 1) {
      const confirmed = window.confirm(
        `Combined content size is ${totalSize.toFixed(2)}MB. Processing may take a moment. Continue?`
      );
      if (!confirmed) return;
    }

    setIsProcessing(true);
    setProcessingMessage('Comparing JSON...');

    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          const result = compareJSON(jsonCompareLeft, jsonCompareRight, {
            ignoreWhitespace,
            caseSensitive,
            ignoreKeyOrder,
            ignoreArrayOrder,
          });
          setJsonComparisonResult(result);
          setValidationResult(undefined);
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 50);
    });
  };

  const handleCompareXML = () => {
    // Clear any previous validation results first
    setValidationResult(undefined);

    // Warn about large content
    const totalSize = (new Blob([xmlCompareLeft]).size + new Blob([xmlCompareRight]).size) / (1024 * 1024);
    if (totalSize > 1) {
      const confirmed = window.confirm(
        `Combined content size is ${totalSize.toFixed(2)}MB. Processing may take a moment. Continue?`
      );
      if (!confirmed) return;
    }

    setIsProcessing(true);
    setProcessingMessage('Comparing XML...');

    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          const result = compareXML(xmlCompareLeft, xmlCompareRight, {
            ignoreWhitespace,
            caseSensitive,
            ignoreAttributeOrder,
          });
          setXmlComparisonResult(result);
          setValidationResult(undefined);
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 50);
    });
  };

  const handleCompareText = () => {
    // Clear any previous validation results first
    setValidationResult(undefined);

    // Warn about large content
    const totalSize = (new Blob([textCompareLeft]).size + new Blob([textCompareRight]).size) / (1024 * 1024);
    if (totalSize > 1) {
      const confirmed = window.confirm(
        `Combined content size is ${totalSize.toFixed(2)}MB. Processing may take a moment. Continue?`
      );
      if (!confirmed) return;
    }

    setIsProcessing(true);
    setProcessingMessage('Comparing text...');

    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          const result = compareText(textCompareLeft, textCompareRight, {
            ignoreWhitespace,
            caseSensitive,
          });
          setTextComparisonResult(result);
          setValidationResult(undefined);
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 50);
    });
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
    downloadContent(jsonValidateContent, `json-validate-${timestamp}.json`, 'json');
  };

  const handleDownloadXML = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    downloadContent(xmlValidateContent, `xml-validate-${timestamp}.xml`, 'xml');
  };

  const handleCopyToClipboard = async (content: string, label: string = 'Content') => {
    try {
      await navigator.clipboard.writeText(content);
      showSuccess('Copied!', `${label} copied to clipboard successfully`);
    } catch {
      showError('Copy Failed', 'Failed to copy content to clipboard');
    }
  };

  const handlePasteFromClipboard = async (setter: (content: string) => void, label: string = 'Content') => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setter(text);
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
    setJsonValidateContent('');
    setValidationResult(undefined);
    // Reset toggles to defaults: Only Case Sensitive ON, all others OFF
    setIgnoreWhitespace(false);
    setCaseSensitive(true);
    setIgnoreKeyOrder(false);
    setIgnoreArrayOrder(false);
  };

  const handleResetXMLValidate = () => {
    setXmlValidateContent('');
    setValidationResult(undefined);
    // Reset toggles to defaults: Only Case Sensitive ON, all others OFF
    setIgnoreWhitespace(false);
    setCaseSensitive(true);
    setIgnoreAttributeOrder(false);
  };

  const handleResetJSONCompare = () => {
    setJsonCompareLeft('');
    setJsonCompareRight('');
    setJsonComparisonResult(undefined);
    // Reset toggles to defaults: Only Case Sensitive ON, all others OFF
    setIgnoreWhitespace(false);
    setCaseSensitive(true);
    setIgnoreKeyOrder(false);
    setIgnoreArrayOrder(false);
  };

  const handleResetXMLCompare = () => {
    setXmlCompareLeft('');
    setXmlCompareRight('');
    setXmlComparisonResult(undefined);
    // Reset toggles to defaults: Only Case Sensitive ON, all others OFF
    setIgnoreWhitespace(false);
    setCaseSensitive(true);
    setIgnoreAttributeOrder(false);
  };

  const handleResetTextCompare = () => {
    setTextCompareLeft('');
    setTextCompareRight('');
    setTextComparisonResult(undefined);
    // Reset toggles to defaults: Only Case Sensitive ON, all others OFF
    setIgnoreWhitespace(false);
    setCaseSensitive(true);
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
              <StorageIndicator>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Storage: {storageSize}
              </StorageIndicator>
            </div>
            <ValidateButtonGroup>
              <ActionButton $variant="secondary" onClick={handleResetJSONValidate} disabled={!jsonValidateContent}>
                <RefreshIcon />
                Reset
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
              <Toggle label="Ignore Whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
              <Toggle label="Case Sensitive" checked={caseSensitive} onChange={setCaseSensitive} />
              <Toggle label="Ignore Key Order" checked={ignoreKeyOrder} onChange={setIgnoreKeyOrder} />
              <Toggle label="Ignore Array Order" checked={ignoreArrayOrder} onChange={setIgnoreArrayOrder} />
              <StorageIndicator>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Storage: {storageSize}
              </StorageIndicator>
            </div>
            <ValidateButtonGroup>
              <ActionButton $variant="secondary" onClick={handleResetJSONCompare} disabled={!jsonCompareLeft && !jsonCompareRight}>
                <RefreshIcon />
                Reset
              </ActionButton>
              <ActionButton $variant="primary" onClick={handleCompareJSON} disabled={!jsonCompareLeft || !jsonCompareRight}>
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
                    downloadContent(jsonCompareLeft, `json-base-version-${timestamp}.json`, 'json');
                  }} disabled={!jsonCompareLeft} title="Download">
                    <DownloadIcon />
                  </ActionButton>
                </div>
                <FileUpload
                  onFileLoad={(content) => {
                    setIsProcessing(true);
                    setProcessingMessage('Loading file content...');
                    setTimeout(() => {
                      setJsonCompareLeft(content);
                      setIsProcessing(false);
                      setProcessingMessage('');
                    }, 100);
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
                    downloadContent(jsonCompareRight, `json-modified-version-${timestamp}.json`, 'json');
                  }} disabled={!jsonCompareRight} title="Download">
                    <DownloadIcon />
                  </ActionButton>
                </div>
                <FileUpload
                  onFileLoad={(content) => {
                    setIsProcessing(true);
                    setProcessingMessage('Loading file content...');
                    setTimeout(() => {
                      setJsonCompareRight(content);
                      setIsProcessing(false);
                      setProcessingMessage('');
                    }, 100);
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
              <StorageIndicator>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Storage: {storageSize}
              </StorageIndicator>
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
              <Toggle label="Ignore Whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
              <Toggle label="Case Sensitive" checked={caseSensitive} onChange={setCaseSensitive} />
              <Toggle label="Ignore Attribute Order" checked={ignoreAttributeOrder} onChange={setIgnoreAttributeOrder} />
              <StorageIndicator>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Storage: {storageSize}
              </StorageIndicator>
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
                    downloadContent(xmlCompareLeft, `xml-base-version-${timestamp}.xml`, 'xml');
                  }} disabled={!xmlCompareLeft} title="Download">
                    <DownloadIcon />
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
                    downloadContent(xmlCompareRight, `xml-modified-version-${timestamp}.xml`, 'xml');
                  }} disabled={!xmlCompareRight} title="Download">
                    <DownloadIcon />
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
              <Toggle label="Ignore Whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
              <Toggle label="Case Sensitive" checked={caseSensitive} onChange={setCaseSensitive} />
              <StorageIndicator>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Storage: {storageSize}
              </StorageIndicator>
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
                    downloadContent(textCompareLeft, `text-base-version-${timestamp}.txt`, 'txt');
                  }} disabled={!textCompareLeft} title="Download">
                    <DownloadIcon />
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
                    downloadContent(textCompareRight, `text-modified-version-${timestamp}.txt`, 'txt');
                  }} disabled={!textCompareRight} title="Download">
                    <DownloadIcon />
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

