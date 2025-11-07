import React, { useState, useContext, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Tabs, TabItem } from '@/components/Tabs';
import { TextArea } from '@/components/TextArea';
import { Toggle } from '@/components/Toggle';
import { ResultsPanel } from '@/components/ResultsPanel';
import { FileUpload } from '@/components/FileUpload';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { RefreshIcon, PlayIcon, CompareIcon, SunIcon, MoonIcon, DownloadIcon } from '@/components/Icons';
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
  TabsAndClearRow,
  TabsWrapper,
  InputSection,
  SectionTitle,
  OptionsRow,
  DualEditorContainer,
  ActionButton,
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
  const { showError } = useToast();

  // Load saved content from localStorage on mount
  const loadFromLocalStorage = (key: string, defaultValue: string = ''): string => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? saved : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // State for validate modes (separate for each type)
  const [jsonValidateContent, setJsonValidateContent] = useState(() => loadFromLocalStorage('jsonValidateContent'));
  const [xmlValidateContent, setXmlValidateContent] = useState(() => loadFromLocalStorage('xmlValidateContent'));

  // State for compare modes (separate for each type)
  const [jsonCompareLeft, setJsonCompareLeft] = useState(() => loadFromLocalStorage('jsonCompareLeft'));
  const [jsonCompareRight, setJsonCompareRight] = useState(() => loadFromLocalStorage('jsonCompareRight'));
  const [xmlCompareLeft, setXmlCompareLeft] = useState(() => loadFromLocalStorage('xmlCompareLeft'));
  const [xmlCompareRight, setXmlCompareRight] = useState(() => loadFromLocalStorage('xmlCompareRight'));
  const [textCompareLeft, setTextCompareLeft] = useState(() => loadFromLocalStorage('textCompareLeft'));
  const [textCompareRight, setTextCompareRight] = useState(() => loadFromLocalStorage('textCompareRight'));

  // State for options
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [ignoreKeyOrder, setIgnoreKeyOrder] = useState(false);
  const [ignoreArrayOrder, setIgnoreArrayOrder] = useState(false);
  const [ignoreAttributeOrder, setIgnoreAttributeOrder] = useState(false);

  // State for results
  const [validationResult, setValidationResult] = useState<ValidationResult | undefined>(undefined);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | undefined>(undefined);

  // State for loading
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Save to localStorage when user performs actions (not on every keystroke)
  const saveToLocalStorage = () => {
    if (jsonValidateContent) localStorage.setItem('jsonValidateContent', jsonValidateContent);
    if (xmlValidateContent) localStorage.setItem('xmlValidateContent', xmlValidateContent);
    if (jsonCompareLeft) localStorage.setItem('jsonCompareLeft', jsonCompareLeft);
    if (jsonCompareRight) localStorage.setItem('jsonCompareRight', jsonCompareRight);
    if (xmlCompareLeft) localStorage.setItem('xmlCompareLeft', xmlCompareLeft);
    if (xmlCompareRight) localStorage.setItem('xmlCompareRight', xmlCompareRight);
    if (textCompareLeft) localStorage.setItem('textCompareLeft', textCompareLeft);
    if (textCompareRight) localStorage.setItem('textCompareRight', textCompareRight);
  };

  // Use refs to store latest values without causing re-renders
  const contentRefs = useRef({
    jsonValidateContent: '',
    xmlValidateContent: '',
    jsonCompareLeft: '',
    jsonCompareRight: '',
    xmlCompareLeft: '',
    xmlCompareRight: '',
    textCompareLeft: '',
    textCompareRight: '',
  });

  // Update refs when content changes (this doesn't cause re-renders)
  contentRefs.current = {
    jsonValidateContent,
    xmlValidateContent,
    jsonCompareLeft,
    jsonCompareRight,
    xmlCompareLeft,
    xmlCompareRight,
    textCompareLeft,
    textCompareRight,
  };

  // Save to localStorage before page unload (F5 refresh, close tab, etc.)
  // This only runs once on mount, not on every state change
  useEffect(() => {
    const handleBeforeUnload = () => {
      const content = contentRefs.current;
      if (content.jsonValidateContent) localStorage.setItem('jsonValidateContent', content.jsonValidateContent);
      else localStorage.removeItem('jsonValidateContent');

      if (content.xmlValidateContent) localStorage.setItem('xmlValidateContent', content.xmlValidateContent);
      else localStorage.removeItem('xmlValidateContent');

      if (content.jsonCompareLeft) localStorage.setItem('jsonCompareLeft', content.jsonCompareLeft);
      else localStorage.removeItem('jsonCompareLeft');

      if (content.jsonCompareRight) localStorage.setItem('jsonCompareRight', content.jsonCompareRight);
      else localStorage.removeItem('jsonCompareRight');

      if (content.xmlCompareLeft) localStorage.setItem('xmlCompareLeft', content.xmlCompareLeft);
      else localStorage.removeItem('xmlCompareLeft');

      if (content.xmlCompareRight) localStorage.setItem('xmlCompareRight', content.xmlCompareRight);
      else localStorage.removeItem('xmlCompareRight');

      if (content.textCompareLeft) localStorage.setItem('textCompareLeft', content.textCompareLeft);
      else localStorage.removeItem('textCompareLeft');

      if (content.textCompareRight) localStorage.setItem('textCompareRight', content.textCompareRight);
      else localStorage.removeItem('textCompareRight');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []); // Empty dependency array - only run once on mount

  const handleClearAll = () => {
    // Clear state
    setJsonValidateContent('');
    setXmlValidateContent('');
    setJsonCompareLeft('');
    setJsonCompareRight('');
    setXmlCompareLeft('');
    setXmlCompareRight('');
    setTextCompareLeft('');
    setTextCompareRight('');
    setValidationResult(undefined);
    setComparisonResult(undefined);

    // Clear localStorage
    localStorage.removeItem('jsonValidateContent');
    localStorage.removeItem('xmlValidateContent');
    localStorage.removeItem('jsonCompareLeft');
    localStorage.removeItem('jsonCompareRight');
    localStorage.removeItem('xmlCompareLeft');
    localStorage.removeItem('xmlCompareRight');
    localStorage.removeItem('textCompareLeft');
    localStorage.removeItem('textCompareRight');
  };

  const handleValidateJSON = () => {
    // Save to localStorage before validating
    saveToLocalStorage();

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
          setComparisonResult(undefined);
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 50);
    });
  };

  const handleValidateXML = () => {
    // Save to localStorage before validating
    saveToLocalStorage();

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
          setComparisonResult(undefined);
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 50);
    });
  };

  const handleCompareJSON = () => {
    // Save to localStorage before comparing
    saveToLocalStorage();

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
          setComparisonResult(result);
          setValidationResult(undefined);
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 50);
    });
  };

  const handleCompareXML = () => {
    // Save to localStorage before comparing
    saveToLocalStorage();

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
          setComparisonResult(result);
          setValidationResult(undefined);
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 50);
    });
  };

  const handleCompareText = () => {
    // Save to localStorage before comparing
    saveToLocalStorage();

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
          setComparisonResult(result);
          setValidationResult(undefined);
        } finally {
          setIsProcessing(false);
          setProcessingMessage('');
        }
      }, 50);
    });
  };

  const handleTabChange = () => {
    // Clear all content and results when switching tabs
    setJsonValidateContent('');
    setXmlValidateContent('');
    setJsonCompareLeft('');
    setJsonCompareRight('');
    setXmlCompareLeft('');
    setXmlCompareRight('');
    setTextCompareLeft('');
    setTextCompareRight('');
    setValidationResult(undefined);
    setComparisonResult(undefined);

    // Clear localStorage
    localStorage.removeItem('jsonValidateContent');
    localStorage.removeItem('xmlValidateContent');
    localStorage.removeItem('jsonCompareLeft');
    localStorage.removeItem('jsonCompareRight');
    localStorage.removeItem('xmlCompareLeft');
    localStorage.removeItem('xmlCompareRight');
    localStorage.removeItem('textCompareLeft');
    localStorage.removeItem('textCompareRight');
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
    setComparisonResult(undefined);
  };

  const handleResetXMLCompare = () => {
    setXmlCompareLeft('');
    setXmlCompareRight('');
    setComparisonResult(undefined);
  };

  const handleResetTextCompare = () => {
    setTextCompareLeft('');
    setTextCompareRight('');
    setComparisonResult(undefined);
  };

  const tabs: TabItem[] = [
    {
      key: 'json-validate',
      label: 'JSON Validate',
      content: (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <SectionTitle style={{ margin: 0 }}>Input Content</SectionTitle>
            <div style={{ display: 'flex', gap: '12px' }}>
              <ActionButton variant="primary" onClick={handleValidateJSON}>
                <PlayIcon />
                Validate
              </ActionButton>
              <ActionButton variant="secondary" onClick={handleDownloadJSON} disabled={!jsonValidateContent}>
                <DownloadIcon />
                Download
              </ActionButton>
              <ActionButton variant="secondary" onClick={handleResetJSONValidate} disabled={!jsonValidateContent}>
                <RefreshIcon />
                Reset
              </ActionButton>
            </div>
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
            <div style={{ display: 'flex', gap: '12px' }}>
              <ActionButton variant="primary" onClick={handleCompareJSON}>
                <CompareIcon />
                Compare
              </ActionButton>
              <ActionButton variant="secondary" onClick={handleResetJSONCompare} disabled={!jsonCompareLeft && !jsonCompareRight}>
                <RefreshIcon />
                Reset
              </ActionButton>
            </div>
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
          {comparisonResult && <ResultsPanel comparisonResult={comparisonResult} />}
        </>
      ),
    },
    {
      key: 'xml-validate',
      label: 'XML Validate',
      content: (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <SectionTitle style={{ margin: 0 }}>Input Content</SectionTitle>
            <div style={{ display: 'flex', gap: '12px' }}>
              <ActionButton variant="primary" onClick={handleValidateXML}>
                <PlayIcon />
                Validate
              </ActionButton>
              <ActionButton variant="secondary" onClick={handleDownloadXML} disabled={!xmlValidateContent}>
                <DownloadIcon />
                Download
              </ActionButton>
              <ActionButton variant="secondary" onClick={handleResetXMLValidate} disabled={!xmlValidateContent}>
                <RefreshIcon />
                Reset
              </ActionButton>
            </div>
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
            <div style={{ display: 'flex', gap: '12px' }}>
              <ActionButton variant="primary" onClick={handleCompareXML}>
                <CompareIcon />
                Compare
              </ActionButton>
              <ActionButton variant="secondary" onClick={handleResetXMLCompare} disabled={!xmlCompareLeft && !xmlCompareRight}>
                <RefreshIcon />
                Reset
              </ActionButton>
            </div>
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
          {comparisonResult && <ResultsPanel comparisonResult={comparisonResult} />}
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
            <div style={{ display: 'flex', gap: '12px' }}>
              <ActionButton variant="primary" onClick={handleCompareText}>
                <CompareIcon />
                Compare
              </ActionButton>
              <ActionButton variant="secondary" onClick={handleResetTextCompare} disabled={!textCompareLeft && !textCompareRight}>
                <RefreshIcon />
                Reset
              </ActionButton>
            </div>
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
          {comparisonResult && <ResultsPanel comparisonResult={comparisonResult} />}
        </>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>Diff & Validate - Comparison and Validation Tool</title>
        <meta name="description" content="Compare and validate JSON, XML, and text files easily" />
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
          </HeaderContent>
        </Header>
        <Content>
          <Card>
            <TabsAndClearRow>
              <TabsWrapper>
                <Tabs items={tabs} onChange={handleTabChange} />
              </TabsWrapper>
              <ClearButton onClick={handleClearAll}>
                <RefreshIcon />
                Clear All
              </ClearButton>
            </TabsAndClearRow>
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

