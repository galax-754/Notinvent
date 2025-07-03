import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  variant = 'error',
  className = '',
}) => {
  const variantClasses = {
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200',
  };

  const iconClasses = {
    error: 'text-red-500 dark:text-red-400',
    warning: 'text-yellow-500 dark:text-yellow-400',
    info: 'text-blue-500 dark:text-blue-400',
  };

  return (
    <div className={`
      flex items-start space-x-3 p-4 border rounded-xl
      ${variantClasses[variant]}
      ${className}
    `}>
      <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconClasses[variant]}`} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-relaxed">
          {message}
        </p>
      </div>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`
            flex-shrink-0 p-1 rounded-lg transition-colors duration-200
            hover:bg-white/50 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2
            ${variant === 'error' ? 'focus:ring-red-500' : 
              variant === 'warning' ? 'focus:ring-yellow-500' : 'focus:ring-blue-500'}
          `}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};