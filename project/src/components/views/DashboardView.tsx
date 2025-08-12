import React from 'react';
import { Package, Scan, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { useNotion } from '../../contexts/NotionContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { HelpTooltip } from '../common/HelpTooltip';
import { getArticuloNombreYNumero } from './ConfigurationView';



export const DashboardView: React.FC = () => {
  const { items, scanHistory, isLoading, refreshDatabase, database } = useNotion();
  const { t} = useLanguage();

  // ✅ SOLUCIÓN: Función helper para convertir valores a string de forma segura
  const safeStringValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'object') {
      // ✅ NUEVO: Manejar objetos de Notion select específicamente
      if (value.name && typeof value.name === 'string') {
        return value.name;
      }
      
      // Si es un objeto con estructura conocida como { prefijo, número }
      if (value.prefix && typeof value.number === 'number') {
        return `${value.prefix}-${value.number}`;
      }
      
      // ✅ NUEVO: Para otros objetos de select, intentar extraer el valor
      if (value.id && value.name) {
        return value.name;
      }
      
      // Para otros objetos, usar JSON.stringify como último recurso
      return JSON.stringify(value);
    }
    
    // Para números, booleanos, etc.
    return String(value);
  };

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
        return safeStringValue(dateValue);
      }
      
      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        return safeStringValue(dateValue);
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
      return safeStringValue(dateValue);
    }
  };

  // ✅ FUNCIÓN MEJORADA: Helper para determinar disponibilidad de stock con debugging extenso
  const getStockAvailability = (item: any) => {
    console.log('🔍 === DASHBOARD STOCK DEBUGGING ===');
    console.log('🔍 Item ID:', safeStringValue(item.properties['ID'] || item.properties['Name']));
    console.log('🔍 Full item properties:', item.properties);
    
    // Buscar el campo de stock con diferentes nombres posibles
    const possibleStockFields = [
      'Stock Available', 
      'stock_available', 
      'Stock', 
      'Available', 
      'En Stock',
      'Disponible',
      'stock',
      'available',
      'Disponibilidad',
      'En_Stock',
      'Stock_Available'
    ];
    
    let stockField = null;
    let stockValue = null;
    
    // 🔍 NUEVO: Mostrar TODOS los campos disponibles
    console.log('🔍 === ALL AVAILABLE FIELDS ===');
    Object.keys(item.properties).forEach(fieldName => {
      const fieldValue = item.properties[fieldName];
      console.log(`🔍 Field "${fieldName}":`, fieldValue, `(type: ${typeof fieldValue})`);
    });
    console.log('🔍 === END ALL FIELDS ===');
    
    for (const fieldName of possibleStockFields) {
      if (item.properties[fieldName] !== undefined) {
        stockField = fieldName;
        stockValue = item.properties[fieldName];
        console.log(`🔍 ✅ FOUND STOCK FIELD: "${fieldName}" with value:`, stockValue);
        break;
      }
    }
    
    if (!stockField) {
      console.log('🔍 ❌ NO STOCK FIELD FOUND in any of these names:', possibleStockFields);
      console.log('🔍 Available field names:', Object.keys(item.properties));
      
      // 🔍 NUEVO: Buscar campos que contengan "stock" o "available" en el nombre
      const fieldsWithStock = Object.keys(item.properties).filter(name => 
        name.toLowerCase().includes('stock') || 
        name.toLowerCase().includes('available') ||
        name.toLowerCase().includes('disponib')
      );
      
      if (fieldsWithStock.length > 0) {
        console.log('🔍 🔍 FOUND FIELDS CONTAINING STOCK/AVAILABLE:', fieldsWithStock);
        stockField = fieldsWithStock[0];
        stockValue = item.properties[stockField];
        console.log(`🔍 Using field "${stockField}" with value:`, stockValue);
      }
    }
    
    console.log('🔍 Final stock field:', stockField);
    console.log('🔍 Final stock value:', stockValue);
    console.log('🔍 Stock value type:', typeof stockValue);
    console.log('🔍 Stock value JSON:', JSON.stringify(stockValue));
    
    if (stockValue === null || stockValue === undefined) {
      console.log('🔍 Stock value is null/undefined, returning false');
      return false;
    }
    
    // Si es boolean, usar directamente
    if (typeof stockValue === 'boolean') {
      console.log('🔍 Stock value is boolean:', stockValue);
      return stockValue;
    }
    
    // Si es string, convertir
    if (typeof stockValue === 'string') {
      const lowerValue = stockValue.toLowerCase().trim();
      console.log('🔍 Stock value as lowercase string:', lowerValue);
      const isTrue = lowerValue === 'true' || lowerValue === 'yes' || lowerValue === 'sí' || lowerValue === '1' || lowerValue === 'checked';
      console.log('🔍 String conversion result:', isTrue);
      return isTrue;
    }
    
    // Si es número, considerar 1 como true, 0 como false
    if (typeof stockValue === 'number') {
      console.log('🔍 Stock value is number:', stockValue);
      const isTrue = stockValue === 1 || stockValue > 0;
      console.log('🔍 Number conversion result:', isTrue);
      return isTrue;
    }
    
    // Si es objeto (como puede venir de Notion), intentar extraer el valor
    if (typeof stockValue === 'object' && stockValue !== null) {
      console.log('🔍 Stock value is object, checking properties...');
      
      // Notion checkbox format
      if (stockValue.checkbox !== undefined) {
        console.log('🔍 Found checkbox property:', stockValue.checkbox);
        return Boolean(stockValue.checkbox);
      }
      
      // Otros formatos posibles
      if (stockValue.value !== undefined) {
        console.log('🔍 Found value property:', stockValue.value);
        return Boolean(stockValue.value);
      }
      
      if (stockValue.checked !== undefined) {
        console.log('🔍 Found checked property:', stockValue.checked);
        return Boolean(stockValue.checked);
      }
      
      // Si el objeto tiene propiedades pero no las esperadas, intentar convertir a string
      console.log('🔍 Object has unexpected structure, converting to string...');
      const stringValue = JSON.stringify(stockValue).toLowerCase();
      if (stringValue.includes('true') || stringValue.includes('"1"') || stringValue.includes('checked')) {
        console.log('🔍 Object string contains truthy values');
        return true;
      }
    }
    
    // Por defecto, false
    console.log('🔍 No valid stock value found, returning false');
    console.log('🔍 === END DASHBOARD STOCK DEBUGGING ===');
    return false;
  };

  // ✅ NUEVO: Usar la función de criterios de atención personalizable - REMOVIDO

  const stats = {
    totalItems: items.length,
    availableItems: items.filter(item => {
      const isAvailable = getStockAvailability(item);
      console.log(`🔍 Item ${safeStringValue(item.properties['ID'] || item.properties['Name'])} - Available: ${isAvailable}`);
      return isAvailable;
    }).length,
    recentScans: scanHistory.length,
  };

  const recentActivity = scanHistory.slice(0, 5);



  // ✅ FUNCIÓN ACTUALIZADA: Usar el nuevo formato de fecha para actividad reciente
  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 sm:p-4 lg:p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-start space-x-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('dashboard.title')}</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{t('dashboard.subtitle')}</p>
            </div>
            <HelpTooltip content={t('help.dashboard.overview')} />
          </div>
          <button
            onClick={refreshDatabase}
            disabled={isLoading}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
          >
            <TrendingUp className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-gray-700 dark:text-gray-300">{t('dashboard.refresh')}</span>
          </button>
        </div>

        {/* Stats Grid - Responsive (solo 3 elementos) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{t('dashboard.totalItems')}</p>
                  <HelpTooltip content={t('help.dashboard.totalItems')} />
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalItems}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{t('dashboard.available')}</p>
                  <HelpTooltip content={t('help.dashboard.available')} />
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">{stats.availableItems}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 dark:bg-green-900/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{t('dashboard.recentScans')}</p>
                  <HelpTooltip content={t('help.dashboard.recentScans')} />
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.recentScans}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <Scan className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:gap-8">
          {/* Recent Activity */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.recentActivity')}</h2>
              <HelpTooltip content={t('help.dashboard.recentActivity')} />
            </div>
            
            {recentActivity.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {activity.itemProperties
                          ? getArticuloNombreYNumero(activity.itemProperties, database)
                          : (typeof activity.itemName === 'object' && activity.itemName !== null
                              ? getArticuloNombreYNumero(activity.itemName, database)
                              : activity.itemName)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {t('dashboard.scannedWith')} {activity.configurationUsed}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDate(activity.scanTime.toISOString())}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                <Scan className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base">{t('dashboard.noActivity')}</p>
                <p className="text-xs sm:text-sm">{t('dashboard.startScanning')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};