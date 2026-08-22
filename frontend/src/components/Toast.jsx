import React, { useState, useCallback } from 'react';

export const useToast = () => {
  const [toast, setToast] = useState({ message: '', visible: false, type: 'success' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  return { toast, showToast };
};

export const Toast = ({ toast }) => {
  return (
    <div className={`toast-notification ${toast.type} ${toast.visible ? 'show' : ''}`}>
      {toast.message}
    </div>
  );
};
