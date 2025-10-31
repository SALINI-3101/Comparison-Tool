import React from 'react';
import {
  ResultsContainer,
  ResultsHeader,
  ResultsBody,
  DifferenceItem,
  DifferencePath,
  DifferenceValues,
  DifferenceValue,
  ValueLabel,
  ValueContent,
  ErrorMessage,
  SuccessMessage,
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
            </>
          )}
        </ResultsBody>
      </ResultsContainer>
    );
  }

  if (comparisonResult) {
    const status = comparisonResult.areEqual ? 'success' : 'info';
    const Icon = comparisonResult.areEqual ? CheckIcon : InfoIcon;

    return (
      <ResultsContainer>
        <ResultsHeader $status={status}>
          <Icon />
          {comparisonResult.message}
        </ResultsHeader>
        <ResultsBody>
          {comparisonResult.areEqual ? (
            <SuccessMessage>
              <CheckIcon />
              Both contents are identical
            </SuccessMessage>
          ) : (
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

                return (
                  <DifferenceItem key={index}>
                    <DifferencePath>{diff.path}</DifferencePath>
                    <DifferenceValues>
                      <DifferenceValue $type="left">
                        <ValueLabel>Left</ValueLabel>
                        <ValueContent>{formatValue(diff.leftValue)}</ValueContent>
                      </DifferenceValue>
                      <DifferenceValue $type="right">
                        <ValueLabel>Right</ValueLabel>
                        <ValueContent>{formatValue(diff.rightValue)}</ValueContent>
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
