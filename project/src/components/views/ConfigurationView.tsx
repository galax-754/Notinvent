import React, { useState } from 'react';

// Helper para mostrar el nombre y número del artículo de forma legible, soportando relaciones
// Se puede pasar la metadata de la base de datos como segundo argumento
export function getArticuloNombreYNumero(item: any, databaseMeta?: any): string {
  console.log(`🔍 GET ARTICULO NOMBRE - Input item:`, item);
  console.log(`🔍 GET ARTICULO NOMBRE - Database meta available:`, !!databaseMeta);
  
  if (!item) {
    console.log(`🔍 GET ARTICULO NOMBRE - No item provided, returning 'Sin nombre'`);
    return 'Sin nombre';
  }
  
  if (typeof item === 'string') {
    // Si es una fecha ISO, no mostrarla como nombre
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(item)) {
      console.log(`🔍 GET ARTICULO NOMBRE - Item is ISO date string, returning 'Sin nombre'`);
      return 'Sin nombre';
    }
    console.log(`🔍 GET ARTICULO NOMBRE - Item is string: "${item}"`);
    return item;
  }
  // Busca campos típicos de nombre
  console.log(`🔍 GET ARTICULO NOMBRE - Searching for name fields in keys:`, Object.keys(item));
  const posiblesClaves = ['Nombre', 'Name', 'nombre', 'name', 'Título', 'Title', 'título', 'title'];
  for (const clave of posiblesClaves) {
    console.log(`🔍 GET ARTICULO NOMBRE - Checking key: "${clave}"`);
    if (item[clave]) {
      const valor = item[clave];
      console.log(`🔍 GET ARTICULO NOMBRE - Found value for "${clave}":`, valor, typeof valor);
      
      // Si es string directo
      if (typeof valor === 'string') {
        console.log(`🔍 GET ARTICULO NOMBRE - Returning string value: "${valor}"`);
        return valor;
      }
      
      // Si es array de objetos tipo Notion (title, rich_text, etc)
      if (Array.isArray(valor) && valor.length > 0) {
        console.log(`🔍 GET ARTICULO NOMBRE - Found array, first element:`, valor[0]);
        if (typeof valor[0] === 'string') {
          console.log(`🔍 GET ARTICULO NOMBRE - Returning first string from array: "${valor[0]}"`);
          return valor[0];
        }
        if (valor[0] && typeof valor[0] === 'object' && valor[0].plain_text) {
          const resultado = valor.map((v:any) => v.plain_text).join(' ');
          console.log(`🔍 GET ARTICULO NOMBRE - Returning plain_text: "${resultado}"`);
          return resultado;
        }
        if (valor[0] && typeof valor[0] === 'object' && valor[0].text && valor[0].text.content) {
          const resultado = valor.map((v:any) => v.text.content).join(' ');
          console.log(`🔍 GET ARTICULO NOMBRE - Returning text.content: "${resultado}"`);
          return resultado;
        }
        // Si es relación: array de objetos {id: ...}
        if (valor[0] && typeof valor[0] === 'object' && valor[0].id && databaseMeta && databaseMeta.properties && databaseMeta.properties[clave] && databaseMeta.properties[clave].relationOptions) {
          // Buscar los nombres de las páginas relacionadas
          const relationOptions = databaseMeta.properties[clave].relationOptions;
          console.log(`🔍 RELATION DEBUG - Campo: ${clave}`, {
            valor,
            relationOptions,
            databaseMeta: databaseMeta.properties[clave]
          });
          const nombresRelacionados = valor.map((rel: any) => {
            const found = relationOptions.find((opt: any) => opt.id === rel.id);
            console.log(`🔍 RELATION LOOKUP - ID: ${rel.id}, Found:`, found);
            return found ? found.name : rel.id;
          });
          const resultado = nombresRelacionados.join(', ');
          console.log(`🔍 GET ARTICULO NOMBRE - Returning relation names: "${resultado}"`);
          return resultado;
        }
      }
      // Si es objeto tipo Notion (title: [{plain_text: ...}])
      if (typeof valor === 'object' && valor !== null) {
        console.log(`🔍 GET ARTICULO NOMBRE - Found object for "${clave}":`, valor);
        if (Array.isArray(valor.title) && valor.title.length > 0 && valor.title[0].plain_text) {
          const resultado = valor.title.map((v:any) => v.plain_text).join(' ');
          console.log(`🔍 GET ARTICULO NOMBRE - Returning title plain_text: "${resultado}"`);
          return resultado;
        }
        if (valor.plain_text) {
          console.log(`🔍 GET ARTICULO NOMBRE - Returning direct plain_text: "${valor.plain_text}"`);
          return valor.plain_text;
        }
        if (valor.text && valor.text.content) {
          console.log(`🔍 GET ARTICULO NOMBRE - Returning text.content: "${valor.text.content}"`);
          return valor.text.content;
        }
      }
    }
  }
  // Si tiene number
  console.log(`🔍 GET ARTICULO NOMBRE - Checking for number field...`);
  if ('number' in item && item.number) {
    console.log(`🔍 GET ARTICULO NOMBRE - Found number: ${item.number}`);
    return String(item.number);
  }
  
  // Si tiene algún campo string
  console.log(`🔍 GET ARTICULO NOMBRE - Checking all fields for strings...`);
  for (const key of Object.keys(item)) {
    console.log(`🔍 GET ARTICULO NOMBRE - Checking field "${key}":`, item[key], typeof item[key]);
    if (typeof item[key] === 'string' && item[key]) {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(item[key])) {
        console.log(`🔍 GET ARTICULO NOMBRE - Skipping date field "${key}"`);
        continue;
      }
      console.log(`🔍 GET ARTICULO NOMBRE - Found string field "${key}": "${item[key]}"`);
      return item[key];
    }
    if (Array.isArray(item[key]) && item[key].length > 0 && typeof item[key][0] === 'string') {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(item[key][0])) {
        console.log(`🔍 GET ARTICULO NOMBRE - Skipping date array field "${key}"`);
        continue;
      }
      console.log(`🔍 GET ARTICULO NOMBRE - Found string array field "${key}": "${item[key][0]}"`);
      return item[key][0];
    }
    // Si es relación y hay metadata
    if (Array.isArray(item[key]) && item[key].length > 0 && item[key][0] && typeof item[key][0] === 'object' && item[key][0].id && databaseMeta && databaseMeta.properties && databaseMeta.properties[key] && databaseMeta.properties[key].relationOptions) {
      const relationOptions = databaseMeta.properties[key].relationOptions;
      const nombresRelacionados = item[key].map((rel: any) => {
        const found = relationOptions.find((opt: any) => opt.id === rel.id);
        console.log(`🔍 GET ARTICULO NOMBRE - Relation lookup for "${key}": ID ${rel.id} -> Found:`, found);
        return found ? found.name : rel.id;
      });
      const resultado = nombresRelacionados.join(', ');
      console.log(`🔍 GET ARTICULO NOMBRE - Returning relation result: "${resultado}"`);
      return resultado;
    }
  }
  console.log(`🔍 GET ARTICULO NOMBRE - No valid name found, returning 'Sin nombre'`);
  return 'Sin nombre';
}
import Select from 'react-select';
import { Settings, Plus, Edit2, Trash2, Save, X, Calendar, Eye, AlertTriangle, Activity, Package, Hash, Shield, MapPin, CalendarClock, DollarSign, Mail, ExternalLink, Tag, Tags, Type, Info, CheckSquare, Phone, CheckCircle } from 'lucide-react';
import { useNotion } from '../../contexts/NotionContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { HelpTooltip } from '../common/HelpTooltip';
import { ScanConfiguration, DisplayConfiguration, AttentionConfiguration, AttentionCriterion } from '../../types/notion';
import toast from 'react-hot-toast';

