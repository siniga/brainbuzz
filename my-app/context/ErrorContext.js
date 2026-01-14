import React, { createContext, useState, useContext } from 'react';
import CustomErrorModal from '../components/CustomErrorModal';

const ErrorContext = createContext();

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);

  const showError = (message) => {
    setError(message);
    setVisible(true);
  };

  const hideError = () => {
    setVisible(false);
    // Optional: Clear error after a short delay so text doesn't pop during fade out
    setTimeout(() => setError(null), 300); 
  };

  return (
    <ErrorContext.Provider value={{ showError, hideError, error, visible }}>
      {children}
      
      <CustomErrorModal 
        visible={visible} 
        message={error} 
        onClose={hideError} 
      />
    </ErrorContext.Provider>
  );
};
