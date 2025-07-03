import React, { useState } from 'react';
import { Database, Key, Globe, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useNotion } from '../../contexts/NotionContext';
import { useLanguage } from '../../contexts/LanguageContext';

export const ConnectionView: React.FC = () => {
  const { connectToNotion, enableDemoMode, isLoading } = useNotion();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    token: '',
    databaseId: '',
    workspaceName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    if (!formData.token.trim()) {
      newErrors.token = t('connection.tokenRequired');
    }
    if (!formData.databaseId.trim()) {
      newErrors.databaseId = t('connection.databaseIdRequired');
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const success = await connectToNotion(formData);
    if (success) {
      setFormData({ token: '', databaseId: '', workspaceName: '' });
      setErrors({});
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDemoMode = () => {
    enableDemoMode();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('connection.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400">{t('connection.subtitle')}</p>
          </div>

          {/* Demo Mode Button */}
          <div className="mb-6">
            <button
              onClick={handleDemoMode}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-6 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
            >
              <Sparkles className="w-5 h-5" />
              <span>{t('connection.demoButton')}</span>
            </button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              {t('connection.demoSubtitle')}
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t('connection.orConnect')}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Key className="w-4 h-4" />
                <span>{t('connection.token')}</span>
              </label>
              <input
                type="password"
                value={formData.token}
                onChange={(e) => handleInputChange('token', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.token ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50'
                } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                placeholder={t('connection.tokenPlaceholder')}
              />
              {errors.token && (
                <p className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.token}</span>
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Database className="w-4 h-4" />
                <span>{t('connection.databaseId')}</span>
              </label>
              <input
                type="text"
                value={formData.databaseId}
                onChange={(e) => handleInputChange('databaseId', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.databaseId ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-700/50'
                } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                placeholder={t('connection.databaseIdPlaceholder')}
              />
              {errors.databaseId && (
                <p className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.databaseId}</span>
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Globe className="w-4 h-4" />
                <span>{t('connection.workspaceName')}</span>
              </label>
              <input
                type="text"
                value={formData.workspaceName}
                onChange={(e) => handleInputChange('workspaceName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder={t('connection.workspaceNamePlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('connection.connecting')}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>{t('connection.connect')}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">{t('connection.setupInstructions')}</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>{t('connection.step1')}</li>
                <li>{t('connection.step2')}</li>
                <li>{t('connection.step3')}</li>
                <li>{t('connection.step4')}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};