// ✅ NUEVO: Componente para campos select con opciones dinámicas
const AttentionSelectField: React.FC<{
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}> = ({ fieldName, value, onChange, disabled = false, label, id }) => {
  const { getFieldOptions } = useNotion();
  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    const loadOptions = async () => {
      setIsLoading(true);
      try {
        const fieldOptions = await getFieldOptions(fieldName);
        console.log('🔍 Loaded options for', fieldName, ':', fieldOptions);
        setOptions(fieldOptions);
      } catch (error) {
        console.error('Failed to load options for', fieldName, ':', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOptions();
  }, [fieldName, getFieldOptions]);

  if (isLoading) {
  return (
    <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-500 dark:text-gray-400">Cargando opciones...</span>
      </div>
    );
  }

  if (options.length > 0) {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </label>
        )}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 text-sm"
          aria-label={label || `Seleccionar ${fieldName}`}
        >
          <option value="">Seleccionar opción...</option>
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Opciones disponibles: {options.join(', ')}
        </div>
      </div>
    );
  }

  // Fallback a input de texto si no hay opciones
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 text-sm"
        placeholder="Ingresar valor..."
      />
      <div className="text-xs text-gray-500 dark:text-gray-400">
        No se encontraron opciones predefinidas para este campo
      </div>
    </div>
  );
};

// Componente reutilizable para campos select/multi-select/relation usando metadata real de Notion
type Option = { id: string; name: string };

const NotionSelectField: React.FC<{
  field: any;
  value: string | string[];
  onChange: (value: any) => void;
  disabled?: boolean;
  database: any;
}> = ({ field, value, onChange, disabled = false, database }) => {
  // Obtener opciones reales desde la metadata de la base de datos
  const property = database?.properties?.[field.fieldName];
  let options: Option[] = [];
  
  if (property) {
    if (property.type === 'select' || property.type === 'status') {
      options = property.select?.options || property.status?.options || [];
    } else if (property.type === 'multi_select') {
      options = property.multi_select?.options || [];
    } else if (property.type === 'relation') {
      options = property.relationOptions || [];
    }
  }

  // Adaptar opciones para react-select
  let selectOptions: { value: string; label: string }[] = [];
  
  if (property?.type === 'relation') {
    // Para relaciones, usar el ID como value y el name como label
    selectOptions = options.map(opt => ({ 
      value: opt.id, 
      label: opt.name || opt.id 
    }));
  } else {
    // Para otros tipos, usar name tanto para value como label
    selectOptions = options.map(opt => ({ 
      value: opt.id || opt.name, 
      label: opt.name 
    }));
  }

  // Multi-select
  if (field.fieldType === 'multi_select') {
    return (
      <Select
        isMulti
        isDisabled={disabled}
        value={selectOptions.filter(opt => Array.isArray(value) && value.includes(opt.label))}
        onChange={selected => onChange(Array.isArray(selected) ? selected.map(opt => opt.label) : [])}
        options={selectOptions}
        classNamePrefix="react-select"
        styles={{
          control: (base, state) => ({
            ...base,
            backgroundColor: state.isDisabled ? '#f3f4f6' : 'var(--tw-bg-opacity,1) #fff',
            borderColor: '#d1d5db',
            minHeight: '2.25rem',
            fontSize: '0.875rem',
            ...(document.documentElement.classList.contains('dark') && {
              backgroundColor: '#1f2937',
              color: '#fff',
              borderColor: '#374151',
            })
          }),
          menu: base => ({
            ...base,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#fff' : '#111',
          }),
          option: (base, state) => {
            const isDark = document.documentElement.classList.contains('dark');
            let color = isDark ? '#f9fafb' : '#111'; // color más claro en dark
            if (state.isSelected) color = isDark ? '#f9fafb' : '#1e293b';
            if (state.isFocused && !state.isSelected) color = isDark ? '#e0e7ef' : '#1e293b';
            return {
              ...base,
              backgroundColor: state.isSelected
                ? (isDark ? '#374151' : '#e0e7ef')
                : (state.isFocused ? (isDark ? '#111827' : '#f3f4f6') : 'inherit'),
              color,
              fontWeight: state.isSelected ? 700 : 400,
              textShadow: isDark ? '0 1px 2px #111' : undefined,
            };
          },
          singleValue: (base) => ({
            ...base,
            color: document.documentElement.classList.contains('dark') ? '#fff' : '#111',
          }),
          placeholder: (base) => ({
            ...base,
            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
          }),
          input: (base) => ({
            ...base,
            color: document.documentElement.classList.contains('dark') ? '#fff' : '#111',
          }),
        }}
        placeholder="Seleccionar opción..."
      />
    );
  }

  // Relation (puede ser multi o single)
  if (field.fieldType === 'relation') {
    const isMulti = property?.relation?.single_property === false;
    return (
      <Select
        isMulti={isMulti}
        isDisabled={disabled}
        value={selectOptions.filter(opt => {
          console.log('🔍 FILTERING OPTION:', { opt, value, matches: Array.isArray(value) ? value.includes(opt.value) : value === opt.value });
          if (Array.isArray(value)) {
            // Para multi-relation, buscar solo por ID
            return value.includes(opt.value);
          } else {
            // Para single-relation, buscar solo por ID  
            return value === opt.value;
          }
        })}
        onChange={selected => {
          if (isMulti) {
            onChange(Array.isArray(selected) ? selected.map(opt => opt.value) : []);
          } else {
            if (selected && !Array.isArray(selected) && typeof selected === 'object' && 'value' in selected) {
              onChange(selected.value);
            } else {
              onChange('');
            }
          }
        }}
        options={selectOptions}
        classNamePrefix="react-select"
        styles={{
          control: (base, state) => ({
            ...base,
            backgroundColor: state.isDisabled ? '#f3f4f6' : 'var(--tw-bg-opacity,1) #fff',
            borderColor: '#d1d5db',
            minHeight: '2.25rem',
            fontSize: '0.875rem',
            ...(document.documentElement.classList.contains('dark') && {
              backgroundColor: '#1f2937',
              color: '#fff',
              borderColor: '#374151',
            })
          }),
          menu: base => ({
            ...base,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
            color: document.documentElement.classList.contains('dark') ? '#fff' : '#111',
          }),
          option: (base, state) => {
            const isDark = document.documentElement.classList.contains('dark');
            let color = isDark ? '#fff' : '#111';
            if (state.isSelected) color = isDark ? '#fff' : '#1e293b';
            if (state.isFocused && !state.isSelected) color = isDark ? '#e0e7ef' : '#1e293b';
            return {
              ...base,
              backgroundColor: state.isSelected
                ? (isDark ? '#374151' : '#e0e7ef')
                : (state.isFocused ? (isDark ? '#111827' : '#f3f4f6') : 'inherit'),
              color,
              fontWeight: state.isSelected ? 700 : 400,
            };
          },
          singleValue: (base) => ({
            ...base,
            color: document.documentElement.classList.contains('dark') ? '#fff' : '#111',
          }),
          placeholder: (base) => ({
            ...base,
            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
          }),
          input: (base) => ({
            ...base,
            color: document.documentElement.classList.contains('dark') ? '#fff' : '#111',
          }),
        }}
        placeholder="Seleccionar opción..."
      />
    );
  }

  // Select/Status
  return (
    <Select
      isDisabled={disabled}
      value={selectOptions.find(opt => opt.label === value || opt.value === value) || null}
      onChange={selected => onChange(selected ? selected.label : '')}
      options={selectOptions}
      classNamePrefix="react-select"
      styles={{
        control: (base, state) => ({
          ...base,
          backgroundColor: state.isDisabled ? '#f3f4f6' : 'var(--tw-bg-opacity,1) #fff',
          borderColor: '#d1d5db',
          minHeight: '2.25rem',
          fontSize: '0.875rem',
          ...(document.documentElement.classList.contains('dark') && {
            backgroundColor: '#1f2937',
            color: '#fff',
            borderColor: '#374151',
          })
        }),
        menu: base => ({
          ...base,
          backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff',
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#111',
        }),
        option: (base, state) => {
          const isDark = document.documentElement.classList.contains('dark');
          let color = isDark ? '#fff' : '#111';
          if (state.isSelected) color = isDark ? '#fff' : '#1e293b';
          if (state.isFocused && !state.isSelected) color = isDark ? '#e0e7ef' : '#1e293b';
          return {
            ...base,
            backgroundColor: state.isSelected
              ? (isDark ? '#374151' : '#e0e7ef')
              : (state.isFocused ? (isDark ? '#111827' : '#f3f4f6') : 'inherit'),
            color,
            fontWeight: state.isSelected ? 700 : 400,
          };
        },
        singleValue: (base) => ({
          ...base,
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#111',
        }),
        placeholder: (base) => ({
          ...base,
          color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        }),
        input: (base) => ({
          ...base,
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#111',
        }),
      }}
      placeholder="Seleccionar opción..."
    />
  );
};

