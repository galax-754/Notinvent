import React, { useState, useEffect, useRef } from 'react';
import { Scan, Camera, Keyboard, Search, CheckCircle, AlertCircle, RefreshCw, Package, Hash, Shield, MapPin, Calendar, CalendarClock, DollarSign, Mail, ExternalLink, Tag, Tags, Type, Info, CheckSquare, Phone } from 'lucide-react';
import { useNotion } from '../../contexts/NotionContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { HelpTooltip } from '../common/HelpTooltip';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';

export const ScanView: React.FC = () => {
  const { searchItem, updateItem, scanConfigurations, activeDisplayConfig, addScanHistory, isLoading, database } = useNotion();
  const { t } = useLanguage();
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
  const [scannedCode, setScannedCode] = useState('');
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus the input when in manual mode
    if (scanMode === 'manual' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanMode]);

  useEffect(() => {
    if (scanMode === 'camera' && !scannerRef.current) {
      initializeScanner();
    } else if (scanMode === 'manual' && scannerRef.current) {
      cleanupScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [scanMode]);

  const initializeScanner = () => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        handleScan(decodedText);
        setIsScanning(false);
      },
      (error) => {
        // Handle scan errors quietly
        console.warn('Scan error:', error);
      }
    );

    scannerRef.current = scanner;
    setIsScanning(true);
  };

  const cleanupScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  // ✅ SOLUCIÓN: Función helper para convertir valores a string de forma segura
  const safeStringValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'object') {
      // Si es un objeto con estructura conocida como { prefijo, número }
      if (value.prefix && typeof value.number === 'number') {
        return `${value.prefix}-${value.number}`;
      }
      // Para otros objetos, usar JSON.stringify
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
    console.log('🔍 === DEBUGGING STOCK AVAILABILITY ===');
    console.log('🔍 Full item object:', item);
    console.log('🔍 Item properties:', item.properties);
    
    // 🔍 NUEVO: Mostrar TODOS los campos disponibles
    console.log('🔍 === ALL AVAILABLE FIELDS ===');
    Object.keys(item.properties).forEach(fieldName => {
      const fieldValue = item.properties[fieldName];
      console.log(`🔍 Field "${fieldName}":`, fieldValue, `(type: ${typeof fieldValue})`);
    });
    console.log('🔍 === END ALL FIELDS ===');
    
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
    }
    
    // Por defecto, false
    console.log('🔍 No valid stock value found, returning false');
    console.log('🔍 === END STOCK DEBUGGING ===');
    return false;
  };

  const handleScan = async (code: string) => {
    if (!code.trim()) return;

    setScannedCode(code);
    setIsProcessing(true);

    try {
      let item = null;
      
      // Get the search field from selected configuration
      const config = scanConfigurations.find(c => c.id === selectedConfig);
      const searchField = config?.searchField;
      
      if (searchField) {
        // Search using the configured field
        item = await searchItem(code, searchField);
      } else {
        // Try multiple fields if no configuration is selected
        const fieldsToTry = ['ID', 'Name', 'Serial Number', 'Nombre', 'Número de Serie'];
        
        for (const field of fieldsToTry) {
          if (database?.properties[field]) {
            console.log(`Trying field: ${field}`);
            item = await searchItem(code, field);
            if (item) {
              console.log(`Found item using field: ${field}`);
              break;
            }
          }
        }
      }
      
      if (item) {
        console.log('🔍 === ITEM FOUND ===');
        console.log('🔍 Full item data:', item);
        setCurrentItem(item);
        const itemName = safeStringValue(item.properties['Name'] || item.properties['ID'] || item.properties['Nombre']);
        toast.success(`${t('toast.itemFound')} ${itemName}`);
      } else {
        setCurrentItem(null);
        toast.error(t('toast.itemNotFound'));
      }
    } catch (error) {
      console.error('Scan processing error:', error);
      toast.error(t('toast.scanError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (scannedCode.trim()) {
      handleScan(scannedCode.trim());
    }
  };

  const handleApplyConfiguration = async () => {
    if (!currentItem || !selectedConfig) {
      toast.error(t('toast.selectConfiguration'));
      return;
    }

    const config = scanConfigurations.find(c => c.id === selectedConfig);
    if (!config) {
      toast.error(t('toast.configurationNotFound'));
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare properties to update
      const propertiesToUpdate: Record<string, any> = {};
      const fieldsModified: string[] = [];

      config.targetFields.forEach(field => {
        if (field.enabled) {
          let value = field.value;
          
          // Handle custom date values
          if (field.fieldType === 'date' && field.value === '__CUSTOM_DATE__' && field.customDate) {
            value = field.customDate;
          }
          
          propertiesToUpdate[field.fieldName] = value;
          fieldsModified.push(field.fieldName);
        }
      });

      console.log('🔍 Properties to update:', propertiesToUpdate);

      // Update the item
      const success = await updateItem(currentItem.pageId, propertiesToUpdate);

      if (success) {
        toast.success(t('toast.itemUpdated'));
        
        // Add to scan history - usar safeStringValue para evitar errores
        const itemId = safeStringValue(currentItem.properties['ID'] || currentItem.properties['Nombre'] || currentItem.id);
        const itemName = safeStringValue(currentItem.properties['Name'] || currentItem.properties['Nombre'] || currentItem.properties['ID']);
        
        addScanHistory({
          itemId,
          itemName,
          scanTime: new Date(),
          configurationUsed: config.name,
          fieldsModified,
        });

        // Reset for next scan
        setScannedCode('');
        setCurrentItem(null);
        
        // Re-focus input for continuous scanning
        if (scanMode === 'manual' && inputRef.current) {
          inputRef.current.focus();
        }
      } else {
        toast.error(t('toast.itemUpdateFailed'));
      }
    } catch (error) {
      console.error('Configuration application error:', error);
      toast.error(t('toast.configurationError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'excellent': return t('common.excellent');
      case 'good': return t('common.good');
      case 'fair': return t('common.fair');
      case 'poor': return t('common.poor');
      default: return t('common.unknown');
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return t('common.active');
      case 'inactive': return t('common.inactive');
      case 'maintenance': return t('common.maintenance');
      default: return status || t('common.unknown');
    }
  };

  // Get icon component by name
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Package, Hash, Shield, MapPin, Calendar, CalendarClock, DollarSign, Mail, ExternalLink, Tag, Tags, Type, Info, CheckSquare, Phone
    };
    return icons[iconName] || Info;
  };

  // ✅ FUNCIÓN ACTUALIZADA: Format field value for display con formato de fecha mejorado y campos select simplificados
  const formatFieldValue = (value: any, fieldType: string, fieldName?: string) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (fieldType) {
      case 'checkbox':
        return value ? '✓ Sí' : '✗ No';
      case 'date':
        // ✅ USAR LA NUEVA FUNCIÓN DE FORMATEO DE FECHAS
        return formatDateForDisplay(value);
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'multi_select':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'select':
        // ✅ NUEVO: Para campos select, mostrar solo el valor sin prefijos
        const selectValue = safeStringValue(value);
        
        // Si es un campo de estado/condición, aplicar traducción
        if (fieldName && (fieldName.toLowerCase().includes('condition') || fieldName.toLowerCase().includes('condicion'))) {
          return getConditionText(selectValue);
        }
        
        if (fieldName && (fieldName.toLowerCase().includes('status') || fieldName.toLowerCase().includes('estado'))) {
          return getStatusText(selectValue);
        }
        
        // Para otros campos select, mostrar el valor tal como está
        return selectValue || 'N/A';
      case 'url':
        return value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
            {value}
          </a>
        ) : 'N/A';
      case 'email':
        return value ? (
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        ) : 'N/A';
      case 'phone_number':
        return value ? (
          <a href={`tel:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        ) : 'N/A';
      default:
        return safeStringValue(value);
    }
  };

  // Render item information based on active display configuration
  const renderItemInformation = () => {
    if (!currentItem) return null;

    const displayConfig = activeDisplayConfig;
    if (!displayConfig) {
      // Fallback to default display
      return renderDefaultItemInformation();
    }

    const enabledFields = displayConfig.displayFields
      .filter(field => field.enabled)
      .sort((a, b) => a.order - b.order);

    const summaryFields = enabledFields.filter(field => field.showInSummary);
    const detailFields = enabledFields.filter(field => !field.showInSummary);

    return (
      <div className="space-y-4">
        <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg lg:rounded-xl">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="font-medium text-green-800 text-sm sm:text-base">{t('scan.itemFound')}</span>
          </div>
          
          {/* Summary Fields */}
          {summaryFields.length > 0 && (
            <div className={`space-y-3 ${displayConfig.layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}`}>
              {summaryFields.map((field, index) => {
                const IconComponent = getIconComponent(field.icon || 'Info');
                const value = currentItem.properties[field.fieldName];
                
                return (
                  <div key={index} className={displayConfig.layout === 'compact' ? 'flex items-center space-x-2' : ''}>
                    <div className="flex items-center space-x-2 mb-1">
                      <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">{field.displayName}</p>
                    </div>
                    <div className={displayConfig.layout === 'compact' ? 'flex-1' : ''}>
                      {field.fieldType === 'checkbox' && field.fieldName.toLowerCase().includes('stock') ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getStockAvailability(currentItem) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {getStockAvailability(currentItem) ? t('scan.available') : t('scan.outOfStock')}
                        </span>
                      ) : field.fieldType === 'select' && field.fieldName.toLowerCase().includes('condition') ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                          {getConditionText(value)}
                        </span>
                      ) : field.fieldType === 'select' ? (
                        // ✅ NUEVO: Para otros campos select, mostrar solo el valor
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {formatFieldValue(value, field.fieldType, field.fieldName)}
                        </span>
                      ) : (
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {/* ✅ PASAR EL NOMBRE DEL CAMPO PARA FORMATEO CORRECTO */}
                          {formatFieldValue(value, field.fieldType, field.fieldName)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Fields */}
        {detailFields.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
              Información Detallada
            </h4>
            <div className={`space-y-2 ${displayConfig.layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}`}>
              {detailFields.map((field, index) => {
                const IconComponent = getIconComponent(field.icon || 'Info');
                const value = currentItem.properties[field.fieldName];
                
                return (
                  <div key={index} className="p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <IconComponent className="w-3 h-3 text-gray-500" />
                      <p className="text-xs text-gray-600 font-medium">{field.displayName}</p>
                    </div>
                    <p className="text-sm text-gray-900 ml-5">
                      {/* ✅ PASAR EL NOMBRE DEL CAMPO PARA FORMATEO CORRECTO */}
                      {formatFieldValue(value, field.fieldType, field.fieldName)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Metadata */}
        {displayConfig.showMetadata && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-xs font-medium text-gray-500 mb-2">Metadatos</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>
                <span className="font-medium">Creado:</span> {formatDateForDisplay(currentItem.createdTime)}
              </div>
              <div>
                <span className="font-medium">Modificado:</span> {formatDateForDisplay(currentItem.lastEditedTime)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Fallback default item information display
  const renderDefaultItemInformation = () => {
    return (
      <div className="space-y-4">
        <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg lg:rounded-xl">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="font-medium text-green-800 text-sm sm:text-base">{t('scan.itemFound')}</span>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">{t('scan.name')}</p>
              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                {safeStringValue(currentItem.properties['Name'] || currentItem.properties['Nombre'] || 'N/A')}
              </p>
            </div>
            
            <div>
              <p className="text-xs sm:text-sm text-gray-600">{t('scan.id')}</p>
              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                {safeStringValue(currentItem.properties['ID'] || currentItem.properties['Nombre'] || 'N/A')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">{t('scan.condition')}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentItem.properties['Condition'])}`}>
                  {getConditionText(currentItem.properties['Condition'])}
                </span>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm text-gray-600">{t('scan.stock')}</p>
                {(() => {
                  const isAvailable = getStockAvailability(currentItem);
                  console.log('🔍 Final stock availability result:', isAvailable);
                  return (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isAvailable ? t('scan.available') : t('scan.outOfStock')}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Get available search fields for debugging
  const availableFields = database ? Object.keys(database.properties) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 lg:mb-8">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('scan.title')}</h1>
            <HelpTooltip content={t('help.scan.overview')} />
          </div>
          <p className="text-gray-600 text-sm sm:text-base">{t('scan.subtitle')}</p>
          
          {/* Debug info - show available fields */}
          {availableFields.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Campos disponibles: {availableFields.join(', ')}
            </div>
          )}
        </div>

        {/* Configuration Selection - Move to top */}
        {scanConfigurations.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gray-200/50 shadow-sm mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                {t('scan.selectConfiguration')}
              </label>
              <HelpTooltip content={t('help.scan.selectConfiguration')} />
            </div>
            <select
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 transition-all duration-200 text-sm sm:text-base"
            >
              <option value="">{t('scan.chooseConfiguration')}</option>
              {scanConfigurations.map(config => (
                <option key={config.id} value={config.id}>
                  {config.name} (busca por: {config.searchField})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Scan Mode Toggle */}
        <div className="flex justify-center mb-6 lg:mb-8">
          <div className="bg-white/80 backdrop-blur-md rounded-xl lg:rounded-2xl p-2 border border-gray-200/50 shadow-sm">
            <div className="flex space-x-1 sm:space-x-2">
              <button
                onClick={() => setScanMode('manual')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg lg:rounded-xl text-sm font-medium transition-all duration-200 ${
                  scanMode === 'manual'
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span className="hidden sm:inline">{t('scan.manualEntry')}</span>
                <span className="sm:hidden">Manual</span>
              </button>
              <button
                onClick={() => setScanMode('camera')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg lg:rounded-xl text-sm font-medium transition-all duration-200 ${
                  scanMode === 'camera'
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">{t('scan.cameraScan')}</span>
                <span className="sm:hidden">Cámara</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Scanning Interface */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <Scan className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {scanMode === 'manual' ? t('scan.manualEntry') : t('scan.cameraScan')}
              </h2>
              <HelpTooltip content={scanMode === 'manual' ? t('help.scan.manualEntry') : t('help.scan.cameraScan')} />
            </div>

            {scanMode === 'manual' ? (
              <form onSubmit={handleManualScan} className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('scan.enterBarcode')}
                    </label>
                    <HelpTooltip content={t('help.scan.enterBarcode')} />
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={scannedCode}
                      onChange={(e) => setScannedCode(e.target.value)}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 transition-all duration-200 text-sm sm:text-base"
                      placeholder={t('scan.barcodePlaceholder')}
                      disabled={isProcessing}
                    />
                    <button
                      type="submit"
                      disabled={isProcessing || !scannedCode.trim()}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg lg:rounded-xl hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div id="qr-reader" className="w-full max-w-md mx-auto"></div>
                {isScanning && (
                  <div className="text-center">
                    <div className="inline-flex items-center space-x-2 text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">{t('scan.scannerActive')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Item Information */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gray-200/50 shadow-sm">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('scan.itemInformation')}</h2>
              <HelpTooltip content={t('help.scan.itemInformation')} />
            </div>

            {currentItem ? (
              <div className="space-y-4">
                {renderItemInformation()}

                {/* Apply Configuration Button */}
                {selectedConfig && (
                  <button
                    onClick={handleApplyConfiguration}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg lg:rounded-xl font-medium hover:from-green-600 hover:to-blue-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        <span>{t('scan.updating')}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{t('scan.applyConfiguration')}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : scannedCode && !isProcessing ? (
              <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg lg:rounded-xl">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  <span className="font-medium text-red-800 text-sm sm:text-base">{t('scan.itemNotFound')}</span>
                </div>
                <p className="text-xs sm:text-sm text-red-700 mt-2">
                  {t('scan.noItemFound')} <span className="font-mono break-all">{scannedCode}</span>
                </p>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <Scan className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                <p className="text-base sm:text-lg font-medium">{t('scan.readyToScan')}</p>
                <p className="text-xs sm:text-sm">{t('scan.scanToStart')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};