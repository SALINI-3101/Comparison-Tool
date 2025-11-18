import React, { useState, useContext, useEffect } from 'react';
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
  ValidationResult,
  ComparisonResult,
} from '@/utils/comparison';

export default function ComparisonTool() {
  const { themeMode, toggleTheme } = useContext(ThemeContext);
  const { showError, showSuccess } = useToast();

  // Helper function to save to localStorage
  const saveToLocalStorage = (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silently fail - localStorage might be disabled
    }
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

  // State for options
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [ignoreKeyOrder, setIgnoreKeyOrder] = useState(false);
  const [ignoreArrayOrder, setIgnoreArrayOrder] = useState(false);
  const [ignoreAttributeOrder, setIgnoreAttributeOrder] = useState(false);

  // State for active tab
  const [activeTab, setActiveTab] = useState('json-validate');

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
        const savedTab = localStorage.getItem('activeTab');

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
        if (savedTab) setActiveTab(savedTab);

        // Set toggle states with defaults if not saved
        if (savedIgnoreWhitespace !== null) setIgnoreWhitespace(savedIgnoreWhitespace === 'true');
        if (savedCaseSensitive !== null) setCaseSensitive(savedCaseSensitive === 'true');
        if (savedIgnoreKeyOrder !== null) setIgnoreKeyOrder(savedIgnoreKeyOrder === 'true');
        if (savedIgnoreArrayOrder !== null) setIgnoreArrayOrder(savedIgnoreArrayOrder === 'true');
        if (savedIgnoreAttributeOrder !== null) setIgnoreAttributeOrder(savedIgnoreAttributeOrder === 'true');
      } catch {
        // Silently fail - localStorage might be disabled
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
      setValidationResult(undefined);
    }
  }, [jsonValidateContent]);

  useEffect(() => {
    saveToLocalStorage('xmlValidateContent', xmlValidateContent);
    if (!xmlValidateContent) {
      setValidationResult(undefined);
    }
  }, [xmlValidateContent]);

  useEffect(() => {
    saveToLocalStorage('jsonCompareLeft', jsonCompareLeft);
  }, [jsonCompareLeft]);

  useEffect(() => {
    saveToLocalStorage('jsonCompareRight', jsonCompareRight);
  }, [jsonCompareRight]);

  useEffect(() => {
    saveToLocalStorage('xmlCompareLeft', xmlCompareLeft);
  }, [xmlCompareLeft]);

  useEffect(() => {
    saveToLocalStorage('xmlCompareRight', xmlCompareRight);
  }, [xmlCompareRight]);

  useEffect(() => {
    saveToLocalStorage('textCompareLeft', textCompareLeft);
  }, [textCompareLeft]);

  useEffect(() => {
    saveToLocalStorage('textCompareRight', textCompareRight);
  }, [textCompareRight]);

  useEffect(() => {
    saveToLocalStorage('activeTab', activeTab);
  }, [activeTab]);

  // Save toggle states to localStorage
  useEffect(() => {
    saveToLocalStorage('ignoreWhitespace', String(ignoreWhitespace));
  }, [ignoreWhitespace]);

  useEffect(() => {
    saveToLocalStorage('caseSensitive', String(caseSensitive));
  }, [caseSensitive]);

  useEffect(() => {
    saveToLocalStorage('ignoreKeyOrder', String(ignoreKeyOrder));
  }, [ignoreKeyOrder]);

  useEffect(() => {
    saveToLocalStorage('ignoreArrayOrder', String(ignoreArrayOrder));
  }, [ignoreArrayOrder]);

  useEffect(() => {
    saveToLocalStorage('ignoreAttributeOrder', String(ignoreAttributeOrder));
  }, [ignoreAttributeOrder]);

  // Clear JSON comparison result when both JSON compare fields become empty
  useEffect(() => {
    if (!jsonCompareLeft && !jsonCompareRight) {
      setJsonComparisonResult(undefined);
    }
  }, [jsonCompareLeft, jsonCompareRight]);

  // Clear XML comparison result when both XML compare fields become empty
  useEffect(() => {
    if (!xmlCompareLeft && !xmlCompareRight) {
      setXmlComparisonResult(undefined);
    }
  }, [xmlCompareLeft, xmlCompareRight]);

  // Clear text comparison result when both text compare fields become empty
  useEffect(() => {
    if (!textCompareLeft && !textCompareRight) {
      setTextComparisonResult(undefined);
    }
  }, [textCompareLeft, textCompareRight]);

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

    // Clear all from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jsonValidateContent');
      localStorage.removeItem('xmlValidateContent');
      localStorage.removeItem('jsonCompareLeft');
      localStorage.removeItem('jsonCompareRight');
      localStorage.removeItem('xmlCompareLeft');
      localStorage.removeItem('xmlCompareRight');
      localStorage.removeItem('textCompareLeft');
      localStorage.removeItem('textCompareRight');
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
  };

  const handleResetXMLValidate = () => {
    setXmlValidateContent('');
    setValidationResult(undefined);
  };

  const handleResetJSONCompare = () => {
    setJsonCompareLeft('');
    setJsonCompareRight('');
    setJsonComparisonResult(undefined);
  };

  const handleResetXMLCompare = () => {
    setXmlCompareLeft('');
    setXmlCompareRight('');
    setXmlComparisonResult(undefined);
  };

  const handleResetTextCompare = () => {
    setTextCompareLeft('');
    setTextCompareRight('');
    setTextComparisonResult(undefined);
  };

  const tabs: TabItem[] = [
    {
      key: 'json-validate',
      label: 'JSON Validate',
      content: (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <SectionTitle style={{ margin: 0, paddingTop: '8px' }}>Input Content</SectionTitle>
            <ValidateButtonGroup>
              <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setJsonValidateContent, 'JSON content')}>
                <ClipboardIcon />
                Paste
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => handleCopyToClipboard(jsonValidateContent, 'JSON content')} disabled={!jsonValidateContent}>
                <CopyIcon />
                Copy
              </ActionButton>
              <ActionButton $variant="secondary" onClick={handleDownloadJSON} disabled={!jsonValidateContent}>
                <DownloadIcon />
                Download
              </ActionButton>
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
            <FileUpload
              onFileLoad={(content) => setJsonValidateContent(content)}
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
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <Toggle label="Ignore Whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
              <Toggle label="Case Sensitive" checked={caseSensitive} onChange={setCaseSensitive} />
              <Toggle label="Ignore Key Order" checked={ignoreKeyOrder} onChange={setIgnoreKeyOrder} />
              <Toggle label="Ignore Array Order" checked={ignoreArrayOrder} onChange={setIgnoreArrayOrder} />
            </div>
            <ValidateButtonGroup>
              <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setJsonCompareLeft, 'Left content')}>
                <ClipboardIcon />
                Paste Left
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setJsonCompareRight, 'Right content')}>
                <ClipboardIcon />
                Paste Right
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => {
                const combinedContent = `Left:\n${jsonCompareLeft}\n\nRight:\n${jsonCompareRight}`;
                handleCopyToClipboard(combinedContent, 'JSON comparison');
              }} disabled={!jsonCompareLeft && !jsonCompareRight}>
                <CopyIcon />
                Copy
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                const combinedContent = `Left:\n${jsonCompareLeft}\n\nRight:\n${jsonCompareRight}`;
                downloadContent(combinedContent, `json-comparison-${timestamp}.json`, 'json');
              }} disabled={!jsonCompareLeft && !jsonCompareRight}>
                <DownloadIcon />
                Download
              </ActionButton>
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
                <FileUpload
                  onFileLoad={(content) => setJsonCompareLeft(content)}
                  acceptedTypes={['.json']}
                  label="json-compare-left"
                  value={jsonCompareLeft}
                  onError={(message) => showError('Invalid File', message)}
                />
                <TextArea
                  label="Left"
                  labelColor="#a855f7"
                  value={jsonCompareLeft}
                  onChange={setJsonCompareLeft}
                  placeholder="Paste left content..."
                />
              </div>
              <div>
                <FileUpload
                  onFileLoad={(content) => setJsonCompareRight(content)}
                  acceptedTypes={['.json']}
                  label="json-compare-right"
                  value={jsonCompareRight}
                  onError={(message) => showError('Invalid File', message)}
                />
                <TextArea
                  label="Right"
                  labelColor="#3b82f6"
                  value={jsonCompareRight}
                  onChange={setJsonCompareRight}
                  placeholder="Paste right content..."
                />
              </div>
            </DualEditorContainer>
          </InputSection>
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
            <SectionTitle style={{ margin: 0, paddingTop: '8px' }}>Input Content</SectionTitle>
            <ValidateButtonGroup>
              <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setXmlValidateContent, 'XML content')}>
                <ClipboardIcon />
                Paste
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => handleCopyToClipboard(xmlValidateContent, 'XML content')} disabled={!xmlValidateContent}>
                <CopyIcon />
                Copy
              </ActionButton>
              <ActionButton $variant="secondary" onClick={handleDownloadXML} disabled={!xmlValidateContent}>
                <DownloadIcon />
                Download
              </ActionButton>
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
            <FileUpload
              onFileLoad={(content) => setXmlValidateContent(content)}
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
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <Toggle label="Ignore Whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
              <Toggle label="Case Sensitive" checked={caseSensitive} onChange={setCaseSensitive} />
              <Toggle label="Ignore Attribute Order" checked={ignoreAttributeOrder} onChange={setIgnoreAttributeOrder} />
            </div>
            <ValidateButtonGroup>
              <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setXmlCompareLeft, 'Left content')}>
                <ClipboardIcon />
                Paste Left
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setXmlCompareRight, 'Right content')}>
                <ClipboardIcon />
                Paste Right
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => {
                const combinedContent = `Left:\n${xmlCompareLeft}\n\nRight:\n${xmlCompareRight}`;
                handleCopyToClipboard(combinedContent, 'XML comparison');
              }} disabled={!xmlCompareLeft && !xmlCompareRight}>
                <CopyIcon />
                Copy
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                const combinedContent = `Left:\n${xmlCompareLeft}\n\nRight:\n${xmlCompareRight}`;
                downloadContent(combinedContent, `xml-comparison-${timestamp}.xml`, 'xml');
              }} disabled={!xmlCompareLeft && !xmlCompareRight}>
                <DownloadIcon />
                Download
              </ActionButton>
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
                <FileUpload
                  onFileLoad={(content) => setXmlCompareLeft(content)}
                  acceptedTypes={['.xml']}
                  label="xml-compare-left"
                  value={xmlCompareLeft}
                  onError={(message) => showError('Invalid File', message)}
                />
                <TextArea
                  label="Left"
                  labelColor="#a855f7"
                  value={xmlCompareLeft}
                  onChange={setXmlCompareLeft}
                  placeholder="Paste left content..."
                />
              </div>
              <div>
                <FileUpload
                  onFileLoad={(content) => setXmlCompareRight(content)}
                  acceptedTypes={['.xml']}
                  label="xml-compare-right"
                  value={xmlCompareRight}
                  onError={(message) => showError('Invalid File', message)}
                />
                <TextArea
                  label="Right"
                  labelColor="#3b82f6"
                  value={xmlCompareRight}
                  onChange={setXmlCompareRight}
                  placeholder="Paste right content..."
                />
              </div>
            </DualEditorContainer>
          </InputSection>
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
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <Toggle label="Ignore Whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
              <Toggle label="Case Sensitive" checked={caseSensitive} onChange={setCaseSensitive} />
            </div>
            <ValidateButtonGroup>
              <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setTextCompareLeft, 'Left content')}>
                <ClipboardIcon />
                Paste Left
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => handlePasteFromClipboard(setTextCompareRight, 'Right content')}>
                <ClipboardIcon />
                Paste Right
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => {
                const combinedContent = `Left:\n${textCompareLeft}\n\nRight:\n${textCompareRight}`;
                handleCopyToClipboard(combinedContent, 'Text comparison');
              }} disabled={!textCompareLeft && !textCompareRight}>
                <CopyIcon />
                Copy
              </ActionButton>
              <ActionButton $variant="secondary" onClick={() => {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                const combinedContent = `Left:\n${textCompareLeft}\n\nRight:\n${textCompareRight}`;
                downloadContent(combinedContent, `text-comparison-${timestamp}.txt`, 'txt');
              }} disabled={!textCompareLeft && !textCompareRight}>
                <DownloadIcon />
                Download
              </ActionButton>
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
                <FileUpload
                  onFileLoad={(content) => setTextCompareLeft(content)}
                  acceptedTypes={['.txt']}
                  label="text-compare-left"
                  value={textCompareLeft}
                  onError={(message) => showError('Invalid File', message)}
                />
                <TextArea
                  label="Left"
                  labelColor="#a855f7"
                  value={textCompareLeft}
                  onChange={setTextCompareLeft}
                  placeholder="Paste left content..."
                />
              </div>
              <div>
                <FileUpload
                  onFileLoad={(content) => setTextCompareRight(content)}
                  acceptedTypes={['.txt']}
                  label="text-compare-right"
                  value={textCompareRight}
                  onError={(message) => showError('Invalid File', message)}
                />
                <TextArea
                  label="Right"
                  labelColor="#3b82f6"
                  value={textCompareRight}
                  onChange={setTextCompareRight}
                  placeholder="Paste right content..."
                />
              </div>
            </DualEditorContainer>
          </InputSection>
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
              <RefreshIcon />
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