export const ConfigurationView: React.FC = () => {
  const { 
    database, 
    scanConfigurations, 
    displayConfigurations,
    activeDisplayConfig,
    attentionConfigurations,
    activeAttentionConfig,
    addScanConfiguration, 
    updateScanConfiguration, 
    deleteScanConfiguration,
    addDisplayConfiguration,
    updateDisplayConfiguration,
    deleteDisplayConfiguration,
    setActiveDisplayConfig,
    addAttentionConfiguration,
    updateAttentionConfiguration,
    deleteAttentionConfiguration,
    setActiveAttentionConfig
  } = useNotion();
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'scan' | 'display' | 'attention'>('scan');
  
  // Scan Configuration State
  const [editingScanConfig, setEditingScanConfig] = useState<ScanConfiguration | null>(null);
  const [isCreatingScan, setIsCreatingScan] = useState(false);
  const [scanFormData, setScanFormData] = useState<Partial<ScanConfiguration>>({
    name: '',
    searchField: '',
    autoSave: true,
    targetFields: [],
  });

  // Display Configuration State
  const [editingDisplayConfig, setEditingDisplayConfig] = useState<DisplayConfiguration | null>(null);
  const [isCreatingDisplay, setIsCreatingDisplay] = useState(false);
  const [displayFormData, setDisplayFormData] = useState<Partial<DisplayConfiguration>>({
    name: '',
    layout: 'grid',
    showMetadata: false,
    attentionLayout: 'detailed', // ✅ NUEVO
    showAttentionIcons: true, // ✅ NUEVO
    displayFields: [],
  });

  // Attention Configuration State
  const [editingAttentionConfig, setEditingAttentionConfig] = useState<AttentionConfiguration | null>(null);
  const [isCreatingAttention, setIsCreatingAttention] = useState(false);
  const [attentionFormData, setAttentionFormData] = useState<Partial<AttentionConfiguration>>({
    name: '',
    operator: 'OR',
    enabled: true,
    criteria: [],
  });

  const availableFields = database ? Object.keys(database.properties) : [];

  // ✅ FUNCIONES: Gestión de Configuraciones de Escaneo
  const handleStartCreateScan = () => {
    if (!database || availableFields.length === 0) {
      toast.error('No database fields available');
      return;
    }

    setIsCreatingScan(true);
    const firstField = availableFields[0];
    setScanFormData({
      name: '',
      searchField: firstField,
      autoSave: true,
      targetFields: availableFields.map(field => ({
        fieldName: field,
        fieldType: database.properties[field].type,
        value: getDefaultValueForType(database.properties[field].type, field),
        enabled: false,
      })),
    });
  };

  const handleStartEditScan = (config: ScanConfiguration) => {
    setEditingScanConfig(config);
    setScanFormData({ ...config });
  };

  const handleCancelScan = () => {
    setIsCreatingScan(false);
    setEditingScanConfig(null);
    setScanFormData({
      name: '',
      searchField: '',
      autoSave: true,
      targetFields: [],
    });
  };

  const handleSaveScan = () => {
    if (!scanFormData.name?.trim()) {
      toast.error(t('config.nameRequired'));
      return;
    }

    if (!scanFormData.targetFields?.some(field => field.enabled)) {
      toast.error(t('config.fieldRequired'));
      return;
    }

    const configData = scanFormData as ScanConfiguration;
    
    if (editingScanConfig) {
      updateScanConfiguration(configData);
      toast.success(t('config.configUpdated'));
    } else {
      addScanConfiguration(configData);
      toast.success(t('config.configCreated'));
    }

    handleCancelScan();
  };

  const handleDeleteScan = (id: string) => {
    if (window.confirm(t('config.confirmDelete'))) {
      deleteScanConfiguration(id);
      toast.success(t('config.configDeleted'));
    }
  };

  // ✅ FUNCIONES: Gestión de Configuraciones de Vista
  const handleStartCreateDisplay = () => {
    if (!database || availableFields.length === 0) {
      toast.error('No database fields available');
      return;
    }

    setIsCreatingDisplay(true);
    setDisplayFormData({
      name: '',
      layout: 'grid',
      showMetadata: false,
      attentionLayout: 'detailed', // ✅ NUEVO
      showAttentionIcons: true, // ✅ NUEVO
      displayFields: availableFields.map((field, index) => ({
        fieldName: field,
        fieldType: database.properties[field].type,
        displayName: field,
        enabled: index < 6,
        order: index + 1,
        showInSummary: index < 4,
        showInAttention: index < 3, // ✅ NUEVO
        icon: getDefaultIconForFieldType(database.properties[field].type),
      })),
    });
  };

  const handleStartEditDisplay = (config: DisplayConfiguration) => {
    setEditingDisplayConfig(config);
    setDisplayFormData({ ...config });
  };

  const handleCancelDisplay = () => {
    setIsCreatingDisplay(false);
    setEditingDisplayConfig(null);
    setDisplayFormData({
      name: '',
      layout: 'grid',
      showMetadata: false,
      attentionLayout: 'detailed',
      showAttentionIcons: true,
      displayFields: [],
    });
  };

  const handleSaveDisplay = () => {
    if (!displayFormData.name?.trim()) {
      toast.error('El nombre de la configuración es requerido');
      return;
    }

    if (!displayFormData.displayFields?.some(field => field.enabled)) {
      toast.error('Al menos un campo debe estar habilitado');
      return;
    }

    const configData = displayFormData as DisplayConfiguration;
    
    if (editingDisplayConfig) {
      updateDisplayConfiguration(configData);
      toast.success('Configuración de vista actualizada');
    } else {
      addDisplayConfiguration(configData);
      toast.success('Configuración de vista creada');
    }

    handleCancelDisplay();
  };

  const handleDeleteDisplay = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta configuración?')) {
      deleteDisplayConfiguration(id);
      toast.success('Configuración eliminada');
    }
  };

  const handleActivateDisplay = (configId: string) => {
    setActiveDisplayConfig(configId);
    toast.success('Configuración activada');
  };

  // ✅ FUNCIONES: Gestión de Criterios de Atención
  const handleStartCreateAttention = () => {
    if (!database || availableFields.length === 0) {
      toast.error('No database fields available');
      return;
    }

    setIsCreatingAttention(true);
    setAttentionFormData({
      name: '',
      operator: 'OR',
      enabled: true,
      criteria: [],
    });
  };

  const handleStartEditAttention = (config: AttentionConfiguration) => {
    setEditingAttentionConfig(config);
    setAttentionFormData({ ...config });
  };

  const handleCancelAttention = () => {
    setIsCreatingAttention(false);
    setEditingAttentionConfig(null);
    setAttentionFormData({
      name: '',
      operator: 'OR',
      enabled: true,
      criteria: [],
    });
  };

  const handleSaveAttention = () => {
    if (!attentionFormData.name?.trim()) {
      toast.error('El nombre de la configuración es requerido');
      return;
    }

    if (!attentionFormData.criteria?.some(criterion => criterion.enabled)) {
      toast.error('Al menos un criterio debe estar habilitado');
      return;
    }

    const configData = attentionFormData as AttentionConfiguration;
    
    if (editingAttentionConfig) {
      updateAttentionConfiguration(configData);
      toast.success('Criterios de atención actualizados');
    } else {
      addAttentionConfiguration(configData);
      toast.success('Criterios de atención creados');
    }

    handleCancelAttention();
  };

  const handleDeleteAttention = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta configuración?')) {
      deleteAttentionConfiguration(id);
      toast.success('Configuración eliminada');
    }
  };

  const handleActivateAttention = (configId: string) => {
    setActiveAttentionConfig(configId);
    toast.success('Criterios activados');
  };

  const addAttentionCriterion = () => {
    if (!attentionFormData.criteria) {
      setAttentionFormData({ ...attentionFormData, criteria: [] });
    }

    const newCriterion: AttentionCriterion = {
      id: Date.now().toString(),
      fieldName: availableFields[0] || '',
      fieldType: database?.properties[availableFields[0]]?.type || 'rich_text',
      condition: 'equals',
      value: '',
      priority: 'medium',
      enabled: true,
      description: 'Nuevo criterio',
    };

    setAttentionFormData({
      ...attentionFormData,
      criteria: [...(attentionFormData.criteria || []), newCriterion],
    });
  };

  const updateAttentionCriterion = (index: number, updates: Partial<AttentionCriterion>) => {
    if (!attentionFormData.criteria) return;
    
    const newCriteria = [...attentionFormData.criteria];
    newCriteria[index] = { ...newCriteria[index], ...updates };
    
    // Auto-update description
    const criterion = newCriteria[index];
    const conditionText = getConditionText(criterion.condition);
    const valueText = criterion.value ? ` "${criterion.value}"` : '';
    newCriteria[index].description = `${criterion.fieldName} ${conditionText}${valueText}`;
    
    setAttentionFormData({ ...attentionFormData, criteria: newCriteria });
  };

  const removeAttentionCriterion = (index: number) => {
    if (!attentionFormData.criteria) return;
    
    const newCriteria = attentionFormData.criteria.filter((_, i) => i !== index);
    setAttentionFormData({ ...attentionFormData, criteria: newCriteria });
  };

  const getConditionText = (condition: string): string => {
    switch (condition) {
      case 'equals': return 'igual a';
      case 'not_equals': return 'diferente de';
      case 'empty': return 'está vacío';
      case 'not_empty': return 'no está vacío';
      case 'contains': return 'contiene';
      case 'not_contains': return 'no contiene';
      case 'less_than': return 'menor que';
      case 'greater_than': return 'mayor que';
      case 'is_true': return 'es verdadero';
      case 'is_false': return 'es falso';
      default: return condition;
    }
  };

  const getDefaultValueForType = (fieldType: string, fieldName: string) => {
    switch (fieldType) {
      case 'checkbox': return true;
      case 'date': 
        // Para campos "Next Revision" usar 3 meses por defecto
        if (fieldName.toLowerCase().includes('next') || fieldName.toLowerCase().includes('proxim')) {
          return '__PLUS_3_MONTHS__';
        }
        // Para campos "Last Revision" usar fecha actual
        return '__CURRENT_DATE__';
      case 'select': return '';
      case 'multi_select': return [];
      case 'number': return 0;
      case 'rich_text': return '';
      case 'title': return '';
      case 'url': return '';
      case 'email': return '';
      case 'phone_number': return '';
      default: return '';
    }
  };


  // Tipos explícitos para los campos
  type ScanTargetField = {
    fieldName: string;
    fieldType: string;
    value: any;
    enabled: boolean;
    customDate?: string;
  };

  type DisplayField = {
    fieldName: string;
    fieldType: string;
    displayName?: string;
    enabled: boolean;
    order?: number;
    showInSummary?: boolean;
    showInAttention?: boolean;
    icon?: string;
  };

  const updateScanTargetField = (index: number, updates: Partial<ScanTargetField>) => {
    if (!scanFormData.targetFields) return;

    const newFields = [...scanFormData.targetFields];
    newFields[index] = { ...newFields[index], ...updates };
    setScanFormData({ ...scanFormData, targetFields: newFields });
  };

  const updateDisplayField = (index: number, updates: Partial<DisplayField>) => {
    if (!displayFormData.displayFields) return;

    const newFields = [...displayFormData.displayFields];
    newFields[index] = { ...newFields[index], ...updates };
    setDisplayFormData({ ...displayFormData, displayFields: newFields });
  };

  const getDefaultIconForFieldType = (fieldType: string): string => {
    switch (fieldType) {
      case 'title': return 'Hash';
      case 'rich_text': return 'Type';
      case 'number': return 'Hash';
      case 'select': return 'Tag';
      case 'multi_select': return 'Tags';
      case 'date': return 'Calendar';
      case 'checkbox': return 'CheckSquare';
      case 'url': return 'ExternalLink';
      case 'email': return 'Mail';
      case 'phone_number': return 'Phone';
      default: return 'Info';
    }
  };

  const getDateOptions = (fieldName: string) => {
    const isLastRevisionField = fieldName.toLowerCase().includes('last') && 
                               (fieldName.toLowerCase().includes('revision') || 
                                fieldName.toLowerCase().includes('review'));
    
    // Solo para campos específicos de "última revisión" mostrar solo fecha actual
    if (isLastRevisionField) {
      return [
        { value: '__CURRENT_DATE__', label: t('config.currentDate') }
      ];
    }
    
    // Para todos los demás campos de fecha, incluyendo "Next Revision", mostrar todas las opciones
    return [
      { value: '__CURRENT_DATE__', label: t('config.currentDate') },
      { value: '__PLUS_1_MONTH__', label: t('config.plus1Month') },
      { value: '__PLUS_3_MONTHS__', label: t('config.plus3Months') },
      { value: '__PLUS_6_MONTHS__', label: t('config.plus6Months') },
      { value: '__PLUS_1_YEAR__', label: t('config.plus1Year') },
      { value: '__CUSTOM_DATE__', label: t('config.customDate') }
    ];
  };


