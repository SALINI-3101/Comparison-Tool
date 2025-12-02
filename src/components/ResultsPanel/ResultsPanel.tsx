import React from 'react';
import {
  ResultsContainer,
  ResultsHeader,
  ResultsBody,
  DifferenceItem,
  DifferencePath,
  DifferenceTypeBadge,
  DifferenceValues,
  DifferenceValue,
  ValueLabel,
  ValueContent,
  ErrorMessage,
  SuccessMessage,
  StatisticsRow,
  StatisticBadge,
} from './ResultsPanel.styles';
import { ValidationResult, ComparisonResult } from '@/utils/comparison';

interface ResultsPanelProps {
  validationResult?: ValidationResult;
  comparisonResult?: ComparisonResult;
}

const CheckIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ErrorIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const InfoIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ validationResult, comparisonResult }) => {

  if (validationResult) {
    const status = validationResult.isValid ? 'success' : 'error';
    const Icon = validationResult.isValid ? CheckIcon : ErrorIcon;

    return (
      <ResultsContainer>
        <ResultsHeader $status={status}>
          <Icon />
          {validationResult.message}
        </ResultsHeader>
        <ResultsBody>
          {validationResult.isValid ? (
            <SuccessMessage>
              <CheckIcon />
              Your content is valid and well-formed
            </SuccessMessage>
          ) : (
            <>
              {validationResult.errors.map((error, index) => (
                <ErrorMessage key={index}>{error}</ErrorMessage>
              ))}
              {validationResult.corrections && validationResult.corrections.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  background: '#fee2e2',
                  border: '2px solid #f87171',
                  borderRadius: '8px',
                }}>
                  <div style={{
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ fontSize: '18px' }}>⚠️</span>
                    Attempted Corrections:
                  </div>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '24px',
                    color: '#991b1b',
                  }}>
                    {validationResult.corrections.map((correction, index) => (
                      <li key={index} style={{ marginBottom: '4px', fontFamily: 'monospace', fontSize: '13px' }}>
                        {correction}
                      </li>
                    ))}
                  </ul>
                  <div style={{
                    marginTop: '8px',
                    fontSize: '13px',
                    fontStyle: 'italic',
                    color: '#991b1b',
                  }}>
                    The JSON structure is still invalid after these corrections. Please review the error message above.
                  </div>
                </div>
              )}
            </>
          )}
        </ResultsBody>
      </ResultsContainer>
    );
  }

  if (comparisonResult) {
    const status = comparisonResult.areEqual ? 'success' : 'info';
    const Icon = comparisonResult.areEqual ? CheckIcon : InfoIcon;
    const statistics = comparisonResult.statistics || { added: 0, removed: 0, modified: 0 };
    const hasStatistics = statistics.added > 0 || statistics.removed > 0 || statistics.modified > 0;

    return (
      <ResultsContainer>
        <ResultsHeader $status={status}>
          <Icon />
          {comparisonResult.areEqual ? 'Both contents are identical' : comparisonResult.message}
        </ResultsHeader>
        {hasStatistics && (
          <StatisticsRow>
            {statistics.added > 0 && (
              <StatisticBadge $type="added">
                Added: {statistics.added}
              </StatisticBadge>
            )}
            {statistics.removed > 0 && (
              <StatisticBadge $type="removed">
                Removed: {statistics.removed}
              </StatisticBadge>
            )}
            {statistics.modified > 0 && (
              <StatisticBadge $type="modified">
                Modified: {statistics.modified}
              </StatisticBadge>
            )}
          </StatisticsRow>
        )}
        <ResultsBody>
          {comparisonResult.areEqual ? null : (
            <>
              {comparisonResult.differences.map((diff, index) => {
                // Format the value based on type
                const formatValue = (value: unknown) => {
                  if (value === undefined) return '(undefined)';
                  if (typeof value === 'string') {
                    // For text comparisons, show as-is
                    return value;
                  }
                  // For JSON comparisons, stringify
                  return JSON.stringify(value, null, 2);
                };

                // Check if the value contains HTML markers (<mark>, <div>, <span> tags)
                const hasHTMLMarkers = (value: unknown) => {
                  return typeof value === 'string' && (value.includes('<mark>') || value.includes('<div') || value.includes('<span'));
                };

                const leftValue = formatValue(diff.leftValue);
                const rightValue = formatValue(diff.rightValue);
                const leftHasHTML = hasHTMLMarkers(diff.leftValue);
                const rightHasHTML = hasHTMLMarkers(diff.rightValue);

                // Determine the color for each side based on the difference type
                const leftDiffType = diff.type === 'added' ? undefined : diff.type;
                const rightDiffType = diff.type === 'removed' ? undefined : diff.type === 'added' ? 'added' : diff.type;

                return (
                  <DifferenceItem key={index} $diffType={diff.type}>
                    <DifferencePath>
                      <span>{diff.path}</span>
                      <DifferenceTypeBadge $type={diff.type}>{diff.type}</DifferenceTypeBadge>
                    </DifferencePath>
                    <DifferenceValues>
                      <DifferenceValue $type="left" $diffType={leftDiffType}>
                        <ValueLabel>Base Version</ValueLabel>
                        {leftHasHTML ? (
                          <ValueContent $diffType={leftDiffType} dangerouslySetInnerHTML={{ __html: leftValue }} />
                        ) : (
                          <ValueContent $diffType={leftDiffType}>{leftValue}</ValueContent>
                        )}
                      </DifferenceValue>
                      <DifferenceValue $type="right" $diffType={rightDiffType}>
                        <ValueLabel>Modified Version</ValueLabel>
                        {rightHasHTML ? (
                          <ValueContent $diffType={rightDiffType} dangerouslySetInnerHTML={{ __html: rightValue }} />
                        ) : (
                          <ValueContent $diffType={rightDiffType}>{rightValue}</ValueContent>
                        )}
                      </DifferenceValue>
                    </DifferenceValues>
                  </DifferenceItem>
                );
              })}
            </>
          )}
        </ResultsBody>
      </ResultsContainer>
    );
  }

  return null;
};
