import React from 'react';
import { Languages, ChevronDown } from 'lucide-react';
import { useLanguage, Language } from '../../contexts/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);

  const languages = [
    { code: 'es-MX' as Language, name: 'Español (México)', flag: '🇲🇽' },
    { code: 'en-US' as Language, name: 'English (US)', flag: '🇺🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        <Languages className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-base sm:text-lg">{currentLanguage?.flag}</span>
        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
          {currentLanguage?.code === 'es-MX' ? 'ES' : 'EN'}
        </span>
        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg z-20 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ${
                  language === lang.code ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-lg sm:text-xl">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">{lang.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{lang.code}</p>
                </div>
                {language === lang.code && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};