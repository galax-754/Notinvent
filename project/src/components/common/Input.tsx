import React, { forwardRef, InputHTMLAttributes } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  isPassword?: boolean;
  onTogglePassword?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    icon, 
    showPasswordToggle, 
    isPassword, 
    onTogglePassword, 
    className = '', 
    ...props 
  }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={`
              w-full px-4 py-3 border rounded-xl transition-all duration-200
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400
              ${icon ? 'pl-10' : ''}
              ${showPasswordToggle ? 'pr-10' : ''}
              ${error 
                ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50 hover:border-gray-400 dark:hover:border-gray-500'
              }
              ${className}
            `}
            {...props}
          />
          
          {showPasswordToggle && (
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            >
              {isPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        
        {error && (
          <div className="flex items-center space-x-1 mt-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';