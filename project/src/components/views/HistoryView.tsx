import React, { useState } from 'react';
import { History, Search, Calendar, User, FileText, Filter } from 'lucide-react';
import { useNotion } from '../../contexts/NotionContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { HelpTooltip } from '../common/HelpTooltip';
import { format } from 'date-fns';


export const HistoryView: React.FC = () => {
  const { scanHistory } = useNotion();
  const { t} = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConfig, setFilterConfig] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Filter and search logic
  const filteredHistory = scanHistory.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.itemId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesConfig = filterConfig === '' || entry.configurationUsed === filterConfig;
    
    const matchesDate = filterDate === '' || 
      format(new Date(entry.scanTime), 'yyyy-MM-dd') === filterDate;

    return matchesSearch && matchesConfig && matchesDate;
  });

  const uniqueConfigurations = [...new Set(scanHistory.map(entry => entry.configurationUsed))];



  // ✅ NUEVA FUNCIÓN: Formatear fechas para mostrar en vista
  const formatDateForDisplay = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    
    try {
      let date: Date;
      
      // Si es string con formato ISO o YYYY-MM-DD
      if (typeof dateValue === 'string') {
        if (dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
          // Si solo tiene fecha (YYYY-MM-DD), agregar hora por defecto
          if (dateValue.length === 10) {
            date = new Date(dateValue + 'T12:00:00');
          } else {
            date = new Date(dateValue);
          }
        } else {
          date = new Date(dateValue);
        }
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return String(dateValue);
      }
      
      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        return String(dateValue);
      }
      
      // Formatear como DD/MM/YYYY - HH:MM
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} - ${hours}:${minutes}`;
    } catch (error) {
      console.warn('Error formatting date:', dateValue, error);
      return String(dateValue);
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return t('history.justNow');
    if (diffInMinutes < 60) return `${diffInMinutes}${t('history.minutesAgo')}`;
    if (diffInHours < 24) return `${diffInHours}${t('history.hoursAgo')}`;
    if (diffInDays < 7) return `${diffInDays}${t('history.daysAgo')}`;
    return formatDateForDisplay(date); // ✅ USAR LA NUEVA FUNCIÓN
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('history.title')}</h1>
            <p className="text-gray-600">{t('history.subtitle')}</p>
          </div>
          <HelpTooltip content={t('help.history.overview')} />
        </div>
        <div className="text-sm text-gray-600 bg-white/80 backdrop-blur-md px-4 py-2 rounded-lg border border-gray-200/50">
          {filteredHistory.length} {t('history.of')} {scanHistory.length} {t('history.entries')}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-sm mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-medium text-gray-900">{t('history.filters')}</h2>
          <HelpTooltip content={t('help.history.filters')} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">{t('history.searchItems')}</label>
              <HelpTooltip content={t('help.history.searchItems')} />
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 transition-all duration-200"
                placeholder={t('history.searchPlaceholder')}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">{t('history.configuration')}</label>
              <HelpTooltip content={t('help.history.configuration')} />
            </div>
            <select
              value={filterConfig}
              onChange={(e) => setFilterConfig(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 transition-all duration-200"
            >
              <option value="">{t('history.allConfigurations')}</option>
              {uniqueConfigurations.map(config => (
                <option key={config} value={config}>{config}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">{t('history.date')}</label>
              <HelpTooltip content={t('help.history.date')} />
            </div>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
        {filteredHistory.length > 0 ? (
          <div className="divide-y divide-gray-200/50">
            {filteredHistory.map((entry) => (
              <div key={entry.id} className="p-6 hover:bg-gray-50/50 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {typeof entry.itemName === 'object' && entry.itemName !== null && 'number' in entry.itemName
                            ? `Objeto a editar Id: ${(entry.itemName as { number?: string | number }).number ?? entry.itemId}`
                            : entry.itemName}
                        </h3>
                      </div>
                    </div>
                    <div className="ml-13 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {entry.configurationUsed}
                        </span>
                        {entry.fieldsModified.map((field, fieldIndex) => (
                          <span key={fieldIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {field}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDateForDisplay(entry.scanTime)}</span>
                        </div>
                        {entry.user && (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{entry.user}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">{getTimeAgo(new Date(entry.scanTime))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            {scanHistory.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('history.noHistory')}</h3>
                <p className="text-gray-600">{t('history.startScanning')}</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('history.noResults')}</h3>
                <p className="text-gray-600">{t('history.adjustFilters')}</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterConfig('');
                    setFilterDate('');
                  }}
                  className="mt-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                >
                  {t('history.clearFilters')}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {scanHistory.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <p className="text-2xl font-bold text-gray-900">{scanHistory.length}</p>
              <HelpTooltip content={t('help.history.totalScans')} />
            </div>
            <p className="text-sm text-gray-600">{t('history.totalScans')}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <p className="text-2xl font-bold text-gray-900">{uniqueConfigurations.length}</p>
              <HelpTooltip content={t('help.history.configurationsUsed')} />
            </div>
            <p className="text-sm text-gray-600">{t('history.configurationsUsed')}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <p className="text-2xl font-bold text-gray-900">
                {[...new Set(scanHistory.map(entry => entry.itemId))].length}
              </p>
              <HelpTooltip content={t('help.history.uniqueItems')} />
            </div>
            <p className="text-sm text-gray-600">{t('history.uniqueItems')}</p>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
