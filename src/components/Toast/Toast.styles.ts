import styled, { keyframes } from 'styled-components';
import { ToastType } from './Toast';

const slideIn = keyframes`
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const getTypeColors = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        backgroundColor: '#10b981',
        border: '#10b981',
        icon: '#d1fae5',
      };
    case 'error':
      return {
        background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
        backgroundColor: '#ec4899',
        border: '#ec4899',
        icon: '#fce7f3',
      };
    case 'warning':
      return {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        backgroundColor: '#f59e0b',
        border: '#f59e0b',
        icon: '#fef3c7',
      };
    case 'info':
      return {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        backgroundColor: '#8b5cf6',
        border: '#8b5cf6',
        icon: '#ede9fe',
      };
    default:
      return {
        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        backgroundColor: '#6b7280',
        border: '#6b7280',
        icon: '#f3f4f6',
      };
  }
};

export const ToastContainer = styled.div<{ type: ToastType }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: ${({ type }) => getTypeColors(type).background};
  background-color: ${({ type }) => getTypeColors(type).backgroundColor};
  border: 1px solid ${({ type }) => getTypeColors(type).border};
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  min-width: 320px;
  max-width: 420px;
  animation: ${slideIn} 0.3s ease-out;
  color: white;
  margin-bottom: 12px;
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    min-width: 280px;
    max-width: calc(100vw - 32px);
  }
`;

export const ToastContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
`;

export const ToastIcon = styled.div<{ type: ToastType }>`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ type }) => getTypeColors(type).icon};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ type }) => getTypeColors(type).backgroundColor};

  svg {
    width: 24px;
    height: 24px;
  }
`;

export const ToastMessage = styled.div`
  flex: 1;
  min-width: 0;
  padding-top: 2px;
`;

export const ToastTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  line-height: 1.4;
`;

export const ToastDescription = styled.div`
  font-size: 13px;
  opacity: 0.95;
  line-height: 1.5;
  word-wrap: break-word;
`;

export const ToastCloseButton = styled.button`
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  opacity: 0.8;

  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.2);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const ToastListContainer = styled.div`
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  @media (max-width: 768px) {
    top: 16px;
    right: 16px;
    left: 16px;
    align-items: stretch;
  }
`;
