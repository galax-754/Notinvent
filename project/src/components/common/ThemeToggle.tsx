import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

export const ThemeToggle: React.FC = () => {
  const { theme, actualTheme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
    }
  };

  const getTooltip = () => {
    switch (theme) {
      case 'light':
        return t('theme.light');
      case 'dark':
        return t('theme.dark');
      case 'system':
        return t('theme.system');
      default:
        return t('theme.light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 group"
      title={getTooltip()}
    >
      <div className="relative">
        {getIcon()}
        
        {/* Indicador del tema del sistema */}
        {theme === 'system' && (
          <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-blue-500 border border-white dark:border-gray-900">
            <div className="w-full h-full rounded-full bg-blue-500 animate-pulse" />
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {getTooltip()}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </div>
    </button>
  );
};