import React from 'react';
import { Overlay, LoadingCard, Spinner, LoadingText, LoadingSubtext } from './LoadingOverlay.styles';

interface LoadingOverlayProps {
  message?: string;
  subtext?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Processing...',
  subtext = 'Please wait while we process your request',
}) => {
  return (
    <Overlay>
      <LoadingCard>
        <Spinner />
        <LoadingText>{message}</LoadingText>
        <LoadingSubtext>{subtext}</LoadingSubtext>
      </LoadingCard>
    </Overlay>
  );
};
