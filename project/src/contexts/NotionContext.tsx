import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotionConfig, NotionDatabase, InventoryItem, ScanConfiguration, ScanHistory, DisplayConfiguration, AttentionConfiguration, AttentionCriterion } from '../types/notion';
import { notionService } from '../services/notionService';
import { useLanguage } from './LanguageContext';
import toast from 'react-hot-toast';

interface NotionContextType {
  config: NotionConfig | null;
  database: NotionDatabase | null;
  items: InventoryItem[];
  scanConfigurations: ScanConfiguration[];
  displayConfigurations: DisplayConfiguration[];
  activeDisplayConfig: DisplayConfiguration | null;
  attentionConfigurations: AttentionConfiguration[];
  activeAttentionConfig: AttentionConfiguration | null;
  scanHistory: ScanHistory[];
  isConnected: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  
  // Actions
  connectToNotion: (config: NotionConfig) => Promise<boolean>;
  disconnectFromNotion: () => void;
  enableDemoMode: () => void;
  refreshDatabase: () => Promise<void>;
  searchItem: (query: string, field?: string) => Promise<InventoryItem | null>;
  updateItem: (pageId: string, properties: Record<string, any>) => Promise<boolean>;
  addScanConfiguration: (config: Omit<ScanConfiguration, 'id'>) => void;
  updateScanConfiguration: (config: ScanConfiguration) => void;
  deleteScanConfiguration: (id: string) => void;
  addDisplayConfiguration: (config: Omit<DisplayConfiguration, 'id'>) => void;
  updateDisplayConfiguration: (config: DisplayConfiguration) => void;
  deleteDisplayConfiguration: (id: string) => void;
  setActiveDisplayConfig: (configId: string | null) => void;
  addAttentionConfiguration: (config: Omit<AttentionConfiguration, 'id'>) => void;
  updateAttentionConfiguration: (config: AttentionConfiguration) => void;
  deleteAttentionConfiguration: (id: string) => void;
  setActiveAttentionConfig: (configId: string | null) => void;
  getItemsNeedingAttention: () => InventoryItem[];
  getFieldOptions: (fieldName: string) => Promise<string[]>; // ✅ NUEVA FUNCIÓN
  addScanHistory: (entry: Omit<ScanHistory, 'id'>) => void;
}

const NotionContext = createContext<NotionContextType | undefined>(undefined);

export const useNotion = () => {
  const context = useContext(NotionContext);
  if (!context) {
    throw new Error('useNotion must be used within a NotionProvider');
  }
  return context;
};

