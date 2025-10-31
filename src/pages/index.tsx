import React, { useState, useContext } from 'react';
import Head from 'next/head';
import { Tabs, TabItem } from '@/components/Tabs';
import { TextArea } from '@/components/TextArea';
import { Toggle } from '@/components/Toggle';
import { ResultsPanel } from '@/components/ResultsPanel';
import { FileUpload } from '@/components/FileUpload';
import { RefreshIcon, PlayIcon, CompareIcon, SunIcon, MoonIcon } from '@/components/Icons';
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
  ButtonRow,
} from '@/components/ComparisonTool';
import { ThemeContext } from './_app';
import {
  validateJSON,
  validateXML,
  compareJSON,
  compareXML,
  compareText,
  ValidationResult,
  ComparisonResult,
} from '@/utils/comparison';

export default function ComparisonTool() {
  const { themeMode, toggleTheme } = useContext(ThemeContext);
  const { showError } = useToast();
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

  // State for results
  const [validationResult, setValidationResult] = useState<ValidationResult | undefined>(undefined);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | undefined>(undefined);

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
    setComparisonResult(undefined);
  };

  const handleValidateJSON = () => {
    const result = validateJSON(jsonValidateContent);
    setValidationResult(result);
    setComparisonResult(undefined);
  };

  const handleValidateXML = () => {
    const result = validateXML(xmlValidateContent);
    setValidationResult(result);
    setComparisonResult(undefined);
  };

  const handleCompareJSON = () => {
    const result = compareJSON(jsonCompareLeft, jsonCompareRight, {
      ignoreWhitespace,
      caseSensitive,
      ignoreKeyOrder,
    });
    setComparisonResult(result);
    setValidationResult(undefined);
  };

  const handleCompareXML = () => {
    const result = compareXML(xmlCompareLeft, xmlCompareRight, {
      ignoreWhitespace,
      caseSensitive,
    });
    setComparisonResult(result);
    setValidationResult(undefined);
  };

  const handleCompareText = () => {
    const result = compareText(textCompareLeft, textCompareRight, {
      ignoreWhitespace,
      caseSensitive,
    });
    setComparisonResult(result);
    setValidationResult(undefined);
  };

  const handleTabChange = () => {
    setValidationResult(undefined);
    setComparisonResult(undefined);
  };

  const tabs: TabItem[] = [
    {
      key: 'json-validate',
      label: 'JSON Validate',
      content: (
        <>
          <InputSection>
            <SectionTitle>Input Content</SectionTitle>
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
          <ButtonRow>
            <ActionButton variant="primary" onClick={handleValidateJSON}>
              <PlayIcon />
              Validate
            </ActionButton>
          </ButtonRow>
          {validationResult && <ResultsPanel validationResult={validationResult} />}
        </>
      ),
    },
    {
      key: 'json-compare',
      label: 'JSON Compare',
      content: (
        <>
          <OptionsRow>
            <Toggle label="Ignore Whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
            <Toggle label="Case Sensitive" checked={caseSensitive} onChange={setCaseSensitive} />
            <Toggle label="Ignore Key Order" checked={ignoreKeyOrder} onChange={setIgnoreKeyOrder} />
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
          <ButtonRow>
            <ActionButton variant="primary" onClick={handleCompareJSON}>
              <CompareIcon />
              Compare
            </ActionButton>
          </ButtonRow>
          {comparisonResult && <ResultsPanel comparisonResult={comparisonResult} />}
        </>
      ),
    },
    {
      key: 'xml-validate',
      label: 'XML Validate',
      content: (
        <>
          <InputSection>
            <SectionTitle>Input Content</SectionTitle>
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
          <ButtonRow>
            <ActionButton variant="primary" onClick={handleValidateXML}>
              <PlayIcon />
              Validate
            </ActionButton>
          </ButtonRow>
          {validationResult && <ResultsPanel validationResult={validationResult} />}
        </>
      ),
    },
    {
      key: 'xml-compare',
      label: 'XML Compare',
      content: (
        <>
          <OptionsRow>
            <Toggle label="Ignore Whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
            <Toggle label="Case Sensitive" checked={caseSensitive} onChange={setCaseSensitive} />
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
          <ButtonRow>
            <ActionButton variant="primary" onClick={handleCompareXML}>
              <CompareIcon />
              Compare
            </ActionButton>
          </ButtonRow>
          {comparisonResult && <ResultsPanel comparisonResult={comparisonResult} />}
        </>
      ),
    },
    {
      key: 'text-compare',
      label: 'Text Compare',
      content: (
        <>
          <OptionsRow>
            <Toggle label="Ignore Whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
            <Toggle label="Case Sensitive" checked={caseSensitive} onChange={setCaseSensitive} />
          </OptionsRow>
          <InputSection>
            <SectionTitle>Input Content</SectionTitle>
            <DualEditorContainer>
              <div>
                <FileUpload
                  onFileLoad={(content) => setTextCompareLeft(content)}
                  acceptedTypes={['.txt', '.json', '.xml']}
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
                  acceptedTypes={['.txt', '.json', '.xml']}
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
          <ButtonRow>
            <ActionButton variant="primary" onClick={handleCompareText}>
              <CompareIcon />
              Compare
            </ActionButton>
          </ButtonRow>
          {comparisonResult && <ResultsPanel comparisonResult={comparisonResult} />}
        </>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>Diff & Validate - Comparison and validation tool</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Compare and validate JSON, XML, and text content locally in your browser" />
      </Head>
      <PageContainer>
        <Header>
          <HeaderContent>
            <Logo>
              <svg viewBox="0 0 24 24" fill="url(#logoGradient)">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </Logo>
            <HeaderText>
              <Title>Diff & Validate</Title>
              <Subtitle>Comparison and validation tool</Subtitle>
            </HeaderText>
            <ThemeToggleButton onClick={toggleTheme} title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
              {themeMode === 'light' ? <MoonIcon /> : <SunIcon />}
            </ThemeToggleButton>
          </HeaderContent>
        </Header>
        <Content>
          <Card>
            <TabsAndClearRow>
              <TabsWrapper>
                <Tabs items={tabs} defaultActiveKey="json-validate" onChange={handleTabChange} />
              </TabsWrapper>
              <ClearButton onClick={handleClearAll}>
                <RefreshIcon />
                Clear All
              </ClearButton>
            </TabsAndClearRow>
          </Card>
        </Content>
      </PageContainer>
    </>
  );
}
