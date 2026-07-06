import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ title, message, icon }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-10 text-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <div className="text-6xl mb-4 opacity-50">
        {icon || '🔍'}
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-xs">{message}</p>
    </motion.div>
  );
};

export default EmptyState;
