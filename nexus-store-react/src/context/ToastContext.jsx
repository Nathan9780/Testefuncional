import React, { createContext, useState, useContext, useCallback, useRef } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  const showToast = useCallback((msg, duration = 2800) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(msg);
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ message, visible, showToast }}>
      {children}
      {visible && <div className="toast show">{message}</div>}
    </ToastContext.Provider>
  );
};