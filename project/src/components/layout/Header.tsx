import React from 'react';
import { Database, Settings, History, LogOut, Menu, X } from 'lucide-react';
import { useNotion } from '../../contexts/NotionContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { ThemeToggle } from '../common/ThemeToggle';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const { isConnected, config, isDemoMode, disconnectFromNotion } = useNotion();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigationItems = [
    { id: 'dashboard', label: t('header.dashboard'), icon: Database },
    { id: 'scan', label: t('header.scan'), icon: Database },
    { id: 'config', label: t('header.configuration'), icon: Settings },
    { id: 'history', label: t('header.history'), icon: History },
  ];

  const handleDisconnect = () => {
    if (window.confirm(isDemoMode ? t('header.exitDemo') : 'Are you sure you want to disconnect?')) {
      disconnectFromNotion();
    }
  };

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3 min-w-0 flex-1 sm:flex-none">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Database className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                {t('header.title')}
              </h1>
              {isConnected && config?.workspaceName && (
                <div className="flex items-center space-x-2">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate max-w-32 sm:max-w-none">
                    {config.workspaceName}
                  </p>
                  {isDemoMode && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex-shrink-0">
                      Demo
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center space-x-2 px-3 xl:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xl:block">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Language Selector - Hidden on small screens */}
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
            
            {/* User Menu */}
            <UserMenu />
            
            {/* Connection Status */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden md:block">
                {isConnected ? (isDemoMode ? t('header.demoMode') : t('header.connected')) : t('header.disconnected')}
              </span>
            </div>
            
            {/* Disconnect Button */}
            {isConnected && (
              <button
                onClick={handleDisconnect}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                title={isDemoMode ? t('header.exitDemo') : t('header.disconnect')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
          <div className="px-4 py-3 space-y-2">
            {/* Language Selector for Mobile */}
            <div className="sm:hidden mb-3">
              <LanguageSelector />
            </div>
            
            {/* Connection Status for Mobile */}
            <div className="sm:hidden flex items-center space-x-2 mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isConnected ? (isDemoMode ? t('header.demoMode') : t('header.connected')) : t('header.disconnected')}
              </span>
            </div>

            {/* Navigation Items */}
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tablet Navigation (md breakpoint) */}
      <div className="hidden md:flex lg:hidden border-t border-gray-200/50 dark:border-gray-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
        <div className="flex justify-around w-full py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 min-w-0 ${
                  isActive
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium truncate max-w-16">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};