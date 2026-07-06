import React from 'react';
import { motion } from 'framer-motion';

const ErrorState = ({ message, onRetry }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-800/30 text-center"
    >
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Something went wrong</h3>
      <p className="text-red-600 dark:text-red-500/80 mb-6 max-w-sm">{message || 'We couldn\'t load the data. Please try again later.'}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors shadow-lg shadow-red-600/20"
        >
          Retry
        </button>
      )}
    </motion.div>
  );
};

export default ErrorState;
