export interface NotionProperty {
  id: string;
  name: string;
  type: string;
  options?: string[]; // ✅ NUEVO: Opciones para campos select y multi_select
  /**
   * Opciones para campos de relación, usadas para mostrar nombres legibles de páginas relacionadas.
   */
  relationOptions?: Array<{ id: string; name: string }>;
}

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, NotionProperty>;
}

export interface InventoryItem {
  id: string;
  pageId: string;
  properties: Record<string, any>;
  lastEditedTime: string;
  createdTime: string;
}

export interface DisplayFieldConfig {
  fieldName: string;
  fieldType: string;
  displayName: string;
  enabled: boolean;
  order: number;
  showInSummary: boolean; // Para mostrar en el resumen principal
  showInAttention: boolean; // ✅ NUEVO: Para mostrar en "Requiere Atención"
  icon?: string; // Icono opcional para el campo
}

export interface ScanConfiguration {
  id: string;
  name: string;
  targetFields: {
    fieldName: string;
    fieldType: string;
    value: any;
    enabled: boolean;
    customDate?: string; // For custom date values
  }[];
  searchField: string;
  autoSave: boolean;
}

export interface DisplayConfiguration {
  id: string;
  name: string;
  displayFields: DisplayFieldConfig[];
  layout: 'grid' | 'list' | 'compact';
  showMetadata: boolean; // Mostrar fecha de creación, última edición, etc.
  attentionLayout: 'badges' | 'detailed' | 'minimal'; // ✅ NUEVO: Layout específico para "Requiere Atención"
  showAttentionIcons: boolean; // ✅ NUEVO: Mostrar iconos en "Requiere Atención"
}

// ✅ Sistema de Criterios de Atención
export interface AttentionCriterion {
  id: string;
  fieldName: string;
  fieldType: string;
  condition: 'equals' | 'not_equals' | 'empty' | 'not_empty' | 'contains' | 'not_contains' | 'less_than' | 'greater_than' | 'is_true' | 'is_false';
  value?: any;
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
  description: string; // Descripción legible del criterio
}

export interface AttentionConfiguration {
  id: string;
  name: string;
  criteria: AttentionCriterion[];
  operator: 'AND' | 'OR'; // Cómo combinar múltiples criterios
  enabled: boolean;
}

export interface ScanHistory {
  id: string;
  itemId: string;
  itemName: string;
  scanTime: Date;
  configurationUsed: string;
  fieldsModified: string[];
  user?: string;
}

export interface NotionConfig {
  token: string;
  databaseId: string;
  workspaceName?: string;
}