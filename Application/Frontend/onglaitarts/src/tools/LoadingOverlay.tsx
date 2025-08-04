import React from 'react';
import { Spin } from 'antd';

interface LoadingOverlayProps {
  showLoad: boolean;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
};

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ showLoad }) => {
  if (!showLoad) return null;

  return (
    <div style={overlayStyle}>
      <Spin tip="Loading..." size="large" />
    </div>
  );
};

export default LoadingOverlay;