const renderScanFieldValue = (field: any, index: number) => {
  switch (field.fieldType) {
    case 'files':
      return (
        <input
          type="text"
          placeholder="Pega aquí la URL pública del archivo (Drive, Dropbox, etc.)"
          value={field.value && Array.isArray(field.value) ? field.value.map((f: { url: string }) => f.url).join(', ') : (field.value?.url || '')}
          onChange={e => {
            const urls = e.target.value.split(',').map(u => u.trim()).filter(u => u);
            const fileObjs = urls.map(url => ({ name: url.split('/').pop() || 'Archivo', url }));
            updateScanTargetField(index, { value: fileObjs });
          }}
          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-900/70 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
          disabled={!field.enabled}
        />
      );
    case 'checkbox':
      return (
        <select
          value={field.value ? 'true' : 'false'}
          onChange={(e) => updateScanTargetField(index, { value: e.target.value === 'true' })}
          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-900/70 text-xs sm:text-sm text-gray-900 dark:text-white"
          disabled={!field.enabled}
          aria-label={`Valor para ${field.fieldName}`}
        >
          <option value="true">{t('common.checked')}</option>
          <option value="false">{t('common.unchecked')}</option>
        </select>
      );
    case 'date':
      const dateOptions = getDateOptions(field.fieldName);
      return (
        <div className="space-y-2">
          <select
            value={field.value}
            onChange={(e) => updateScanTargetField(index, { value: e.target.value })}
            className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-900/70 text-xs sm:text-sm text-gray-900 dark:text-white"
            disabled={!field.enabled}
            aria-label={`Fecha para ${field.fieldName}`}
          >
            {dateOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.value === '__CUSTOM_DATE__' && (
            <input
              type="date"
              value={field.customDate || ''}
              onChange={(e) => updateScanTargetField(index, { customDate: e.target.value })}
              className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-900/70 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
              disabled={!field.enabled}
            />
          )}
        </div>
      );
    case 'select':
    case 'multi_select':
    case 'status':
    case 'relation':
      return (
        <NotionSelectField
          field={field}
          value={field.value}
          onChange={val => updateScanTargetField(index, { value: val })}
          disabled={!field.enabled}
          database={database}
          
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={field.value}
          onChange={(e) => updateScanTargetField(index, { value: parseFloat(e.target.value) || 0 })}
          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-900/70 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
          disabled={!field.enabled}
        />
      );
    case 'url':
      return (
        <input
          type="url"
          value={field.value}
          onChange={(e) => updateScanTargetField(index, { value: e.target.value })}
          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-900/70 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
          placeholder="https://..."
          disabled={!field.enabled}
        />
      );
    case 'email':
      return (
        <input
          type="email"
          value={field.value}
          onChange={(e) => updateScanTargetField(index, { value: e.target.value })}
          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-900/70 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
          placeholder="email@example.com"
          disabled={!field.enabled}
        />
      );
    case 'phone_number':
      return (
        <input
          type="tel"
          value={field.value}
          onChange={(e) => updateScanTargetField(index, { value: e.target.value })}
          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-900/70 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
          placeholder="+1 (555) 123-4567"
          disabled={!field.enabled}
        />
      );
    default:
      return (
        <input
          type="text"
          value={field.value}
          onChange={(e) => updateScanTargetField(index, { value: e.target.value })}
          className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-900/70 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
          placeholder={t('common.enterValue')}
          disabled={!field.enabled}
        />
      );
  }
};

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'date': return <Calendar className="w-3 h-3 text-blue-500" />;
      case 'checkbox': return <div className="w-3 h-3 border border-gray-400 rounded" />;
      case 'number': return <span className="text-xs font-mono text-gray-500">123</span>;
      case 'select': return <div className="w-3 h-3 border border-gray-400 rounded-sm bg-gray-100" />;
      case 'multi_select': return <div className="flex space-x-1"><div className="w-1 h-3 bg-blue-400 rounded-full"></div><div className="w-1 h-3 bg-green-400 rounded-full"></div></div>;
      case 'url': return <span className="text-xs text-blue-500">🔗</span>;
      case 'email': return <span className="text-xs">📧</span>;
      case 'phone_number': return <span className="text-xs">📞</span>;
      default: return <span className="text-xs font-mono text-gray-500">Aa</span>;
    }
  };

  // Get icon component by name
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Package, Hash, Shield, MapPin, Calendar, CalendarClock, DollarSign, Mail, ExternalLink, Tag, Tags, Type, Info, CheckSquare, Phone, Activity
    };
    return icons[iconName] || Info;
  };

  const iconOptions = [
    { value: 'Package', label: 'Package' },
    { value: 'Hash', label: 'Hash' },
    { value: 'Shield', label: 'Shield' },
    { value: 'MapPin', label: 'MapPin' },
    { value: 'Calendar', label: 'Calendar' },
    { value: 'CalendarClock', label: 'CalendarClock' },
    { value: 'DollarSign', label: 'DollarSign' },
    { value: 'Mail', label: 'Mail' },
    { value: 'ExternalLink', label: 'ExternalLink' },
    { value: 'Tag', label: 'Tag' },
    { value: 'Tags', label: 'Tags' },
    { value: 'Type', label: 'Type' },
    { value: 'Info', label: 'Info' },
    { value: 'CheckSquare', label: 'CheckSquare' },
    { value: 'Phone', label: 'Phone' },
    { value: 'Activity', label: 'Activity' }
  ];

  return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-start space-x-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white drop-shadow dark:drop-shadow-lg mb-2">{t('config.title')}</h1>
              <p className="text-gray-600 dark:text-gray-200 dark:font-medium text-sm sm:text-base">{t('config.subtitle')}</p>
            </div>
            <HelpTooltip content={t('help.config.overview')} />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-md rounded-xl lg:rounded-2xl border border-gray-200/50 dark:border-gray-700/70 shadow-sm mb-6">
          <div className="flex border-b border-gray-200/50 dark:border-gray-700/70">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'scan'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Configuraciones de Escaneo</span>
                <span className="sm:hidden">Escaneo</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('display')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'display'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Configuración de Vista</span>
                <span className="sm:hidden">Vista</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('attention')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'attention'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Criterios de Atención</span>
                <span className="sm:hidden">Atención</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'scan' && (
          <div>
            {/* Scan Configuration Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configuraciones de Escaneo</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Gestiona las configuraciones para actualizar campos automáticamente</p>
              </div>
              {!isCreatingScan && !editingScanConfig && (
                <button
                  onClick={handleStartCreateScan}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Configuración</span>
                </button>
              )}
            </div>

            {/* Scan Configuration Form */}
            {(isCreatingScan || editingScanConfig) && (
              <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/70 shadow-sm mb-6 lg:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      {editingScanConfig ? t('config.editConfiguration') : t('config.createConfiguration')}
                    </h2>
                    <HelpTooltip content={t('help.config.form')} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveScan}
                      className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      <span>{t('config.save')}</span>
                    </button>
                    <button
                      onClick={handleCancelScan}
                      className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-sm"
                    >
                      <X className="w-4 h-4" />
                      <span>{t('config.cancel')}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                  <div className="xl:col-span-1 space-y-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                          {t('config.configName')}
                        </label>
                        <HelpTooltip content={t('help.config.configName')} />
                      </div>
                      <input
                        type="text"
                        value={scanFormData.name || ''}
                        onChange={(e) => setScanFormData({ ...scanFormData, name: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-700 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300 transition-all duration-200 text-sm sm:text-base"
                        placeholder={t('config.configNamePlaceholder')}
                      />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                          {t('config.searchField')}
                        </label>
                        <HelpTooltip content={t('help.config.searchField')} />
                      </div>
                      <select
                        value={scanFormData.searchField || ''}
                        onChange={(e) => setScanFormData({ ...scanFormData, searchField: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-700 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-800/80 text-gray-900 dark:text-white transition-all duration-200 text-sm sm:text-base"
                      >
                        {availableFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={scanFormData.autoSave || false}
                            onChange={(e) => setScanFormData({ ...scanFormData, autoSave: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('config.autoSave')}</span>
                        </label>
                        <HelpTooltip content={t('help.config.autoSave')} />
                      </div>
                    </div>
                  </div>

                  <div className="xl:col-span-2">
                    <div className="flex items-center space-x-2 mb-4">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">{t('config.targetFields')}</h3>
                      <HelpTooltip content={t('help.config.targetFields')} />
                    </div>
                    <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                      {scanFormData.targetFields?.map((field, index) => (
                        <div key={field.fieldName} className="flex flex-col space-y-3 p-3 sm:p-4 bg-gray-50/50 dark:bg-gray-900/70 rounded-lg border border-gray-200/50 dark:border-gray-700/70">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={field.enabled}
                              onChange={(e) => updateScanTargetField(index, { enabled: e.target.checked })}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                            />

                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              {getFieldIcon(field.fieldType)}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{field.fieldName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-300 capitalize">{field.fieldType.replace('_', ' ')}</p>
                              </div>
                            </div>
                          </div>

                          {field.enabled && (
                            <div className="ml-7">
                              <div className="flex items-center space-x-2 mb-2">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-200">
                                  {t('config.fieldValue')}:
                                </label>
                                <HelpTooltip content={t('help.config.fieldValue')} />
                              </div>
                              {renderScanFieldValue(field, index)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
           
 )}

            {/* Existing Scan Configurations */}
            {!isCreatingScan && !editingScanConfig && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {scanConfigurations.map((config) => (
                  <div key={config.id} className="bg-white/80 dark:bg-gray-900/90 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/70 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-2 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">{config.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">{t('config.searchBy')} {config.searchField}</p>
                        </div>
                        <HelpTooltip content={t('help.config.configCard')} />
                      </div>
                      
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                          onClick={() => handleStartEditScan(config)}
                          className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                        >
                          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteScan(config.id)}
                          className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">{t('config.targetFieldsCount')}</span>
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {config.targetFields
                          .filter(field => field.enabled)
                          .slice(0, 3)
                          .map((field, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {field.fieldName}
                            </span>
                          ))}
                        {config.targetFields.filter(field => field.enabled).length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                            +{config.targetFields.filter(field => field.enabled).length - 3} {t('config.moreFields')}
                          </span>
                        )}
                      </div>

                      {config.autoSave && (
                        <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 mt-2">
                          <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full" />
                          <span>{t('config.autoSaveEnabled')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {scanConfigurations.length === 0 && (
                  <div className="col-span-full text-center py-8 sm:py-12">
                    <Settings className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">{t('config.noConfigurations')}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">{t('config.createFirst')}</p>
                    <button
                      onClick={handleStartCreateScan}
                      className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 text-sm sm:text-base"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t('config.createConfig')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'display' && (
          <div>
            {/* Display Configuration Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Configuración de Vista</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Personaliza cómo se muestran los artículos en el escaneo y en "Requiere Atención"</p>
              </div>
              {!isCreatingDisplay && !editingDisplayConfig && (
                <button
                  onClick={handleStartCreateDisplay}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Vista</span>
                </button>
              )}
            </div>

            {/* Active Configuration Indicator */}
            {activeDisplayConfig && !isCreatingDisplay && !editingDisplayConfig && (
              <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
                  <span className="font-medium text-green-800 dark:text-green-100">
                    Configuración Activa: {activeDisplayConfig.name}
                  </span>
                </div>
              </div>
            )}

            {/* Display Configuration Form */}
            {(isCreatingDisplay || editingDisplayConfig) && (
              <div className="bg-white/80 dark:bg-gray-900/90 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/80 shadow-sm mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {editingDisplayConfig ? 'Editar Vista' : 'Crear Nueva Vista'}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveDisplay}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar</span>
                    </button>
                    <button
                      onClick={handleCancelDisplay}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-sm"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Configuration Settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Nombre de la Vista
                      </label>
                      <input
                        type="text"
                        value={displayFormData.name || ''}
                        onChange={(e) => setDisplayFormData({ ...displayFormData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-800/80 text-sm text-gray-900 dark:text-white"
                        placeholder="ej., Vista Completa"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Layout Principal
                      </label>
                      <select
                        value={displayFormData.layout || 'grid'}
                        onChange={(e) => setDisplayFormData({ ...displayFormData, layout: e.target.value as 'grid' | 'list' | 'compact' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-800/80 text-sm text-gray-900 dark:text-white"
                      >
                        <option value="grid">Cuadrícula</option>
                        <option value="list">Lista</option>
                        <option value="compact">Compacto</option>
                      </select>
                    </div>

                    {/* ✅ NUEVO: Layout para "Requiere Atención" */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Layout "Requiere Atención"
                      </label>
                      <select
                        value={displayFormData.attentionLayout || 'detailed'}
                        onChange={(e) => setDisplayFormData({ ...displayFormData, attentionLayout: e.target.value as 'badges' | 'detailed' | 'minimal' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-800/80 text-sm text-gray-900 dark:text-white"
                      >
                        <option value="detailed">Detallado</option>
                        <option value="badges">Solo Badges</option>
                        <option value="minimal">Mínimo</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={displayFormData.showMetadata || false}
                          onChange={(e) => setDisplayFormData({ ...displayFormData, showMetadata: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Mostrar Metadatos</span>
                      </label>

                      {/* ✅ NUEVO: Opción para iconos en "Requiere Atención" */}
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={displayFormData.showAttentionIcons || false}
                          onChange={(e) => setDisplayFormData({ ...displayFormData, showAttentionIcons: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Iconos en "Requiere Atención"</span>
                      </label>
                    </div>
                  </div>

                  {/* Fields Configuration */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Configuración de Campos</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {displayFormData.displayFields?.map((field, index) => {
                        const IconComponent = getIconComponent(field.icon || 'Info');
                        return (
                          <div key={field.fieldName} className="p-4 bg-gray-50/50 dark:bg-gray-800/80 rounded-lg border border-gray-200/50 dark:border-gray-700/80">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Field Info and Enable */}
                              <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={field.enabled}
                                    onChange={(e) => updateDisplayField(index, { enabled: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <div className="flex items-center space-x-2 flex-1">
                                    <IconComponent className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{field.fieldName}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-300">{field.fieldType}</p>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Nombre a Mostrar
                                  </label>
                                  <input
                                    type="text"
                                    value={field.displayName}
                                    onChange={(e) => updateDisplayField(index, { displayName: e.target.value })}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white/50 dark:bg-gray-900/70 text-gray-900 dark:text-white"
                                    disabled={!field.enabled}
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Icono
                                  </label>
                                  <select
                                    value={field.icon || 'Info'}
                                    onChange={(e) => updateDisplayField(index, { icon: e.target.value })}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white/50 dark:bg-gray-900/70 text-gray-900 dark:text-white"
                                    disabled={!field.enabled}
                                  >
                                    {iconOptions.map(option => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Display Options */}
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Orden
                                  </label>
                                  <input
                                    type="number"
                                    value={field.order}
                                    onChange={(e) => updateDisplayField(index, { order: parseInt(e.target.value) || 1 })}
                                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white/50 dark:bg-gray-900/70 text-gray-900 dark:text-white"
                                    disabled={!field.enabled}
                                    min="1"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={field.showInSummary}
                                      onChange={(e) => updateDisplayField(index, { showInSummary: e.target.checked })}
                                      className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      disabled={!field.enabled}
                                    />
                                    <span className="text-xs text-gray-700 dark:text-gray-200">Mostrar en Resumen</span>
                                  </label>

                                  {/* ✅ NUEVO: Opción para mostrar en "Requiere Atención" */}
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={field.showInAttention}
                                      onChange={(e) => updateDisplayField(index, { showInAttention: e.target.checked })}
                                      className="w-3 h-3 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                      disabled={!field.enabled}
                                    />
                                    <span className="text-xs text-gray-700 dark:text-gray-200">Mostrar en "Requiere Atención"</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Display Configurations */}
            {!isCreatingDisplay && !editingDisplayConfig && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayConfigurations.map((config) => (
                  <div key={config.id} className={`bg-white/80 dark:bg-gray-900/90 backdrop-blur-md rounded-xl p-6 border shadow-sm hover:shadow-md transition-all duration-200 ${
                    activeDisplayConfig?.id === config.id ? 'border-green-300 bg-green-50/50 dark:bg-green-900/40 dark:border-green-700' : 'border-gray-200/50 dark:border-gray-700/80'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{config.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Layout: {config.layout}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Atención: {config.attentionLayout}</p>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {activeDisplayConfig?.id !== config.id && (
                          <button
                            onClick={() => handleActivateDisplay(config.id)}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-all duration-200"
                            title="Activar configuración"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEditDisplay(config)}
                          className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDisplay(config.id)}
                          className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Campos habilitados:</span> {config.displayFields.filter(f => f.enabled).length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">En "Requiere Atención":</span> {config.displayFields.filter(f => f.showInAttention).length}
                      </p>
                      
                      {activeDisplayConfig?.id === config.id && (
                        <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-300 mt-2">
                          <CheckCircle className="w-3 h-3" />
                          <span>Configuración Activa</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {displayConfigurations.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <Eye className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay configuraciones de vista</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Crea tu primera configuración para personalizar la vista</p>
                    <button
                      onClick={handleStartCreateDisplay}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear Vista</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

{activeTab === 'attention' && (
  <div>
    {/* Attention Configuration Header */}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Criterios de Atención</h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">Define qué artículos aparecerán en "Requiere Atención"</p>
      </div>
      {!isCreatingAttention && !editingAttentionConfig && (
        <button
          onClick={handleStartCreateAttention}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevos Criterios</span>
        </button>
      )}
    </div>

    {/* Active Configuration Indicator */}
    {activeAttentionConfig && !isCreatingAttention && !editingAttentionConfig && (
      <div className="bg-orange-50 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-300" />
          <span className="font-medium text-orange-800 dark:text-orange-200">
            Criterios Activos: {activeAttentionConfig.name}
          </span>
          <span className="text-sm text-orange-600 dark:text-orange-300">
            ({activeAttentionConfig.operator} - {activeAttentionConfig.criteria.filter(c => c.enabled).length} criterios)
          </span>
        </div>
      </div>
    )}

    {/* Attention Configuration Form */}
    {(isCreatingAttention || editingAttentionConfig) && (
      <div className="bg-white/80 dark:bg-gray-900/90 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/80 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {editingAttentionConfig ? 'Editar Criterios' : 'Crear Nuevos Criterios'}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveAttention}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Guardar</span>
            </button>
            <button
              onClick={handleCancelAttention}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 text-sm"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Nombre de los Criterios
              </label>
              <input
                type="text"
                value={attentionFormData.name || ''}
                onChange={(e) => setAttentionFormData({ ...attentionFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-900/70 text-sm text-gray-900 dark:text-white"
                placeholder="ej., Artículos Críticos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Operador Lógico
              </label>
              <select
                value={attentionFormData.operator || 'OR'}
                onChange={(e) => setAttentionFormData({ ...attentionFormData, operator: e.target.value as 'AND' | 'OR' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-900/70 text-sm text-gray-900 dark:text-white"
              >
                <option value="OR">OR (cualquier criterio)</option>
                <option value="AND">AND (todos los criterios)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={attentionFormData.enabled || false}
                  onChange={(e) => setAttentionFormData({ ...attentionFormData, enabled: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Criterios Habilitados</span>
              </label>
            </div>

            <button
              onClick={addAttentionCriterion}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-dashed border-gray-300 dark:border-orange-700 rounded-lg hover:border-orange-400 dark:hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/40 transition-all duration-200 text-sm text-gray-900 dark:text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Criterio</span>
            </button>
          </div>

          {/* Criteria Configuration */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Criterios de Atención</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {attentionFormData.criteria?.map((criterion, index) => (
                <div key={criterion.id} className="p-4 bg-orange-50/50 dark:bg-orange-900/70 rounded-lg border border-orange-200/50 dark:border-orange-700/80">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={criterion.enabled}
                        onChange={(e) => updateAttentionCriterion(index, { enabled: e.target.checked })}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Criterio {index + 1}
                      </span>
                    </div>
                    <button
                      onClick={() => removeAttentionCriterion(index)}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Campo
                      </label>
                      <select
                        value={criterion.fieldName}
                        onChange={(e) => {
                          const fieldType = database?.properties[e.target.value]?.type || 'rich_text';
                          updateAttentionCriterion(index, { 
                            fieldName: e.target.value,
                            fieldType,
                            value: '' // Reset value when field changes
                          });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white/50 dark:bg-orange-950/70 text-gray-900 dark:text-white"
                        disabled={!criterion.enabled}
                      >
                        {availableFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Condición
                      </label>
                      <select
                        value={criterion.condition}
                        onChange={(e) => updateAttentionCriterion(index, { condition: e.target.value as any })}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white/50 dark:bg-orange-950/70 text-gray-900 dark:text-white"
                        disabled={!criterion.enabled}
                      >
                        <option value="equals">Igual a</option>
                        <option value="not_equals">Diferente de</option>
                        <option value="empty">Está vacío</option>
                        <option value="not_empty">No está vacío</option>
                        <option value="contains">Contiene</option>
                        <option value="not_contains">No contiene</option>
                        <option value="less_than">Menor que</option>
                        <option value="greater_than">Mayor que</option>
                        <option value="is_true">Es verdadero</option>
                        <option value="is_false">Es falso</option>
                      </select>
                    </div>

                    {/* Value field - only show if condition requires a value */}
                    {!['empty', 'not_empty', 'is_true', 'is_false'].includes(criterion.condition) && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                          Valor
                        </label>
                        {criterion.fieldType === 'select' ? (
                          <AttentionSelectField
                            fieldName={criterion.fieldName}
                            value={criterion.value || ''}
                            onChange={(value) => updateAttentionCriterion(index, { value })}
                            disabled={!criterion.enabled}
                          />
                        ) : (
                          <input
                            type={criterion.fieldType === 'number' ? 'number' : 'text'}
                            value={criterion.value || ''}
                            onChange={(e) => updateAttentionCriterion(index, { value: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white/50 dark:bg-orange-950/70 text-gray-900 dark:text-white"
                            disabled={!criterion.enabled}
                            placeholder="Ingresar valor..."
                          />
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Prioridad
                      </label>
                      <select
                        value={criterion.priority}
                        onChange={(e) => updateAttentionCriterion(index, { priority: e.target.value as 'high' | 'medium' | 'low' })}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white/50 dark:bg-orange-950/70 text-gray-900 dark:text-white"
                        disabled={!criterion.enabled}
                      >
                        <option value="high">Alta</option>
                        <option value="medium">Media</option>
                        <option value="low">Baja</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-white dark:bg-gray-900/80 rounded border dark:border-gray-700/80">
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Descripción:</span> {criterion.description}
                    </p>
                  </div>
                </div>
              ))}

              {(!attentionFormData.criteria || attentionFormData.criteria.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay criterios definidos</p>
                  <p className="text-sm">Agrega criterios para definir qué artículos requieren atención</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Existing Attention Configurations */}
    {!isCreatingAttention && !editingAttentionConfig && (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {attentionConfigurations.map((config) => (
          <div key={config.id} className={`bg-white/80 dark:bg-gray-900/90 backdrop-blur-md rounded-xl p-6 border shadow-sm hover:shadow-md transition-all duration-200 ${
            activeAttentionConfig?.id === config.id
              ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-900/40 dark:border-orange-700'
              : 'border-gray-200/50 dark:border-gray-700/80'
          }`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{config.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Operador: {config.operator}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Estado: {config.enabled ? 'Habilitado' : 'Deshabilitado'}
                </p>
              </div>
              
              <div className="flex items-center space-x-1">
                {activeAttentionConfig?.id !== config.id && config.enabled && (
                  <button
                    onClick={() => handleActivateAttention(config.id)}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-all duration-200"
                    title="Activar criterios"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleStartEditAttention(config)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteAttention(config.id)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Criterios:</span> {config.criteria.filter(c => c.enabled).length} activos
              </p>
              
              <div className="flex flex-wrap gap-1">
                {config.criteria.filter(c => c.enabled).slice(0, 2).map((criterion, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                    {criterion.fieldName}
                  </span>
                ))}
                {config.criteria.filter(c => c.enabled).length > 2 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                    +{config.criteria.filter(c => c.enabled).length - 2} más
                  </span>
                )}
              </div>
              
              {activeAttentionConfig?.id === config.id && (
                <div className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-300 mt-2">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Criterios Activos</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {attentionConfigurations.length === 0 && (
          <div className="col-span-full text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-orange-300" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay criterios de atención</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Define criterios para determinar qué artículos requieren atención</p>
            <button
              onClick={handleStartCreateAttention}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Criterios</span>
            </button>
          </div>
        )}
      </div>
    )}
  </div>
)}
      </div>
    </div>
  );
};