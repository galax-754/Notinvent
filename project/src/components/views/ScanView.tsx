import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, Camera, Keyboard, Search, CheckCircle, AlertCircle, RefreshCw, 
  Package, Hash, Shield, MapPin, Calendar, CalendarClock, DollarSign, 
  Mail, ExternalLink, Tag, Tags, Type, Info, CheckSquare, Phone 
} from 'lucide-react';
import { useNotion } from '../../contexts/NotionContext';
import { getArticuloNombreYNumero } from './ConfigurationView';
import { useLanguage } from '../../contexts/LanguageContext';
import { HelpTooltip } from '../common/HelpTooltip';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';

export const ScanView: React.FC = () => {
  const { searchItem, updateItem, scanConfigurations, activeDisplayConfig, addScanHistory, database } = useNotion();
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

  const safeStringValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (value.prefix && typeof value.number === 'number') {
        return `${value.prefix}-${value.number}`;
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  const formatDateForDisplay = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    try {
      let date: Date;
      if (typeof dateValue === 'string') {
        if (dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
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
      if (isNaN(date.getTime())) {
        return safeStringValue(dateValue);
      }
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

  const getStockAvailability = (item: any) => {
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
        break;
      }
    }
    if (!stockField) {
      const fieldsWithStock = Object.keys(item.properties).filter(name => 
        name.toLowerCase().includes('stock') || 
        name.toLowerCase().includes('available') ||
        name.toLowerCase().includes('disponib')
      );
      if (fieldsWithStock.length > 0) {
        stockField = fieldsWithStock[0];
        stockValue = item.properties[stockField];
      }
    }
    if (stockValue === null || stockValue === undefined) return false;
    if (typeof stockValue === 'boolean') return stockValue;
    if (typeof stockValue === 'string') {
      const lowerValue = stockValue.toLowerCase().trim();
      return lowerValue === 'true' || lowerValue === 'yes' || lowerValue === 'sí' || lowerValue === '1' || lowerValue === 'checked';
    }
    if (typeof stockValue === 'number') {
      return stockValue === 1 || stockValue > 0;
    }
    if (typeof stockValue === 'object' && stockValue !== null) {
      if (stockValue.checkbox !== undefined) return Boolean(stockValue.checkbox);
      if (stockValue.value !== undefined) return Boolean(stockValue.value);
      if (stockValue.checked !== undefined) return Boolean(stockValue.checked);
    }
    return false;
  };

  const handleScan = async (code: string) => {
    if (!code.trim()) return;
    setScannedCode(code);
    setIsProcessing(true);
    try {
      let item = null;
      const config = scanConfigurations.find(c => c.id === selectedConfig);
      const searchField = config?.searchField;
      if (searchField) {
        item = await searchItem(code, searchField);
      } else {
        const fieldsToTry = ['ID', 'Name', 'Serial Number', 'Nombre', 'Número de Serie'];
        for (const field of fieldsToTry) {
          if (database?.properties[field]) {
            item = await searchItem(code, field);
            if (item) break;
          }
        }
      }
      if (item) {
        setCurrentItem(item);
        const itemName = safeStringValue(item.properties['Name'] || item.properties['ID'] || item.properties['Nombre']);
        toast.success(`${t('toast.itemFound')} ${itemName}`);
        if (config && config.autoSave) {
          toast(t('scan.autoSaveApplied'), { icon: '⚡' });
          setTimeout(() => {
            handleApplyConfiguration(item);
          }, 0);
        }
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

  const transformValueForNotion = (value: any, fieldType: string) => {
    if (value === null || value === undefined) return undefined;
    if (fieldType === 'relation') {
      if (Array.isArray(value) && value[0] && value[0].id) return value;
      if (Array.isArray(value)) {
        return value.map((v: any) => (typeof v === 'object' && v.id ? v : { id: v }));
      }
      return [{ id: value }];
    }
    if (fieldType === 'multi_select') {
      if (Array.isArray(value)) {
        return value.map((v: any) => (typeof v === 'object' && v.name ? v : { name: v }));
      }
      return [{ name: value }];
    }
    if (fieldType === 'select' || fieldType === 'status') {
      if (typeof value === 'object' && value.name) return value;
      return { name: value };
    }
    if (fieldType === 'checkbox') {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1' || value === '✓ Sí';
      return Boolean(value);
    }
    if (fieldType === 'number') {
      if (typeof value === 'number') return value;
      if (!isNaN(Number(value))) return Number(value);
      return undefined;
    }
    if (fieldType === 'date') {
      return value;
    }
    return value;
  };

  const handleApplyConfiguration = async (itemOverride?: any) => {
    const itemToUpdate = itemOverride || currentItem;
    if (!itemToUpdate || !selectedConfig) {
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
      const propertiesToUpdate: Record<string, any> = {};
      const fieldsModified: string[] = [];
      config.targetFields.forEach(field => {
        if (field.enabled) {
          let value = field.value;
          if (field.fieldType === 'date' && field.value === '__CUSTOM_DATE__' && field.customDate) {
            value = field.customDate;
          }
          const transformed = transformValueForNotion(value, field.fieldType);
          if (transformed !== undefined) {
            propertiesToUpdate[field.fieldName] = transformed;
            fieldsModified.push(field.fieldName);
          }
        }
      });
      const success = await updateItem(itemToUpdate.pageId, propertiesToUpdate);
      if (success) {
        toast.success(t('toast.itemUpdated'));
        const itemId = safeStringValue(itemToUpdate.properties['ID'] || itemToUpdate.properties['Nombre'] || itemToUpdate.id);
        // Extrae el nombre del artículo usando el helper
        const nombreArticulo = getArticuloNombreYNumero(itemToUpdate.properties, database);
        // Actualiza la propiedad 'Nombre del articulo' en el objeto de propiedades
        const updatedProperties = { ...itemToUpdate.properties, ['Nombre del articulo']: nombreArticulo };
        addScanHistory({
          itemId,
          itemName: nombreArticulo,
          scanTime: new Date(),
          configurationUsed: config.name,
          fieldsModified,
          itemProperties: updatedProperties, // Guarda todas las propiedades del artículo, incluyendo el nombre extraído
        });
        setScannedCode('');
        setCurrentItem(null);
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
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'fair': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'poor': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getConditionText = (condition: any) => {
    let conditionText = '';
    
    // Extraer el texto de la condición según el formato de Notion
    if (typeof condition === 'string') {
      conditionText = condition;
    } else if (typeof condition === 'object' && condition !== null) {
      if (condition.name) {
        conditionText = condition.name;
      } else if (condition.select && condition.select.name) {
        conditionText = condition.select.name;
      } else if (condition.status && condition.status.name) {
        conditionText = condition.status.name;
      } else {
        // Usar extractName para obtener el valor
        conditionText = extractName(condition);
      }
    }
    
    // Convertir a texto legible según el idioma
    switch (conditionText?.toLowerCase()) {
      case 'excellent':
      case 'excelentes condiciones':
      case 'excelente': 
        return t('common.excellent');
      case 'good':
      case 'buenas condiciones':
      case 'bueno': 
        return t('common.good');
      case 'fair':
      case 'condiciones regulares':
      case 'regular': 
        return t('common.fair');
      case 'poor':
      case 'malas condiciones':
      case 'malo': 
        return t('common.poor');
      default: 
        return conditionText || t('common.unknown');
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Package, Hash, Shield, MapPin, Calendar, CalendarClock, DollarSign, Mail, ExternalLink, Tag, Tags, Type, Info, CheckSquare, Phone
    };
    return icons[iconName] || Info;
  };

  const extractName = (val: any): string => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val.toString();
    
    if (Array.isArray(val)) {
      if (val.length === 0) return 'N/A';
      
      // Para arrays, extraer nombres de cada elemento
      const extractedNames = val.map((v: any) => {
        if (typeof v === 'object' && v !== null) {
          if (v.name) return v.name;
          if (v.plain_text) return v.plain_text;
          if (v.text && v.text.content) return v.text.content;
          if (v.id && !v.name) return `ID: ${v.id}`;
          return extractName(v);
        }
        return v.toString();
      }).filter(name => name && name !== 'N/A');
      
      return extractedNames.length > 0 ? extractedNames.join(', ') : 'N/A';
    }
    
    if (typeof val === 'object') {
      // Orden de prioridad para extraer información legible
      if (val.name) return val.name;
      if (val.plain_text) return val.plain_text;
      if (val.text && val.text.content) return val.text.content;
      if (val.title) {
        if (Array.isArray(val.title)) {
          return val.title.map((t: any) => t.plain_text || t.text?.content || t).join('');
        }
        return val.title;
      }
      
      // Para campos de número con prefijo (como ID auto-generado)
      if (val.number !== undefined && val.prefix !== undefined) {
        if (val.prefix) return `${val.prefix}-${val.number}`;
        return val.number.toString();
      }
      if (val.number !== undefined) return val.number.toString();
      
      // Para checkboxes
      if (typeof val.checkbox === 'boolean') return val.checkbox ? '✓ Sí' : '✗ No';
      if (typeof val.checked === 'boolean') return val.checked ? '✓ Sí' : '✗ No';
      if (typeof val.value === 'boolean') return val.value ? '✓ Sí' : '✗ No';
      
      // Para URLs
      if (val.url) return val.url;
      
      // Para elementos con color y nombre (como status/select)
      if (val.color && val.name) return val.name;
      
      // Si solo tenemos ID, mostrar de forma más amigable
      if (val.id && !val.name) return `ID: ${val.id}`;
      
      // Último recurso: buscar recursivamente
      for (const key of Object.keys(val)) {
        if (key !== 'id') { // Evitar mostrar solo el ID si hay otros campos
          const result = extractName(val[key]);
          if (result !== 'N/A' && !result.startsWith('ID:')) return result;
        }
      }
      
      // Si solo encontramos ID, mostrarlo
      if (val.id) return `ID: ${val.id}`;
      
      return 'N/A';
    }
    
    return 'N/A';
  };

  const formatFieldValue = (value: any, fieldType: string, fieldName?: string, database?: any) => {
    if (value === null || value === undefined) return 'N/A';
    
    // LOG TEMPORAL: Detectar campos específicos problemáticos
    if (fieldName === 'Estado' || fieldName === 'Uso') {
      console.log(`🔍 CAMPO PROBLEMÁTICO "${fieldName}" - Tipo: ${fieldType}, Valor:`, value);
    }
    
    switch (fieldType) {
      case 'checkbox':
        // Manejo mejorado para checkboxes de Notion
        if (typeof value === 'boolean') return value ? '✓ Sí' : '✗ No';
        if (typeof value === 'object' && value !== null) {
          if ('checkbox' in value) return value.checkbox ? '✓ Sí' : '✗ No';
          if ('checked' in value) return value.checked ? '✓ Sí' : '✗ No';
        }
        return value ? '✓ Sí' : '✗ No';
        
      case 'date':
        return formatDateForDisplay(value);
        
      case 'number':
        // Manejo mejorado para números de Notion
        if (typeof value === 'number') return value.toLocaleString();
        if (typeof value === 'object' && value !== null && 'number' in value) {
          return typeof value.number === 'number' ? value.number.toLocaleString() : value.number;
        }
        return value;
        
      case 'select':
      case 'status':
        // LOG TEMPORAL: Detectar campos específicos en select/status
        if (fieldName === 'Estado' || fieldName === 'Uso') {
          console.log(`🔍 SELECT/STATUS CASE - Campo "${fieldName}":`, value);
        }
        
        // Manejo mejorado para select/status - extraer nombre legible
        if (typeof value === 'object' && value !== null) {
          if (value.name) return value.name;
          if (value.id && !value.name) {
            // NUEVO: Si es un objeto con ID, intentar buscar en relationOptions
            if (database?.properties && fieldName) {
              const prop = database.properties[fieldName];
              if (prop && (prop.type === 'select' || prop.type === 'status' || prop.type === 'relation') && prop.relationOptions) {
                const relationOption = prop.relationOptions.find((opt: any) => opt.id === value.id);
                if (relationOption && relationOption.name) {
                  return relationOption.name;
                }
              }
            }
            // Fallback anterior
            return getArticuloNombreYNumero(value, database) !== 'Sin nombre' 
              ? getArticuloNombreYNumero(value, database) 
              : `ID: ${value.id}`;
          }
        }
        // NUEVO: Si el valor es un string UUID, tratarlo como relación/select
        if (typeof value === 'string') {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
          if (isUUID && database?.properties && fieldName) {
            const prop = database.properties[fieldName];
            if (prop && (prop.type === 'select' || prop.type === 'status' || prop.type === 'relation') && prop.relationOptions) {
              const relationOption = prop.relationOptions.find((opt: any) => opt.id === value);
              if (relationOption && relationOption.name) {
                return relationOption.name;
              }
            }
          }
        }
        return extractName(value);
        
      case 'multi_select':
        // Manejo mejorado para multi-select
        if (Array.isArray(value)) {
          const names = value.map(item => {
            if (typeof item === 'object' && item !== null) {
              if (item.name) return item.name;
              if (item.id && !item.name) {
                return getArticuloNombreYNumero(item, database) !== 'Sin nombre' 
                  ? getArticuloNombreYNumero(item, database) 
                  : `ID: ${item.id}`;
              }
            }
            // NUEVO: Si el item es un string UUID, tratarlo como relación
            if (typeof item === 'string') {
              const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item);
              if (isUUID && database?.properties && fieldName) {
                const prop = database.properties[fieldName];
                if (prop && (prop.type === 'multi_select' || prop.type === 'relation') && prop.relationOptions) {
                  const relationOption = prop.relationOptions.find((opt: any) => opt.id === item);
                  if (relationOption && relationOption.name) {
                    return relationOption.name;
                  }
                }
              }
            }
            return extractName(item);
          }).filter(name => name !== 'N/A');
          return names.length > 0 ? names.join(', ') : 'N/A';
        }
        // NUEVO: Si el valor es un string UUID, tratarlo como relación
        if (typeof value === 'string') {
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
          if (isUUID && database?.properties && fieldName) {
            const prop = database.properties[fieldName];
            if (prop && (prop.type === 'multi_select' || prop.type === 'relation') && prop.relationOptions) {
              const relationOption = prop.relationOptions.find((opt: any) => opt.id === value);
              if (relationOption && relationOption.name) {
                return relationOption.name;
              }
            }
          }
        }
        return extractName(value);
        
      case 'relation':
        // Manejo mejorado para relaciones - usar getArticuloNombreYNumero
        if (Array.isArray(value)) {
          const relationNames = value.map(rel => {
            if (typeof rel === 'string') {
              // El valor ya es un string UUID directo
              if (database && database.properties && fieldName) {
                const prop = database.properties[fieldName];
                if (prop && prop.type === 'relation' && prop.relationOptions) {
                  const relationOption = prop.relationOptions.find((opt: any) => opt.id === rel);
                  if (relationOption && relationOption.name) {
                    return relationOption.name;
                  }
                }
              }
              return rel; // Devolver el UUID tal como está
            }
            if (typeof rel === 'object' && rel !== null && rel.id) {
              // Intentar usar metadata de relaciones si está disponible
              if (database && database.properties && fieldName) {
                const prop = database.properties[fieldName];
                if (prop && prop.type === 'relation' && prop.relationOptions) {
                  const relationOption = prop.relationOptions.find((opt: any) => opt.id === rel.id);
                  if (relationOption && relationOption.name) {
                    return relationOption.name;
                  }
                }
              }
              // Fallback a mostrar ID de forma legible
              return `ID: ${rel.id}`;
            }
            return extractName(rel);
          }).filter(name => name !== 'N/A');
          return relationNames.length > 0 ? relationNames.join(', ') : 'N/A';
        }
        if (typeof value === 'object' && value !== null && value.id) {
          // Para relaciones individuales
          if (database && database.properties && fieldName) {
            const prop = database.properties[fieldName];
            if (prop && prop.type === 'relation' && prop.relationOptions) {
              const relationOption = prop.relationOptions.find((opt: any) => opt.id === value.id);
              if (relationOption && relationOption.name) {
                return relationOption.name;
              }
            }
          }
          return `ID: ${value.id}`;
        }
        return extractName(value);
        
      case 'title':
      case 'rich_text':
        // Manejo mejorado para texto - usar getArticuloNombreYNumero si es apropiado
        const textResult = getArticuloNombreYNumero(value, database);
        return textResult !== 'Sin nombre' ? textResult : extractName(value);
        
      case 'url':
        return value ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-300 hover:underline truncate">
            {value}
          </a>
        ) : 'N/A';
        
      case 'email':
        return value ? (
          <a href={`mailto:${value}`} className="text-blue-600 dark:text-blue-300 hover:underline">
            {value}
          </a>
        ) : 'N/A';
        
      case 'phone_number':
        return value ? (
          <a href={`tel:${value}`} className="text-blue-600 dark:text-blue-300 hover:underline">
            {value}
          </a>
        ) : 'N/A';
        
      case 'files':
        // Manejo para archivos
        if (Array.isArray(value) && value.length > 0) {
          return value.map((file, index) => (
            <a 
              key={index}
              href={file.url || file.file?.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 dark:text-blue-300 hover:underline block truncate"
            >
              {file.name || file.file?.url?.split('/').pop() || 'Archivo'}
            </a>
          ));
        }
        return 'N/A';
        
      default:
        // NUEVO: Si el valor es un string UUID, intentar tratarlo como relación
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
          }
        }
        
        // NUEVO: Si el valor es un objeto con ID, intentar tratarlo como relación/select
        if (typeof value === 'object' && value !== null && value.id && !value.name) {
          console.log(`🔍 DEFAULT OBJECT DEBUG - Campo "${fieldName}" tiene objeto con ID:`, value.id);
          if (database?.properties && fieldName) {
            const prop = database.properties[fieldName];
            console.log(`🔍 DEFAULT OBJECT DEBUG - Tipo de campo "${fieldName}":`, prop?.type);
            if (prop && prop.relationOptions) {
              const relationOption = prop.relationOptions.find((opt: any) => opt.id === value.id);
              console.log(`🔍 DEFAULT OBJECT DEBUG - Búsqueda de ID en "${fieldName}":`, relationOption ? `✅ ${relationOption.name}` : '❌ No encontrado');
              if (relationOption && relationOption.name) {
                return relationOption.name;
              }
            }
          }
        }
        
        // Para tipos no especificados, usar getArticuloNombreYNumero si es apropiado
        const defaultResult = getArticuloNombreYNumero(value, database);
        return defaultResult !== 'Sin nombre' ? defaultResult : extractName(value);
    }
  };

  const renderItemInformation = () => {
    if (!currentItem) return null;
    const displayConfig = activeDisplayConfig;
    if (!displayConfig) return renderDefaultItemInformation();
    const enabledFields = displayConfig.displayFields
      .filter(field => field.enabled)
      .sort((a, b) => a.order - b.order);
    const summaryFields = enabledFields.filter(field => field.showInSummary);
    const detailFields = enabledFields.filter(field => !field.showInSummary);

    return (
      <div className="space-y-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg lg:rounded-xl">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-800 dark:text-green-100 text-sm sm:text-base">{t('scan.itemFound')}</span>
          </div>
          {summaryFields.length > 0 && (
            <div className={`space-y-3 ${displayConfig.layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}`}>
              {summaryFields.map((field, index) => {
                const IconComponent = getIconComponent(field.icon || 'Info');
                const value = currentItem.properties[field.fieldName];
                return (
                  <div key={index} className={displayConfig.layout === 'compact' ? 'flex items-center space-x-2' : ''}>
                    <div className="flex items-center space-x-2 mb-1">
                      <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-300" />
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">{field.displayName}</p>
                    </div>
                    <div className={displayConfig.layout === 'compact' ? 'flex-1' : ''}>
                      {field.fieldType === 'checkbox' && field.fieldName.toLowerCase().includes('stock') ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getStockAvailability(currentItem)
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {getStockAvailability(currentItem) ? t('scan.available') : t('scan.outOfStock')}
                        </span>
                      ) : field.fieldType === 'select' && field.fieldName.toLowerCase().includes('condition') ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                          {getConditionText(value)}
                        </span>
                      ) : field.fieldType === 'select' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          {formatFieldValue(value, field.fieldType, field.fieldName, database)}
                        </span>
                      ) : (
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                          {formatFieldValue(value, field.fieldType, field.fieldName, database)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {detailFields.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
              Información Detallada
            </h4>
            <div className={`space-y-2 ${displayConfig.layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}`}>
              {detailFields.map((field, index) => {
                const IconComponent = getIconComponent(field.icon || 'Info');
                const value = currentItem.properties[field.fieldName];
                return (
                  <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <IconComponent className="w-3 h-3 text-gray-500 dark:text-gray-300" />
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">{field.displayName}</p>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-gray-100 ml-5">
                      {formatFieldValue(value, field.fieldType, field.fieldName, database)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {displayConfig.showMetadata && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Metadatos</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
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

  const renderDefaultItemInformation = () => (
    <div className="space-y-4">
      <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg lg:rounded-xl">
        <div className="flex items-center space-x-2 mb-3">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
          <span className="font-medium text-green-800 dark:text-green-100 text-sm sm:text-base">{t('scan.itemFound')}</span>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{t('scan.name')}</p>
            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
              {getArticuloNombreYNumero(currentItem.properties, database)}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{t('scan.id')}</p>
            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
              {formatFieldValue(currentItem.properties['ID'] || currentItem.properties['Id Busqueda'] || currentItem.properties['id'], 'title', 'ID', database)}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{t('scan.condition')}</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentItem.properties['Condition'] || currentItem.properties['Estado'])}`}>
                {formatFieldValue(currentItem.properties['Condition'] || currentItem.properties['Estado'], 'select', 'Condition', database)}
              </span>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{t('scan.stock')}</p>
              {(() => {
                const isAvailable = getStockAvailability(currentItem);
                return (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isAvailable
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}>
                    {isAvailable ? t('scan.available') : t('scan.outOfStock')}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mostrar información adicional en una vista expandida cuando no hay configuración activa */}
      <div className="p-3 sm:p-4 bg-white/80 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/70 rounded-lg lg:rounded-xl">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
          Información del Artículo
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {Object.entries(currentItem.properties).map(([fieldName, value]) => {
            // Saltar campos que ya mostramos arriba
            if (['Name', 'Nombre', 'ID', 'Id Busqueda', 'Condition', 'Estado'].includes(fieldName)) {
              return null;
            }
            
            const fieldType = database?.properties[fieldName]?.type || 'rich_text';
            const formattedValue = formatFieldValue(value, fieldType, fieldName, database);
            
            // Solo mostrar si hay un valor válido
            if (formattedValue === 'N/A' || formattedValue === '' || formattedValue === null) {
              return null;
            }
            
            return (
              <div key={fieldName} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-start justify-between">
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">{fieldName}</p>
                </div>
                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1 break-words">
                  {formattedValue}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const availableFields = database ? Object.keys(database.properties) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-3 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 lg:mb-8">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white drop-shadow dark:drop-shadow-lg">{t('scan.title')}</h1>
            <HelpTooltip content={t('help.scan.overview')} />
          </div>
          <p className="text-gray-600 dark:text-gray-200 dark:font-medium text-sm sm:text-base">{t('scan.subtitle')}</p>
          {availableFields.length > 0 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Campos disponibles: {availableFields.join(', ')}
            </div>
          )}
        </div>
        {scanConfigurations.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/70 shadow-sm mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <label htmlFor="scan-configuration-select" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                {t('scan.selectConfiguration')}
              </label>
              <HelpTooltip content={t('help.scan.selectConfiguration')} />
            </div>
            <select
              id="scan-configuration-select"
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-700 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-800/80 text-gray-900 dark:text-white transition-all duration-200 text-sm sm:text-base"
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
        <div className="flex justify-center mb-6 lg:mb-8">
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-md rounded-xl lg:rounded-2xl p-2 border border-gray-200/50 dark:border-gray-700/70 shadow-sm">
            <div className="flex space-x-1 sm:space-x-2">
              <button
                onClick={() => setScanMode('manual')}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg lg:rounded-xl text-sm font-medium transition-all duration-200 ${
                  scanMode === 'manual'
                    ? 'bg-blue-100 text-blue-700 shadow-sm dark:bg-blue-800 dark:text-blue-100'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
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
                    ? 'bg-blue-100 text-blue-700 shadow-sm dark:bg-blue-800 dark:text-blue-100'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
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
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/70 shadow-sm">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <Scan className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {scanMode === 'manual' ? t('scan.manualEntry') : t('scan.cameraScan')}
              </h2>
              <HelpTooltip content={scanMode === 'manual' ? t('help.scan.manualEntry') : t('help.scan.cameraScan')} />
            </div>
            {scanMode === 'manual' ? (
              <form onSubmit={handleManualScan} className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
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
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-700 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300 transition-all duration-200 text-sm sm:text-base"
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
                    <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-200">
                      <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 dark:border-blue-800/30 dark:border-t-blue-800 rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">{t('scan.scannerActive')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Item Information */}
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/70 shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white drop-shadow dark:drop-shadow-lg">{t('scan.itemInformation')}</h2>
              <HelpTooltip content={t('help.scan.itemInformation')} />
            </div>
            {currentItem ? (
              <div className="space-y-4">
                {renderItemInformation()}
                {(() => {
                  const config = scanConfigurations.find(c => c.id === selectedConfig);
                  if (selectedConfig && config && !config.autoSave) {
                    return (
                      <button
                        onClick={() => handleApplyConfiguration()}
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
                    );
                  }
                  return null;
                })()}
              </div>
            ) : scannedCode && !isProcessing ? (
              <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg lg:rounded-xl">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                  <span className="font-medium text-red-800 dark:text-red-100 text-sm sm:text-base">{t('scan.itemNotFound')}</span>
                </div>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-200 mt-2">
                  {t('scan.noItemFound')} <span className="font-mono break-all">{scannedCode}</span>
                </p>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
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