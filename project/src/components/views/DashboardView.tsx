import React from 'react';
import { Package, Scan, Clock, TrendingUp, AlertTriangle, CheckCircle, Hash, Shield, MapPin, Calendar, CalendarClock, DollarSign, Mail, ExternalLink, Tag, Tags, Type, Info, CheckSquare, Phone, Activity } from 'lucide-react';
import { useNotion } from '../../contexts/NotionContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { HelpTooltip } from '../common/HelpTooltip';
import { getArticuloNombreYNumero } from './ConfigurationView';



export const DashboardView: React.FC = () => {
  const { items, scanHistory, isLoading, refreshDatabase, getItemsNeedingAttention, activeDisplayConfig, database } = useNotion();
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

  // ✅ NUEVA FUNCIÓN: Extraer valor limpio de campos select de Notion
  const extractSelectValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Si ya es string, devolverlo
    if (typeof value === 'string') {
      return value;
    }
    
    // Si es objeto de Notion select
    if (typeof value === 'object' && value !== null) {
      // Formato típico de Notion: {id: "...", name: "...", color: "..."}
      if (value.name && typeof value.name === 'string') {
        return value.name;
      }
      
      // Otros formatos posibles
      if (value.value && typeof value.value === 'string') {
        return value.value;
      }
      
      // Si tiene id pero no name, usar id
      if (value.id && typeof value.id === 'string') {
        return value.id;
      }
    }
    
    // Fallback
    return safeStringValue(value);
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

  // ✅ NUEVO: Usar la función de criterios de atención personalizable
  const itemsNeedingAttention = getItemsNeedingAttention();

  const stats = {
    totalItems: items.length,
    availableItems: items.filter(item => {
      const isAvailable = getStockAvailability(item);
      console.log(`🔍 Item ${safeStringValue(item.properties['ID'] || item.properties['Name'])} - Available: ${isAvailable}`);
      return isAvailable;
    }).length,
    recentScans: scanHistory.length,
    needsAttention: itemsNeedingAttention.length, // ✅ USAR LA NUEVA FUNCIÓN
  };

  const recentActivity = scanHistory.slice(0, 5);



  // ✅ FUNCIÓN ACTUALIZADA: Usar el nuevo formato de fecha para actividad reciente
  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString);
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

  // ✅ NUEVO: Get icon component by name
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Package, Hash, Shield, MapPin, Calendar, CalendarClock, DollarSign, Mail, ExternalLink, Tag, Tags, Type, Info, CheckSquare, Phone, Activity
    };
    return icons[iconName] || Info;
  };

  // ✅ FUNCIÓN ACTUALIZADA: Format field value for display con formato mejorado para relaciones
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
      case 'status':
        // ✅ SOLUCIÓN PRINCIPAL: Para campos select, extraer solo el valor limpio
        const selectValue = extractSelectValue(value);
        
        // Si es un campo de estado/condición, aplicar traducción
        if (fieldName && (fieldName.toLowerCase().includes('condition') || fieldName.toLowerCase().includes('condicion'))) {
          return getConditionText(selectValue);
        }
        
        if (fieldName && (fieldName.toLowerCase().includes('status') || fieldName.toLowerCase().includes('estado'))) {
          return getStatusText(selectValue);
        }
        
        // Para otros campos select, mostrar el valor tal como está
        return selectValue || 'N/A';
      case 'relation':
        // ✅ NUEVA LÓGICA: Manejar campos de relación como en ScanView
        
        // Si el valor es un string JSON serializado, parsearlo primero
        let parsedRelationValue = value;
        if (typeof value === 'string' && (value.startsWith('{"') || value.startsWith('['))) {
          try {
            parsedRelationValue = JSON.parse(value);
          } catch (e) {
            parsedRelationValue = value;
          }
        }
        
        // Manejar arrays de relaciones
        if (Array.isArray(parsedRelationValue)) {
          const relationNames = parsedRelationValue.map(rel => {
            if (typeof rel === 'string') {
              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rel);
              if (isUUID && database?.properties && fieldName) {
                const prop = database.properties[fieldName];
                if (prop && prop.type === 'relation' && prop.relationOptions) {
                  const relationOption = prop.relationOptions.find((opt: any) => opt.id === rel);
                  if (relationOption && relationOption.name) {
                    return relationOption.name;
                  }
                }
              }
              // Formato más legible para UUIDs
              if (isUUID) {
                const parts = rel.split('-');
                if (parts.length >= 2) {
                  return `Item-${parts[0].substring(0, 6)}`;
                }
                return `Item-${rel.substring(0, 8)}`;
              }
              return rel;
            }
            if (typeof rel === 'object' && rel !== null && rel.id) {
              // Intentar usar metadata de relaciones si está disponible
              const prop = database?.properties?.[fieldName!];
              if (prop && prop.type === 'relation' && prop.relationOptions) {
                const relationOption = prop.relationOptions.find((opt: any) => opt.id === rel.id);
                if (relationOption && relationOption.name) {
                  return relationOption.name;
                }
              }
              // Formato más legible para objetos con ID
              const parts = rel.id.split('-');
              if (parts.length >= 2) {
                return `Item-${parts[0].substring(0, 6)}`;
              }
              return `Item-${rel.id.substring(0, 8)}`;
            }
            return safeStringValue(rel);
          }).filter(name => name !== 'N/A');
          return relationNames.length > 0 ? relationNames.join(', ') : 'N/A';
        }
        
        // Si es un objeto individual de relación
        if (typeof parsedRelationValue === 'object' && parsedRelationValue !== null && parsedRelationValue.id) {
          const prop = database?.properties?.[fieldName!];
          if (prop && prop.type === 'relation' && prop.relationOptions) {
            const relationOption = prop.relationOptions.find((opt: any) => opt.id === parsedRelationValue.id);
            if (relationOption && relationOption.name) {
              return relationOption.name;
            }
          }
          // Formato más legible
          const parts = parsedRelationValue.id.split('-');
          if (parts.length >= 2) {
            return `Item-${parts[0].substring(0, 6)}`;
          }
          return `Item-${parsedRelationValue.id.substring(0, 8)}`;
        }
        
        // Si es un string UUID directo
        if (typeof parsedRelationValue === 'string') {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsedRelationValue);
          if (isUUID) {
            const prop = database?.properties?.[fieldName!];
            if (prop && prop.type === 'relation' && prop.relationOptions) {
              const relationOption = prop.relationOptions.find((opt: any) => opt.id === parsedRelationValue);
              if (relationOption && relationOption.name) {
                return relationOption.name;
              }
            }
            // Formato más legible
            const parts = parsedRelationValue.split('-');
            if (parts.length >= 2) {
              return `Item-${parts[0].substring(0, 6)}`;
            }
            return `Item-${parsedRelationValue.substring(0, 8)}`;
          }
        }
        
        return safeStringValue(parsedRelationValue);
      case 'url':
        return value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">
            {value}
          </a>
        ) : 'N/A';
      case 'email':
        return value ? (
          <a href={`mailto:${value}`} className="text-blue-600 dark:text-blue-400 hover:underline">
            {value}
          </a>
        ) : 'N/A';
      case 'phone_number':
        return value ? (
          <a href={`tel:${value}`} className="text-blue-600 dark:text-blue-400 hover:underline">
            {value}
          </a>
        ) : 'N/A';
      default:
        // Para tipos no especificados, intentar detectar si es una relación por el formato
        if (typeof value === 'string') {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
          if (isUUID && database?.properties && fieldName) {
            const prop = database.properties[fieldName];
            if (prop && prop.relationOptions) {
              const relationOption = prop.relationOptions.find((opt: any) => opt.id === value);
              if (relationOption && relationOption.name) {
                return relationOption.name;
              }
            }
            // Formato más legible para UUIDs no identificados
            const parts = value.split('-');
            if (parts.length >= 2) {
              return `Item-${parts[0].substring(0, 6)}`;
            }
            return `Item-${value.substring(0, 8)}`;
          }
        }
        
        // Si es un objeto con ID, intentar tratarlo como relación
        if (typeof value === 'object' && value !== null && value.id && !value.name) {
          if (database?.properties && fieldName) {
            const prop = database.properties[fieldName];
            if (prop && prop.relationOptions) {
              const relationOption = prop.relationOptions.find((opt: any) => opt.id === value.id);
              if (relationOption && relationOption.name) {
                return relationOption.name;
              }
            }
          }
          // Formato más legible
          const parts = value.id.split('-');
          if (parts.length >= 2) {
            return `Item-${parts[0].substring(0, 6)}`;
          }
          return `Item-${value.id.substring(0, 8)}`;
        }
        
        return safeStringValue(value);
    }
  };

  // ✅ NUEVO: Render attention items based on active display configuration
  const renderAttentionItems = () => {
    if (itemsNeedingAttention.length === 0) {
      return (
        <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
          <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50 text-green-500" />
          <p className="text-sm sm:text-base">{t('dashboard.allGood')}</p>
          <p className="text-xs sm:text-sm">{t('dashboard.greatJob')}</p>
        </div>
      );
    }

    const displayConfig = activeDisplayConfig;
    if (!displayConfig) {
      // Fallback to default display
      return renderDefaultAttentionItems();
    }

    const attentionFields = displayConfig.displayFields
      .filter(field => field.showInAttention)
      .sort((a, b) => a.order - b.order);

    return (
      <div className="space-y-3 sm:space-y-4">
        {itemsNeedingAttention.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-start space-x-3 p-3 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg border border-orange-200/50 dark:border-orange-700/50">
            {displayConfig.showAttentionIcons && (
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
            )}
            
            <div className="flex-1 min-w-0">
              {displayConfig.attentionLayout === 'detailed' && attentionFields.length > 0 ? (
                <div className="space-y-2">
                  {attentionFields.map((field, fieldIndex) => {
                    const IconComponent = getIconComponent(field.icon || 'Info');
                    const value = item.properties[field.fieldName];
                    
                    return (
                      <div key={fieldIndex} className="flex items-center space-x-2">
                        {displayConfig.showAttentionIcons && (
                          <IconComponent className="w-3 h-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-gray-600 dark:text-gray-400">{field.displayName}:</span>
                          <span className="ml-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {/* ✅ PASAR EL NOMBRE DEL CAMPO PARA FORMATEO CORRECTO */}
                            {formatFieldValue(value, field.fieldType, field.fieldName)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : displayConfig.attentionLayout === 'minimal' ? (
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {safeStringValue(item.properties['Name'] || item.properties['ID'])}
                </p>
              ) : (
                // badges layout or fallback
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                    {safeStringValue(item.properties['Name'] || item.properties['ID'])}
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
                    {attentionFields.slice(0, 3).map((field, fieldIndex) => {
                      const value = item.properties[field.fieldName];
                      if (!value) return null;
                      
                      return (
                        <span key={fieldIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                          {/* ✅ MOSTRAR SOLO EL VALOR PARA CAMPOS SELECT EN BADGES */}
                          {field.fieldType === 'select' ? 
                            formatFieldValue(value, field.fieldType, field.fieldName) : 
                            `${field.displayName}: ${formatFieldValue(value, field.fieldType, field.fieldName)}`
                          }
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ✅ FUNCIÓN ACTUALIZADA: Fallback default attention items display con extracción correcta de valores select
  const renderDefaultAttentionItems = () => {
    return (
      <div className="space-y-3 sm:space-y-4">
        {itemsNeedingAttention.slice(0, 5).map((item) => (
          <div key={item.id} className="flex items-start space-x-3 p-3 bg-orange-50/50 dark:bg-orange-900/20 rounded-lg border border-orange-200/50 dark:border-orange-700/50">
            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {safeStringValue(item.properties['Name'] || item.properties['ID'])}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {/* ✅ SOLUCIÓN: Usar extractSelectValue para mostrar badges limpios */}
                {item.properties['Condition'] && extractSelectValue(item.properties['Condition']) === 'Poor' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                    {getConditionText(extractSelectValue(item.properties['Condition']))}
                  </span>
                )}
                {!getStockAvailability(item) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {t('dashboard.outOfStock')}
                  </span>
                )}
                {item.properties['Codigo Pegado'] === false && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200">
                    Sin Código
                  </span>
                )}
                {item.properties['Needs Maintenance'] === true && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                    Mantenimiento
                  </span>
                )}
                {item.properties['Status'] && extractSelectValue(item.properties['Status']) === 'Maintenance' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200">
                    En Mantenimiento
                  </span>
                )}
                {/* ✅ NUEVO: Mostrar otros estados de forma limpia */}
                {item.properties['Status'] && extractSelectValue(item.properties['Status']) && extractSelectValue(item.properties['Status']) !== 'Active' && extractSelectValue(item.properties['Status']) !== 'Maintenance' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                    {getStatusText(extractSelectValue(item.properties['Status']))}
                  </span>
                )}
                {/* ✅ NUEVO: Mostrar condiciones que no sean Poor de forma limpia */}
                {item.properties['Condition'] && extractSelectValue(item.properties['Condition']) && extractSelectValue(item.properties['Condition']) !== 'Poor' && extractSelectValue(item.properties['Condition']) !== 'Excellent' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200">
                    {getConditionText(extractSelectValue(item.properties['Condition']))}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
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

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
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

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1 sm:space-x-2 mb-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{t('dashboard.needsAttention')}</p>
                  <HelpTooltip content={t('help.dashboard.needsAttention')} />
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.needsAttention}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-orange-100 dark:bg-orange-900/50 rounded-lg lg:rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
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

          {/* Items Needing Attention - ✅ USANDO LA NUEVA FUNCIÓN CON CONFIGURACIÓN DE VISTA */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.needsAttentionItems')}</h2>
              <HelpTooltip content={t('help.dashboard.needsAttentionItems')} />
            </div>
            
            {/* ✅ NUEVO: Usar la función de renderizado personalizable */}
            {renderAttentionItems()}
          </div>
        </div>
      </div>
    </div>
  );
};