// Demo data
const demoDatabase: NotionDatabase = {
  id: 'demo-database',
  title: 'Demo Inventory Database',
  properties: {
    'ID': { id: 'id', name: 'ID', type: 'title', options: [] },
    'Name': { id: 'name', name: 'Name', type: 'rich_text', options: [] },
    'Status': { id: 'status', name: 'Status', type: 'select', options: ['Active', 'Inactive', 'Maintenance', 'Retired'] }, // ✅ OPCIONES DEMO
    'Stock Available': { id: 'stock', name: 'Stock Available', type: 'checkbox', options: [] },
    'Last Revision': { id: 'revision', name: 'Last Revision', type: 'date', options: [] },
    'Next Revision': { id: 'next_revision', name: 'Next Revision', type: 'date', options: [] },
    'Condition': { id: 'condition', name: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'] }, // ✅ OPCIONES DEMO
    'Location': { id: 'location', name: 'Location', type: 'rich_text', options: [] },
    'Serial Number': { id: 'serial', name: 'Serial Number', type: 'rich_text', options: [] },
    'Category': { id: 'category', name: 'Category', type: 'select', options: ['Electronics', 'Furniture', 'Equipment', 'Supplies', 'Tools'] }, // ✅ OPCIONES DEMO
    'Priority': { id: 'priority', name: 'Priority', type: 'select', options: ['High', 'Medium', 'Low', 'Critical'] }, // ✅ OPCIONES DEMO
    'Notes': { id: 'notes', name: 'Notes', type: 'rich_text', options: [] },
    'Purchase Date': { id: 'purchase_date', name: 'Purchase Date', type: 'date', options: [] },
    'Warranty Expiry': { id: 'warranty', name: 'Warranty Expiry', type: 'date', options: [] },
    'Cost': { id: 'cost', name: 'Cost', type: 'number', options: [] },
    'Supplier Email': { id: 'supplier_email', name: 'Supplier Email', type: 'email', options: [] },
    'Supplier Phone': { id: 'supplier_phone', name: 'Supplier Phone', type: 'phone_number', options: [] },
    'Manual URL': { id: 'manual_url', name: 'Manual URL', type: 'url', options: [] },
    'Tags': { id: 'tags', name: 'Tags', type: 'multi_select', options: ['Laptop', 'Monitor', 'Phone', 'Tablet', 'Printer', 'Mouse', 'Keyboard', 'Development', 'Office', 'Conference'] }, // ✅ OPCIONES DEMO
    'Codigo Pegado': { id: 'codigo_pegado', name: 'Codigo Pegado', type: 'checkbox', options: [] },
    'Needs Maintenance': { id: 'needs_maintenance', name: 'Needs Maintenance', type: 'checkbox', options: [] }
  }
};

const demoItems: InventoryItem[] = [
  {
    id: '1',
    pageId: 'demo-page-1',
    properties: {
      'ID': 'INV-001',
      'Name': 'Laptop Dell Latitude 7420',
      'Status': 'Active',
      'Stock Available': true,
      'Last Revision': '2024-01-15',
      'Next Revision': '2024-04-15',
      'Condition': 'Excellent',
      'Location': 'Office A - Desk 12',
      'Serial Number': 'DL7420001',
      'Category': 'Electronics',
      'Priority': 'High',
      'Notes': 'Primary work laptop for development team',
      'Purchase Date': '2023-06-15',
      'Warranty Expiry': '2026-06-15',
      'Cost': 1299.99,
      'Supplier Email': 'sales@dell.com',
      'Supplier Phone': '+1-800-915-3355',
      'Manual URL': 'https://dell.com/support/manuals',
      'Tags': ['Laptop', 'Development', 'High-Performance'],
      'Codigo Pegado': true,
      'Needs Maintenance': false
    },
    lastEditedTime: '2024-01-15T10:30:00Z',
    createdTime: '2024-01-01T09:00:00Z'
  },
  {
    id: '2',
    pageId: 'demo-page-2',
    properties: {
      'ID': 'INV-002',
      'Name': 'Monitor Samsung 27" 4K',
      'Status': 'Active',
      'Stock Available': false,
      'Last Revision': '2024-01-10',
      'Next Revision': '2024-07-10',
      'Condition': 'Good',
      'Location': 'Office B - Conference Room',
      'Serial Number': 'SM27002',
      'Category': 'Electronics',
      'Priority': 'Medium',
      'Notes': 'Conference room display monitor',
      'Purchase Date': '2023-08-20',
      'Warranty Expiry': '2026-08-20',
      'Cost': 449.99,
      'Supplier Email': 'business@samsung.com',
      'Supplier Phone': '+1-800-726-7864',
      'Manual URL': 'https://samsung.com/support',
      'Tags': ['Monitor', 'Conference', '4K'],
      'Codigo Pegado': false,
      'Needs Maintenance': false
    },
    lastEditedTime: '2024-01-10T14:20:00Z',
    createdTime: '2024-01-02T11:00:00Z'
  },
  {
    id: '3',
    pageId: 'demo-page-3',
    properties: {
      'ID': 'INV-003',
      'Name': 'iPhone 15 Pro',
      'Status': 'Active',
      'Stock Available': true,
      'Last Revision': '2024-01-12',
      'Next Revision': '2024-04-12',
      'Condition': 'Excellent',
      'Location': 'Storage Room A',
      'Serial Number': 'IP15P003',
      'Category': 'Electronics',
      'Priority': 'High',
      'Notes': 'Company phone for executives',
      'Purchase Date': '2023-09-22',
      'Warranty Expiry': '2024-09-22',
      'Cost': 999.99,
      'Supplier Email': 'business@apple.com',
      'Supplier Phone': '+1-800-275-2273',
      'Manual URL': 'https://support.apple.com',
      'Tags': ['Phone', 'Executive', 'Mobile'],
      'Codigo Pegado': false,
      'Needs Maintenance': true
    },
    lastEditedTime: '2024-01-12T16:45:00Z',
    createdTime: '2024-01-03T08:30:00Z'
  },
  {
    id: '4',
    pageId: 'demo-page-4',
    properties: {
      'ID': 'INV-004',
      'Name': 'Printer HP LaserJet Pro',
      'Status': 'Maintenance',
      'Stock Available': true,
      'Last Revision': '2024-01-08',
      'Next Revision': '2024-02-08',
      'Condition': 'Fair',
      'Location': 'Office C - Print Station',
      'Serial Number': 'HP2024004',
      'Category': 'Equipment',
      'Priority': 'Medium',
      'Notes': 'Requires toner replacement soon',
      'Purchase Date': '2022-11-10',
      'Warranty Expiry': '2025-11-10',
      'Cost': 299.99,
      'Supplier Email': 'support@hp.com',
      'Supplier Phone': '+1-800-474-6836',
      'Manual URL': 'https://support.hp.com',
      'Tags': ['Printer', 'Office', 'LaserJet'],
      'Codigo Pegado': true,
      'Needs Maintenance': true
    },
    lastEditedTime: '2024-01-08T11:15:00Z',
    createdTime: '2024-01-04T14:20:00Z'
  },
  {
    id: '5',
    pageId: 'demo-page-5',
    properties: {
      'ID': 'INV-005',
      'Name': 'Wireless Mouse Logitech MX',
      'Status': 'Active',
      'Stock Available': true,
      'Last Revision': '2024-01-14',
      'Next Revision': '2024-10-14',
      'Condition': 'Good',
      'Location': 'Office A - Desk 5',
      'Serial Number': 'LG2024005',
      'Category': 'Electronics',
      'Priority': 'Low',
      'Notes': 'Ergonomic mouse for daily use',
      'Purchase Date': '2023-12-01',
      'Warranty Expiry': '2025-12-01',
      'Cost': 79.99,
      'Supplier Email': 'business@logitech.com',
      'Supplier Phone': '+1-646-454-3200',
      'Manual URL': 'https://support.logi.com',
      'Tags': ['Mouse', 'Wireless', 'Ergonomic'],
      'Codigo Pegado': false,
      'Needs Maintenance': false
    },
    lastEditedTime: '2024-01-14T09:30:00Z',
    createdTime: '2024-01-05T10:45:00Z'
  },
  {
    id: '6',
    pageId: 'demo-page-6',
    properties: {
      'ID': 'INV-006',
      'Name': 'Tablet iPad Air',
      'Status': 'Inactive',
      'Stock Available': false,
      'Last Revision': '2024-01-05',
      'Next Revision': '2024-03-05',
      'Condition': 'Poor',
      'Location': 'Repair Center',
      'Serial Number': 'IPAD006',
      'Category': 'Electronics',
      'Priority': 'Low',
      'Notes': 'Screen cracked, needs repair',
      'Purchase Date': '2022-05-15',
      'Warranty Expiry': '2023-05-15',
      'Cost': 599.99,
      'Supplier Email': 'business@apple.com',
      'Supplier Phone': '+1-800-275-2273',
      'Manual URL': 'https://support.apple.com',
      'Tags': ['Tablet', 'Damaged', 'Repair'],
      'Codigo Pegado': true,
      'Needs Maintenance': false
    },
    lastEditedTime: '2024-01-05T13:20:00Z',
    createdTime: '2024-01-06T15:30:00Z'
  }
];

const demoScanHistory: ScanHistory[] = [
  {
    id: '1',
    itemId: 'INV-001',
    itemName: 'Laptop Dell Latitude 7420',
    scanTime: new Date('2024-01-15T10:30:00Z'),
    configurationUsed: 'Stock Check',
    fieldsModified: ['Stock Available', 'Last Revision'],
    user: 'Demo User'
  },
  {
    id: '2',
    itemId: 'INV-003',
    itemName: 'iPhone 15 Pro',
    scanTime: new Date('2024-01-12T16:45:00Z'),
    configurationUsed: 'Quality Control',
    fieldsModified: ['Condition', 'Last Revision'],
    user: 'Demo User'
  },
  {
    id: '3',
    itemId: 'INV-005',
    itemName: 'Wireless Mouse Logitech MX',
    scanTime: new Date('2024-01-14T09:30:00Z'),
    configurationUsed: 'Stock Check',
    fieldsModified: ['Stock Available'],
    user: 'Demo User'
  }
];

const demoScanConfigurations: ScanConfiguration[] = [
  {
    id: 'demo-config-1',
    name: 'Stock Check',
    searchField: 'ID',
    autoSave: true,
    targetFields: [
      { fieldName: 'Stock Available', fieldType: 'checkbox', value: true, enabled: true },
      { fieldName: 'Last Revision', fieldType: 'date', value: '__CURRENT_DATE__', enabled: true },
      { fieldName: 'Next Revision', fieldType: 'date', value: '__PLUS_3_MONTHS__', enabled: true },
      { fieldName: 'Status', fieldType: 'select', value: 'Active', enabled: false },
      { fieldName: 'Condition', fieldType: 'select', value: 'Excellent', enabled: false },
      { fieldName: 'Location', fieldType: 'rich_text', value: '', enabled: false },
      { fieldName: 'Name', fieldType: 'rich_text', value: '', enabled: false },
      { fieldName: 'Serial Number', fieldType: 'rich_text', value: '', enabled: false },
      { fieldName: 'Category', fieldType: 'select', value: '', enabled: false },
      { fieldName: 'Priority', fieldType: 'select', value: '', enabled: false },
      { fieldName: 'Notes', fieldType: 'rich_text', value: '', enabled: false },
      { fieldName: 'Purchase Date', fieldType: 'date', value: '', enabled: false },
      { fieldName: 'Warranty Expiry', fieldType: 'date', value: '', enabled: false },
      { fieldName: 'Cost', fieldType: 'number', value: 0, enabled: false },
      { fieldName: 'Supplier Email', fieldType: 'email', value: '', enabled: false },
      { fieldName: 'Supplier Phone', fieldType: 'phone_number', value: '', enabled: false },
      { fieldName: 'Manual URL', fieldType: 'url', value: '', enabled: false },
      { fieldName: 'Tags', fieldType: 'multi_select', value: [], enabled: false }
    ]
  },
  {
    id: 'demo-config-2',
    name: 'Quality Control',
    searchField: 'Serial Number',
    autoSave: false,
    targetFields: [
      { fieldName: 'Condition', fieldType: 'select', value: 'Excellent', enabled: true },
      { fieldName: 'Last Revision', fieldType: 'date', value: '__CURRENT_DATE__', enabled: true },
      { fieldName: 'Next Revision', fieldType: 'date', value: '__PLUS_6_MONTHS__', enabled: true },
      { fieldName: 'Status', fieldType: 'select', value: 'Active', enabled: true },
      { fieldName: 'Stock Available', fieldType: 'checkbox', value: true, enabled: false },
      { fieldName: 'Location', fieldType: 'rich_text', value: '', enabled: false },
      { fieldName: 'Name', fieldType: 'rich_text', value: '', enabled: false },
      { fieldName: 'Serial Number', fieldType: 'rich_text', value: '', enabled: false },
      { fieldName: 'Category', fieldType: 'select', value: '', enabled: false },
      { fieldName: 'Priority', fieldType: 'select', value: '', enabled: false },
      { fieldName: 'Notes', fieldType: 'rich_text', value: '', enabled: false },
      { fieldName: 'Purchase Date', fieldType: 'date', value: '', enabled: false },
      { fieldName: 'Warranty Expiry', fieldType: 'date', value: '', enabled: false },
      { fieldName: 'Cost', fieldType: 'number', value: 0, enabled: false },
      { fieldName: 'Supplier Email', fieldType: 'email', value: '', enabled: false },
      { fieldName: 'Supplier Phone', fieldType: 'phone_number', value: '', enabled: false },
      { fieldName: 'Manual URL', fieldType: 'url', value: '', enabled: false },
      { fieldName: 'Tags', fieldType: 'multi_select', value: [], enabled: false }
    ]
  }
];

const demoDisplayConfigurations: DisplayConfiguration[] = [
  {
    id: 'demo-display-1',
    name: 'Vista Completa',
    layout: 'grid',
    showMetadata: true,
    attentionLayout: 'detailed', // ✅ NUEVO
    showAttentionIcons: true, // ✅ NUEVO
    displayFields: [
      { fieldName: 'Name', fieldType: 'rich_text', displayName: 'Nombre', enabled: true, order: 1, showInSummary: true, showInAttention: true, icon: 'Package' },
      { fieldName: 'ID', fieldType: 'title', displayName: 'ID', enabled: true, order: 2, showInSummary: true, showInAttention: true, icon: 'Hash' },
      { fieldName: 'Status', fieldType: 'select', displayName: 'Estado', enabled: true, order: 3, showInSummary: true, showInAttention: true, icon: 'Activity' },
      { fieldName: 'Stock Available', fieldType: 'checkbox', displayName: 'Stock', enabled: true, order: 4, showInSummary: true, showInAttention: false, icon: 'Package' },
      { fieldName: 'Condition', fieldType: 'select', displayName: 'Condición', enabled: true, order: 5, showInSummary: true, showInAttention: true, icon: 'Shield' },
      { fieldName: 'Location', fieldType: 'rich_text', displayName: 'Ubicación', enabled: true, order: 6, showInSummary: false, showInAttention: true, icon: 'MapPin' },
      { fieldName: 'Serial Number', fieldType: 'rich_text', displayName: 'Número de Serie', enabled: true, order: 7, showInSummary: false, showInAttention: false, icon: 'Hash' },
      { fieldName: 'Category', fieldType: 'select', displayName: 'Categoría', enabled: true, order: 8, showInSummary: false, showInAttention: true, icon: 'Tag' },
      { fieldName: 'Last Revision', fieldType: 'date', displayName: 'Última Revisión', enabled: true, order: 9, showInSummary: false, showInAttention: false, icon: 'Calendar' },
      { fieldName: 'Next Revision', fieldType: 'date', displayName: 'Próxima Revisión', enabled: true, order: 10, showInSummary: false, showInAttention: false, icon: 'CalendarClock' },
      { fieldName: 'Cost', fieldType: 'number', displayName: 'Costo', enabled: false, order: 11, showInSummary: false, showInAttention: false, icon: 'DollarSign' },
      { fieldName: 'Supplier Email', fieldType: 'email', displayName: 'Email Proveedor', enabled: false, order: 12, showInSummary: false, showInAttention: false, icon: 'Mail' },
      { fieldName: 'Manual URL', fieldType: 'url', displayName: 'Manual', enabled: false, order: 13, showInSummary: false, showInAttention: false, icon: 'ExternalLink' }
    ]
  },
  {
    id: 'demo-display-2',
    name: 'Vista Compacta',
    layout: 'compact',
    showMetadata: false,
    attentionLayout: 'badges', // ✅ NUEVO
    showAttentionIcons: false, // ✅ NUEVO
    displayFields: [
      { fieldName: 'Name', fieldType: 'rich_text', displayName: 'Nombre', enabled: true, order: 1, showInSummary: true, showInAttention: true, icon: 'Package' },
      { fieldName: 'ID', fieldType: 'title', displayName: 'ID', enabled: true, order: 2, showInSummary: true, showInAttention: false, icon: 'Hash' },
      { fieldName: 'Stock Available', fieldType: 'checkbox', displayName: 'Stock', enabled: true, order: 3, showInSummary: true, showInAttention: false, icon: 'Package' },
      { fieldName: 'Condition', fieldType: 'select', displayName: 'Condición', enabled: true, order: 4, showInSummary: true, showInAttention: true, icon: 'Shield' }
    ]
  },
  {
    id: 'demo-display-3',
    name: 'Vista Técnica',
    layout: 'list',
    showMetadata: true,
    attentionLayout: 'minimal', // ✅ NUEVO
    showAttentionIcons: true, // ✅ NUEVO
    displayFields: [
      { fieldName: 'Name', fieldType: 'rich_text', displayName: 'Nombre', enabled: true, order: 1, showInSummary: true, showInAttention: true, icon: 'Package' },
      { fieldName: 'Serial Number', fieldType: 'rich_text', displayName: 'Número de Serie', enabled: true, order: 2, showInSummary: true, showInAttention: true, icon: 'Hash' },
      { fieldName: 'Category', fieldType: 'select', displayName: 'Categoría', enabled: true, order: 3, showInSummary: true, showInAttention: false, icon: 'Tag' },
      { fieldName: 'Location', fieldType: 'rich_text', displayName: 'Ubicación', enabled: true, order: 4, showInSummary: true, showInAttention: true, icon: 'MapPin' },
      { fieldName: 'Last Revision', fieldType: 'date', displayName: 'Última Revisión', enabled: true, order: 5, showInSummary: false, showInAttention: false, icon: 'Calendar' },
      { fieldName: 'Next Revision', fieldType: 'date', displayName: 'Próxima Revisión', enabled: true, order: 6, showInSummary: false, showInAttention: false, icon: 'CalendarClock' },
      { fieldName: 'Supplier Email', fieldType: 'email', displayName: 'Email Proveedor', enabled: true, order: 7, showInSummary: false, showInAttention: false, icon: 'Mail' },
      { fieldName: 'Manual URL', fieldType: 'url', displayName: 'Manual', enabled: true, order: 8, showInSummary: false, showInAttention: false, icon: 'ExternalLink' }
    ]
  }
];

// ✅ NUEVO: Configuraciones de Criterios de Atención Demo
const demoAttentionConfigurations: AttentionConfiguration[] = [
  {
    id: 'demo-attention-1',
    name: 'Criterios por Defecto',
    operator: 'OR',
    enabled: true,
    criteria: [
      {
        id: 'criteria-1',
        fieldName: 'Condition',
        fieldType: 'select',
        condition: 'equals',
        value: 'Poor',
        priority: 'high',
        enabled: true,
        description: 'Artículos en mal estado'
      },
      {
        id: 'criteria-2',
        fieldName: 'Stock Available',
        fieldType: 'checkbox',
        condition: 'is_false',
        priority: 'medium',
        enabled: true,
        description: 'Artículos sin stock'
      }
    ]
  },
  {
    id: 'demo-attention-2',
    name: 'Código Pegado Faltante',
    operator: 'AND',
    enabled: false,
    criteria: [
      {
        id: 'criteria-3',
        fieldName: 'Codigo Pegado',
        fieldType: 'checkbox',
        condition: 'is_false',
        priority: 'medium',
        enabled: true,
        description: 'Artículos sin código pegado'
      },
      {
        id: 'criteria-4',
        fieldName: 'Status',
        fieldType: 'select',
        condition: 'equals',
        value: 'Active',
        priority: 'low',
        enabled: true,
        description: 'Solo artículos activos'
      }
    ]
  },
  {
    id: 'demo-attention-3',
    name: 'Mantenimiento Requerido',
    operator: 'OR',
    enabled: false,
    criteria: [
      {
        id: 'criteria-5',
        fieldName: 'Needs Maintenance',
        fieldType: 'checkbox',
        condition: 'is_true',
        priority: 'high',
        enabled: true,
        description: 'Artículos que necesitan mantenimiento'
      },
      {
        id: 'criteria-6',
        fieldName: 'Status',
        fieldType: 'select',
        condition: 'equals',
        value: 'Maintenance',
        priority: 'high',
        enabled: true,
        description: 'Artículos en mantenimiento'
      }
    ]
  }
];

export const NotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<NotionConfig | null>(null);
  const [database, setDatabase] = useState<NotionDatabase | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [scanConfigurations, setScanConfigurations] = useState<ScanConfiguration[]>([]);
  const [displayConfigurations, setDisplayConfigurations] = useState<DisplayConfiguration[]>([]);
  const [activeDisplayConfig, setActiveDisplayConfigState] = useState<DisplayConfiguration | null>(null);
  const [attentionConfigurations, setAttentionConfigurations] = useState<AttentionConfiguration[]>([]);
  const [activeAttentionConfig, setActiveAttentionConfigState] = useState<AttentionConfiguration | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Load saved data from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('notion-config');
    const savedConfigurations = localStorage.getItem('scan-configurations');
    const savedDisplayConfigurations = localStorage.getItem('display-configurations');
    const savedActiveDisplayConfig = localStorage.getItem('active-display-config');
    const savedAttentionConfigurations = localStorage.getItem('attention-configurations');
    const savedActiveAttentionConfig = localStorage.getItem('active-attention-config');
    const savedHistory = localStorage.getItem('scan-history');
    const savedDemoMode = localStorage.getItem('demo-mode');

    if (savedDemoMode === 'true') {
      enableDemoMode();
      return;
    }

    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
      // Auto-connect if config exists
      connectToNotion(parsedConfig);
    }

    if (savedConfigurations) {
      setScanConfigurations(JSON.parse(savedConfigurations));
    }

    if (savedDisplayConfigurations) {
      const configs = JSON.parse(savedDisplayConfigurations);
      setDisplayConfigurations(configs);
      
      // Set active display config
      if (savedActiveDisplayConfig) {
        const activeConfig = configs.find((c: DisplayConfiguration) => c.id === savedActiveDisplayConfig);
        if (activeConfig) {
          setActiveDisplayConfigState(activeConfig);
        }
      } else if (configs.length > 0) {
        setActiveDisplayConfigState(configs[0]);
      }
    }

    if (savedAttentionConfigurations) {
      const configs = JSON.parse(savedAttentionConfigurations);
      setAttentionConfigurations(configs);
      
      // Set active attention config
      if (savedActiveAttentionConfig) {
        const activeConfig = configs.find((c: AttentionConfiguration) => c.id === savedActiveAttentionConfig);
        if (activeConfig) {
          setActiveAttentionConfigState(activeConfig);
        }
      } else {
        // Find first enabled config
        const enabledConfig = configs.find((c: AttentionConfiguration) => c.enabled);
        if (enabledConfig) {
          setActiveAttentionConfigState(enabledConfig);
        }
      }
    }

    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      // Convert scanTime strings back to Date objects
      const historyWithDates = parsedHistory.map((entry: any) => ({
        ...entry,
        scanTime: new Date(entry.scanTime)
      }));
      setScanHistory(historyWithDates);
    }
  }, []);

  // Save configurations to localStorage
  useEffect(() => {
    if (scanConfigurations.length > 0 && !isDemoMode) {
      localStorage.setItem('scan-configurations', JSON.stringify(scanConfigurations));
    }
  }, [scanConfigurations, isDemoMode]);

  useEffect(() => {
    if (displayConfigurations.length > 0 && !isDemoMode) {
      localStorage.setItem('display-configurations', JSON.stringify(displayConfigurations));
    }
  }, [displayConfigurations, isDemoMode]);

  useEffect(() => {
    if (activeDisplayConfig && !isDemoMode) {
      localStorage.setItem('active-display-config', activeDisplayConfig.id);
    }
  }, [activeDisplayConfig, isDemoMode]);

  useEffect(() => {
    if (attentionConfigurations.length > 0 && !isDemoMode) {
      localStorage.setItem('attention-configurations', JSON.stringify(attentionConfigurations));
    }
  }, [attentionConfigurations, isDemoMode]);

  useEffect(() => {
    if (activeAttentionConfig && !isDemoMode) {
      localStorage.setItem('active-attention-config', activeAttentionConfig.id);
    }
  }, [activeAttentionConfig, isDemoMode]);

  useEffect(() => {
    if (scanHistory.length > 0 && !isDemoMode) {
      localStorage.setItem('scan-history', JSON.stringify(scanHistory));
    }
  }, [scanHistory, isDemoMode]);

  const enableDemoMode = () => {
    setIsDemoMode(true);
    setIsConnected(true);
    setConfig({
      token: 'demo-token',
      databaseId: 'demo-database',
      workspaceName: 'Demo Workspace'
    });
    setDatabase(demoDatabase);
    setItems(demoItems);
    setScanConfigurations(demoScanConfigurations);
    setDisplayConfigurations(demoDisplayConfigurations);
    setActiveDisplayConfigState(demoDisplayConfigurations[0]);
    setAttentionConfigurations(demoAttentionConfigurations);
    setActiveAttentionConfigState(demoAttentionConfigurations[0]); // Usar la primera configuración habilitada
    setScanHistory(demoScanHistory);
    localStorage.setItem('demo-mode', 'true');
    toast.success('¡Modo demo activado! Explora todas las funcionalidades');
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'NETWORK_ERROR':
        return 'Network connection failed. Please check your internet connection, firewall settings, or browser extensions that might be blocking the request.';
      case 'INVALID_TOKEN':
        return 'Invalid Notion token. Please check your integration token and try again.';
      case 'DATABASE_NOT_FOUND':
        return 'Database not found. Please verify the database ID is correct and the integration has access to it.';
      case 'ACCESS_DENIED':
        return 'Access denied. Please ensure your integration has the necessary permissions to access this database.';
      case 'API_ERROR':
        return 'Notion API error. Please try again later or check Notion\'s status page.';
      case 'UNKNOWN_ERROR':
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const connectToNotion = async (notionConfig: NotionConfig): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await notionService.connect(notionConfig);
      if (result.success) {
        setConfig(notionConfig);
        setIsConnected(true);
        setIsDemoMode(false);
        localStorage.setItem('notion-config', JSON.stringify(notionConfig));
        localStorage.removeItem('demo-mode');
        
        // Load database info
        const dbInfo = await notionService.getDatabaseInfo(notionConfig.databaseId);
        if (dbInfo) {
          setDatabase(dbInfo);
          await refreshDatabase();
          
          // Create default display configuration if none exists
          if (displayConfigurations.length === 0) {
            createDefaultDisplayConfiguration(dbInfo);
          }

          // Create default attention configuration if none exists
          if (attentionConfigurations.length === 0) {
            createDefaultAttentionConfiguration(dbInfo);
          }
        }
        
        toast.success('Successfully connected to Notion!');
        return true;
      } else {
        const errorMessage = getErrorMessage(result.error || 'UNKNOWN_ERROR');
        toast.error(errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Connection failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultDisplayConfiguration = (database: NotionDatabase) => {
    const defaultConfig: DisplayConfiguration = {
      id: 'default-config',
      name: 'Vista por Defecto',
      layout: 'grid',
      showMetadata: false,
      attentionLayout: 'detailed', // ✅ NUEVO
      showAttentionIcons: true, // ✅ NUEVO
      displayFields: Object.keys(database.properties).map((fieldName, index) => ({
        fieldName,
        fieldType: database.properties[fieldName].type,
        displayName: fieldName,
        enabled: index < 6, // Enable first 6 fields by default
        order: index + 1,
        showInSummary: index < 4, // Show first 4 in summary
        showInAttention: index < 3, // ✅ NUEVO: Show first 3 in attention
        icon: getDefaultIconForFieldType(database.properties[fieldName].type)
      }))
    };
    
    setDisplayConfigurations([defaultConfig]);
    setActiveDisplayConfigState(defaultConfig);
  };

  const createDefaultAttentionConfiguration = (database: NotionDatabase) => {
    const criteria: AttentionCriterion[] = [];
    
    // Look for common fields and create default criteria
    Object.keys(database.properties).forEach((fieldName, index) => {
      const fieldType = database.properties[fieldName].type;
      const lowerFieldName = fieldName.toLowerCase();
      
      // Condition field
      if (lowerFieldName.includes('condition') || lowerFieldName.includes('condicion')) {
        criteria.push({
          id: `criteria-condition-${index}`,
          fieldName,
          fieldType,
          condition: 'equals',
          value: 'Poor',
          priority: 'high',
          enabled: true,
          description: `Artículos con ${fieldName} = Poor`
        });
      }
      
      // Stock field
      if ((lowerFieldName.includes('stock') || lowerFieldName.includes('available')) && fieldType === 'checkbox') {
        criteria.push({
          id: `criteria-stock-${index}`,
          fieldName,
          fieldType,
          condition: 'is_false',
          priority: 'medium',
          enabled: true,
          description: `Artículos sin ${fieldName}`
        });
      }
    });

    if (criteria.length > 0) {
      const defaultConfig: AttentionConfiguration = {
        id: 'default-attention-config',
        name: 'Criterios por Defecto',
        operator: 'OR',
        enabled: true,
        criteria
      };
      
      setAttentionConfigurations([defaultConfig]);
      setActiveAttentionConfigState(defaultConfig);
    }
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

  const disconnectFromNotion = () => {
    setConfig(null);
    setDatabase(null);
    setItems([]);
    setDisplayConfigurations([]);
    setActiveDisplayConfigState(null);
    setAttentionConfigurations([]);
    setActiveAttentionConfigState(null);
    setIsConnected(false);
    setIsDemoMode(false);
    localStorage.removeItem('notion-config');
    localStorage.removeItem('display-configurations');
    localStorage.removeItem('active-display-config');
    localStorage.removeItem('attention-configurations');
    localStorage.removeItem('active-attention-config');
    localStorage.removeItem('demo-mode');
    notionService.disconnect();
    toast.success('Disconnected from Notion');
  };

  const refreshDatabase = async () => {
    if (!config || isDemoMode) return;
    
    setIsLoading(true);
    try {
      const data = await notionService.queryDatabase(config.databaseId);
      setItems(data);
    } catch (error) {
      console.error('Failed to refresh database:', error);
      toast.error('Failed to refresh database');
    } finally {
      setIsLoading(false);
    }
  };

  const searchItem = async (query: string, field?: string): Promise<InventoryItem | null> => {
    if (isDemoMode) {
      // Demo search logic
      const searchField = field || 'ID';
      const item = demoItems.find(item => 
        item.properties[searchField]?.toString().toLowerCase().includes(query.toLowerCase()) ||
        item.properties['Serial Number']?.toString().toLowerCase().includes(query.toLowerCase()) ||
        item.properties['Name']?.toString().toLowerCase().includes(query.toLowerCase())
      );
      return item || null;
    }

    if (!config) return null;
    
    try {
      const searchField = field || Object.keys(database?.properties || {})[0] || 'ID';
      const fieldType = database?.properties[searchField]?.type;
      return await notionService.searchItem(config.databaseId, query, searchField, fieldType);
    } catch (error) {
      console.error('Search failed:', error);
      
      // Mostrar mensaje de error más específico al usuario
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error en la búsqueda. Verifica que el valor sea compatible con el tipo de campo.');
      }
      
      return null;
    }
  };

  const processDateValue = (value: any): string => {
    if (typeof value !== 'string') return value;
    
    const now = new Date();
    
    switch (value) {
      case '__CURRENT_DATE__':
        return now.toISOString().split('T')[0];
      case '__PLUS_1_MONTH__':
        const plus1Month = new Date(now);
        plus1Month.setMonth(plus1Month.getMonth() + 1);
        return plus1Month.toISOString().split('T')[0];
      case '__PLUS_3_MONTHS__':
        const plus3Months = new Date(now);
        plus3Months.setMonth(plus3Months.getMonth() + 3);
        return plus3Months.toISOString().split('T')[0];
      case '__PLUS_6_MONTHS__':
        const plus6Months = new Date(now);
        plus6Months.setMonth(plus6Months.getMonth() + 6);
        return plus6Months.toISOString().split('T')[0];
      case '__PLUS_1_YEAR__':
        const plus1Year = new Date(now);
        plus1Year.setFullYear(plus1Year.getFullYear() + 1);
        return plus1Year.toISOString().split('T')[0];
      default:
        return value;
    }
  };

  const updateItem = async (pageId: string, properties: Record<string, any>): Promise<boolean> => {
    if (isDemoMode) {
      // Demo update logic with date processing
      const processedProperties = { ...properties };
      
      // Process date values
      Object.keys(processedProperties).forEach(key => {
        if (database?.properties[key]?.type === 'date') {
          processedProperties[key] = processDateValue(processedProperties[key]);
        }
      });

      setItems(prevItems => 
        prevItems.map(item => 
          item.pageId === pageId 
            ? { ...item, properties: { ...item.properties, ...processedProperties }, lastEditedTime: new Date().toISOString() }
            : item
        )
      );
      toast.success('Item updated successfully (Demo Mode)');
      return true;
    }

    try {
      // Process date values before sending to Notion
      const processedProperties = { ...properties };
      Object.keys(processedProperties).forEach(key => {
        if (database?.properties[key]?.type === 'date') {
          processedProperties[key] = processDateValue(processedProperties[key]);
        }
      });

      const success = await notionService.updatePage(pageId, processedProperties);
      if (success) {
        await refreshDatabase();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update failed:', error);
      return false;
    }
  };

  const addScanConfiguration = (config: Omit<ScanConfiguration, 'id'>) => {
    const newConfig: ScanConfiguration = {
      ...config,
      id: Date.now().toString(),
    };
    setScanConfigurations(prev => [...prev, newConfig]);
  };

  const updateScanConfiguration = (config: ScanConfiguration) => {
    setScanConfigurations(prev => prev.map(c => c.id === config.id ? config : c));
  };

  const deleteScanConfiguration = (id: string) => {
    setScanConfigurations(prev => prev.filter(c => c.id !== id));
  };

  const addDisplayConfiguration = (config: Omit<DisplayConfiguration, 'id'>) => {
    const newConfig: DisplayConfiguration = {
      ...config,
      id: Date.now().toString(),
    };
    setDisplayConfigurations(prev => [...prev, newConfig]);
  };

  const updateDisplayConfiguration = (config: DisplayConfiguration) => {
    setDisplayConfigurations(prev => prev.map(c => c.id === config.id ? config : c));
    
    // Update active config if it's the one being updated
    if (activeDisplayConfig?.id === config.id) {
      setActiveDisplayConfigState(config);
    }
  };

  const deleteDisplayConfiguration = (id: string) => {
    setDisplayConfigurations(prev => prev.filter(c => c.id !== id));
    
    // If deleting active config, set first available as active
    if (activeDisplayConfig?.id === id) {
      const remaining = displayConfigurations.filter(c => c.id !== id);
      setActiveDisplayConfigState(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const setActiveDisplayConfig = (configId: string | null) => {
    if (configId) {
      const config = displayConfigurations.find(c => c.id === configId);
      setActiveDisplayConfigState(config || null);
    } else {
      setActiveDisplayConfigState(null);
    }
  };

  // ✅ FUNCIONES: Gestión de Criterios de Atención
  const addAttentionConfiguration = (config: Omit<AttentionConfiguration, 'id'>) => {
    const newConfig: AttentionConfiguration = {
      ...config,
      id: Date.now().toString(),
    };
    setAttentionConfigurations(prev => [...prev, newConfig]);
  };

  const updateAttentionConfiguration = (config: AttentionConfiguration) => {
    setAttentionConfigurations(prev => prev.map(c => c.id === config.id ? config : c));
    
    // Update active config if it's the one being updated
    if (activeAttentionConfig?.id === config.id) {
      setActiveAttentionConfigState(config);
    }
  };

  const deleteAttentionConfiguration = (id: string) => {
    setAttentionConfigurations(prev => prev.filter(c => c.id !== id));
    
    // If deleting active config, set first available as active
    if (activeAttentionConfig?.id === id) {
      const remaining = attentionConfigurations.filter(c => c.id !== id);
      const enabledConfig = remaining.find(c => c.enabled);
      setActiveAttentionConfigState(enabledConfig || null);
    }
  };

  const setActiveAttentionConfig = (configId: string | null) => {
    if (configId) {
      const config = attentionConfigurations.find(c => c.id === configId);
      setActiveAttentionConfigState(config || null);
    } else {
      setActiveAttentionConfigState(null);
    }
  };

  // ✅ FUNCIÓN PRINCIPAL: Evaluar qué artículos necesitan atención
  const getItemsNeedingAttention = (): InventoryItem[] => {
    if (!activeAttentionConfig || !activeAttentionConfig.enabled) {
      console.log('🔍 No active attention configuration or disabled');
      return [];
    }

    console.log('🔍 === EVALUATING ATTENTION CRITERIA ===');
    console.log('🔍 Active config:', activeAttentionConfig.name);
    console.log('🔍 Operator:', activeAttentionConfig.operator);
    console.log('🔍 Enabled criteria:', activeAttentionConfig.criteria.filter(c => c.enabled));

    const enabledCriteria = activeAttentionConfig.criteria.filter(c => c.enabled);
    if (enabledCriteria.length === 0) {
      console.log('🔍 No enabled criteria');
      return [];
    }

    const itemsNeedingAttention = items.filter(item => {
      const itemId = item.properties['ID'] || item.properties['Name'] || item.id;
      console.log(`🔍 Evaluating item: ${itemId}`);

      const criteriaResults = enabledCriteria.map(criterion => {
        const fieldValue = item.properties[criterion.fieldName];
        const result = evaluateCriterion(criterion, fieldValue);
        console.log(`🔍   Criterion "${criterion.description}": ${result} (value: ${JSON.stringify(fieldValue)})`);
        return result;
      });

      let needsAttention: boolean;
      if (activeAttentionConfig.operator === 'AND') {
        needsAttention = criteriaResults.every(result => result);
      } else { // OR
        needsAttention = criteriaResults.some(result => result);
      }

      console.log(`🔍   Final result for ${itemId}: ${needsAttention}`);
      return needsAttention;
    });

    console.log(`🔍 Total items needing attention: ${itemsNeedingAttention.length}`);
    console.log('🔍 === END ATTENTION EVALUATION ===');

    return itemsNeedingAttention;
  };

  // Helper function to evaluate a single criterion
  const evaluateCriterion = (criterion: AttentionCriterion, fieldValue: any): boolean => {
    switch (criterion.condition) {
      case 'equals':
        return fieldValue === criterion.value;
      
      case 'not_equals':
        return fieldValue !== criterion.value;
      
      case 'empty':
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      
      case 'not_empty':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      
      case 'contains':
        if (typeof fieldValue === 'string' && typeof criterion.value === 'string') {
          return fieldValue.toLowerCase().includes(criterion.value.toLowerCase());
        }
        return false;
      
      case 'not_contains':
        if (typeof fieldValue === 'string' && typeof criterion.value === 'string') {
          return !fieldValue.toLowerCase().includes(criterion.value.toLowerCase());
        }
        return true;
      
      case 'less_than':
        if (typeof fieldValue === 'number' && typeof criterion.value === 'number') {
          return fieldValue < criterion.value;
        }
        return false;
      
      case 'greater_than':
        if (typeof fieldValue === 'number' && typeof criterion.value === 'number') {
          return fieldValue > criterion.value;
        }
        return false;
      
      case 'is_true':
        return Boolean(fieldValue) === true;
      
      case 'is_false':
        return Boolean(fieldValue) === false;
      
      default:
        return false;
    }
  };

  // ✅ NUEVA FUNCIÓN: Obtener opciones de un campo específico
  const getFieldOptions = async (fieldName: string): Promise<string[]> => {
    if (isDemoMode) {
      // En modo demo, usar las opciones predefinidas
      const property = demoDatabase.properties[fieldName];
      if (property && property.options) {
        console.log('🔍 Demo mode - returning cached options for', fieldName, ':', property.options);
        return property.options;
      }
      console.log('🔍 Demo mode - no options found for', fieldName);
      return [];
    }

    // En modo real, usar el servicio de Notion
    try {
      const options = await notionService.getFieldOptions(fieldName);
      console.log('🔍 Real mode - got options for', fieldName, ':', options);
      return options;
    } catch (error) {
      console.error('Failed to get field options:', error);
      return [];
    }
  };

  const addScanHistory = (entry: Omit<ScanHistory, 'id'>) => {
    const newEntry: ScanHistory = {
      ...entry,
      id: Date.now().toString(),
    };
    setScanHistory(prev => [newEntry, ...prev].slice(0, 100)); // Keep last 100 entries
  };

  const value: NotionContextType = {
    config,
    database,
    items,
    scanConfigurations,
    displayConfigurations,
    activeDisplayConfig,
    attentionConfigurations,
    activeAttentionConfig,
    scanHistory,
    isConnected,
    isLoading,
    isDemoMode,
    connectToNotion,
    disconnectFromNotion,
    enableDemoMode,
    refreshDatabase,
    searchItem,
    updateItem,
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
    setActiveAttentionConfig,
    getItemsNeedingAttention,
    getFieldOptions, // ✅ NUEVA FUNCIÓN EXPORTADA
    addScanHistory,
  };

  return (
    <NotionContext.Provider value={value}>
      {children}
    </NotionContext.Provider>
  );
};