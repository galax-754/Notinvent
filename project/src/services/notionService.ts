import { NotionConfig, NotionDatabase, InventoryItem } from '../types/notion';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

class NotionService {
  private config: NotionConfig | null = null;
  private baseURL = '/api/notion';
  private databaseSchema: NotionDatabase | null = null;

  async connect(config: NotionConfig): Promise<{ success: boolean; error?: string }> {
    try {
      this.config = config;
      
      // Test connection by trying to fetch database info
      const response = await fetch(`${this.baseURL}/database?databaseId=${config.databaseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Notion API Error:', response.status, response.statusText);
        
        if (response.status === 401) {
          return { success: false, error: 'INVALID_TOKEN' };
        } else if (response.status === 404) {
          return { success: false, error: 'DATABASE_NOT_FOUND' };
        } else if (response.status === 403) {
          return { success: false, error: 'ACCESS_DENIED' };
        } else {
          return { success: false, error: 'API_ERROR' };
        }
      }

      const data = await response.json();
      console.log('Database connection successful:', data.title);
      return { success: true };
    } catch (error) {
      console.error('Connection failed:', error);
      
      if (error instanceof TypeError && error.message && error.message.includes('Failed to fetch')) {
        return { success: false, error: 'NETWORK_ERROR' };
      } else {
        return { success: false, error: 'UNKNOWN_ERROR' };
      }
    }
  }

  disconnect() {
    this.config = null;
    this.databaseSchema = null;
  }

  async getDatabaseInfo(databaseId: string): Promise<NotionDatabase | null> {
    if (!this.config) return null;

    try {
      const response = await fetch(`${this.baseURL}/database?databaseId=${databaseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert Notion properties to our format
      const properties: Record<string, any> = {};
      
      // ...existing code...
      // Cambiar forEach async por for...of await para relaciones
      const propertyEntries = Object.entries(data.properties);
      for (const [key, propRaw] of propertyEntries) {
        const prop = propRaw as any;
        properties[key] = {
          id: prop.id,
          name: key,
          type: prop.type,

          options: this.extractSelectOptions(prop)
        };
        // Copiar sub-objetos originales para compatibilidad con el frontend
        if (prop.type === 'select' && prop.select) {
          properties[key].select = { ...prop.select };
        }
        if (prop.type === 'multi_select' && prop.multi_select) {
          properties[key].multi_select = { ...prop.multi_select };
        }
        if (prop.type === 'status' && prop.status) {
          properties[key].status = { ...prop.status };
        }
        // Agregar metadata de relación si aplica
        if (prop.type === 'relation' && prop.relation) {
          properties[key].relation = {
            database_id: prop.relation.database_id
          };
          // Obtener páginas relacionadas y exponerlas como relationOptions (solo los primeros 100)
          try {
            const relatedDbId = prop.relation.database_id;
            const relatedPagesResp = await fetch(`${this.baseURL}/database?databaseId=${relatedDbId}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ page_size: 100 })
            });
            if (relatedPagesResp.ok) {
              const relatedPagesData = await relatedPagesResp.json();
              const results = relatedPagesData.results || relatedPagesData.pages || [];
              let titleProp = null;
              let fallbackProp = null;
              if (relatedPagesData.properties) {
                for (const [k, v] of Object.entries(relatedPagesData.properties)) {
                  const propValue = v as { type?: string };
                  if (propValue && propValue.type === 'title') {
                    titleProp = k;
                  }
                  // Fallback: primer campo de tipo rich_text o name
                  if (!fallbackProp && (propValue.type === 'rich_text' || k.toLowerCase().includes('name'))) {
                    fallbackProp = k;
                  }
                }
              }
              properties[key].relationOptions = results.map((page: any) => {
                let displayName = '';
                // 1. Buscar campo title
                if (titleProp && page.properties?.[titleProp]?.title?.length) {
                  displayName = page.properties[titleProp].title.map((t: any) => t.plain_text).join(' ').trim();
                }
                // 2. Si no hay title, buscar rich_text
                if (!displayName && fallbackProp && page.properties?.[fallbackProp]?.rich_text?.length) {
                  displayName = page.properties[fallbackProp].rich_text.map((t: any) => t.plain_text).join(' ').trim();
                }
                // 3. Si no hay, buscar cualquier propiedad tipo texto
                if (!displayName && page.properties) {
                  for (const v of Object.values(page.properties)) {
                    // Acceso seguro a title
                    if (v && typeof v === 'object' && 'title' in v && Array.isArray(v.title) && v.title.length > 0) {
                      displayName = v.title.map((t: any) => t.plain_text).join(' ').trim();
                      break;
                    }
                    // Acceso seguro a rich_text
                    if (v && typeof v === 'object' && 'rich_text' in v && Array.isArray(v.rich_text) && v.rich_text.length > 0) {
                      displayName = v.rich_text.map((t: any) => t.plain_text).join(' ').trim();
                      break;
                    }
                  }
                }
                // 4. Si sigue vacío, usar el ID
                if (!displayName) {
                  displayName = page.id;
                }
                return {
                  id: page.id,
                  name: displayName
                };
              });
              // ...existing code...
            } else {
              properties[key].relationOptions = [];
            }
          } catch (err) {
            properties[key].relationOptions = [];
          }
        }
      }

      const databaseInfo = {
        id: databaseId,
        title: data.title?.[0]?.plain_text || 'Database',
        properties
      };

      // Store schema for validation
      this.databaseSchema = databaseInfo;
      

      return databaseInfo;
    } catch (error) {
      console.error('Failed to get database info:', error);
      return null;
    }
  }

  // ✅ Mejorada: Extraer opciones de campos select, multi_select y status como objetos completos
  private extractSelectOptions(property: any): any[] {
    if (property.type === 'select' && property.select?.options) {
      return property.select.options; // array de objetos completos
    }

    if (property.type === 'multi_select' && property.multi_select?.options) {
      return property.multi_select.options;
    }
    if (property.type === 'status' && property.status?.options) {
      return property.status.options;
    }
    return [];
  }

  // ✅ NUEVA FUNCIÓN: Obtener opciones dinámicas de un campo específico
  async getFieldOptions(fieldName: string): Promise<string[]> {
    console.log('🔍 === GETTING FIELD OPTIONS ===');
    console.log('🔍 Field name:', fieldName);
    console.log('🔍 Database schema:', this.databaseSchema);

    if (!this.databaseSchema) {
      console.log('🔍 No database schema available');
      return [];
    }

    const property = this.databaseSchema.properties[fieldName];
    if (!property) {
      console.log('🔍 Property not found in schema');
      return [];
    }

    console.log('🔍 Property details:', property);

    // Si ya tenemos las opciones en el schema, usarlas
    if (property.options && property.options.length > 0) {
      console.log('🔍 Using cached options from schema:', property.options);
      return property.options;
    }

    // Si no tenemos opciones cached, intentar obtenerlas dinámicamente
    if (property.type === 'select' || property.type === 'multi_select') {
      console.log('🔍 Attempting to get dynamic options...');
      return await this.getDynamicFieldOptions(fieldName, property.type);
    }

    console.log('🔍 Field type does not support options:', property.type);
    return [];
  }

  // ✅ NUEVA FUNCIÓN: Obtener opciones dinámicamente analizando los datos existentes
  private async getDynamicFieldOptions(fieldName: string, fieldType: string): Promise<string[]> {
    if (!this.config) return [];

    try {
      console.log('🔍 Getting dynamic options for field:', fieldName);
      
      // Obtener una muestra de datos para extraer opciones únicas
      const response = await fetch(`${this.baseURL}/database?databaseId=${this.config.databaseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_size: 100 // Obtener una muestra representativa
        })
      });

      if (!response.ok) {
        console.error('Failed to fetch data for dynamic options');
        return [];
      }

      const data = await response.json();
      const uniqueValues = new Set<string>();

      // Extraer valores únicos del campo
      data.results.forEach((page: any) => {
        const property = page.properties[fieldName];
        if (property) {
          const value = this.extractPropertyValue(property);
          
          if (fieldType === 'multi_select' && typeof value === 'string') {
            // Para multi_select, dividir por comas
            value.split(',').forEach(v => {
              const trimmed = v.trim();
              if (trimmed) uniqueValues.add(trimmed);
            });
          } else if (value && typeof value === 'string') {
            uniqueValues.add(value);
          }
        }
      });

      const options = Array.from(uniqueValues).filter(v => v !== '').sort();
      console.log('🔍 Dynamic options found:', options);
      
      return options;
    } catch (error) {
      console.error('Failed to get dynamic field options:', error);
      return [];
    }
  }

  // ✅ OBTENER TODOS los elementos con paginación automática
  async queryDatabase(databaseId: string): Promise<InventoryItem[]> {
    if (!this.config) return [];

    try {
      console.log('🔍 === STARTING PAGINATED DATABASE QUERY ===');
      let allItems: InventoryItem[] = [];
      let hasMore = true;
      let nextCursor: string | null = null;
      let pageCount = 0;

      while (hasMore) {
        pageCount++;
        console.log(`🔍 Fetching page ${pageCount}...`);

        const requestBody: any = {
          page_size: 100 // Máximo permitido por Notion
        };

        // Si hay un cursor, agregarlo para la siguiente página
        if (nextCursor) {
          requestBody.start_cursor = nextCursor;
        }

        console.log(`🔍 Request body for page ${pageCount}:`, requestBody);

        const response = await fetch(`${this.baseURL}/database?databaseId=${databaseId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`🔍 Page ${pageCount} response:`, {
          results: data.results.length,
          has_more: data.has_more,
          next_cursor: data.next_cursor
        });

        // Convertir los resultados de esta página
        const pageItems = data.results.map((page: any) => this.convertNotionPageToItem(page));
        allItems = [...allItems, ...pageItems];

        // Verificar si hay más páginas
        hasMore = data.has_more;
        nextCursor = data.next_cursor;

        console.log(`🔍 Total items so far: ${allItems.length}`);
      }

      console.log(`🔍 === PAGINATION COMPLETE ===`);
      console.log(`🔍 Total pages fetched: ${pageCount}`);
      console.log(`🔍 Total items retrieved: ${allItems.length}`);
      console.log(`🔍 === END PAGINATED QUERY ===`);

      return allItems;
    } catch (error) {
      console.error('Failed to query database:', error);
      return [];
    }
  }

  // Validar si el query es compatible con el tipo de campo
  private validateQueryForFieldType(query: string, fieldType: string): { isValid: boolean; error?: string } {
    switch (fieldType) {
      case 'number':
      case 'auto_increment_id':
        const numValue = parseFloat(query);
        if (isNaN(numValue)) {
          return { 
            isValid: false, 
            error: `El campo requiere un número válido, pero recibiste: "${query}"` 
          };
        }
        return { isValid: true };
      
      case 'date':
        const dateMatch = query.match(/^\d{4}-\d{2}-\d{2}/);
        if (!dateMatch) {
          return { 
            isValid: false, 
            error: `El campo de fecha requiere formato YYYY-MM-DD, pero recibiste: "${query}"` 
          };
        }
        return { isValid: true };
      
      case 'checkbox':
        const validBooleans = ['true', 'false', '1', '0', 'yes', 'no', 'sí', 'no'];
        if (!validBooleans.includes(query.toLowerCase())) {
          return { 
            isValid: false, 
            error: `El campo checkbox requiere true/false, pero recibiste: "${query}"` 
          };
        }
        return { isValid: true };
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(query)) {
          return { 
            isValid: false, 
            error: `El campo email requiere un email válido, pero recibiste: "${query}"` 
          };
        }
        return { isValid: true };
      
      default:
        // Para title, rich_text, select, etc., cualquier string es válido
        return { isValid: true };
    }
  }

  async searchItem(databaseId: string, query: string, field: string, fieldType?: string): Promise<InventoryItem | null> {
    if (!this.config) return null;

    try {
      console.log('Searching for:', { query, field, fieldType });
      
      // Validar el query antes de hacer la búsqueda
      if (fieldType) {
        const validation = this.validateQueryForFieldType(query, fieldType);
        if (!validation.isValid) {
          console.warn('Query validation failed:', validation.error);
          throw new Error(validation.error);
        }
      }
      
      // First try exact match
      let filter = this.createSearchFilter(field, query, fieldType, true);
      console.log('Exact match filter:', JSON.stringify(filter, null, 2));
      
      let response = await fetch(`${this.baseURL}/database?databaseId=${databaseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter,
          page_size: 1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Exact search failed:', response.status, errorText);
        
        // Solo intentar búsqueda parcial para tipos de texto
        const textTypes = ['title', 'rich_text', 'email', 'phone_number', 'url'];
        if (fieldType && textTypes.includes(fieldType)) {
          console.log('Trying partial match for text field...');
          filter = this.createSearchFilter(field, query, fieldType, false);
          console.log('Partial match filter:', JSON.stringify(filter, null, 2));
          
          response = await fetch(`${this.baseURL}/database?databaseId=${databaseId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filter,
              page_size: 1
            })
          });

          if (!response.ok) {
            const partialErrorText = await response.text();
            console.error('Partial search also failed:', response.status, partialErrorText);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('Search results:', data.results.length);
      
      if (data.results.length > 0) {
        return this.convertNotionPageToItem(data.results[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Search failed:', error);
      throw error; // Re-lanzar el error para que el contexto pueda manejarlo
    }
  }

  private createSearchFilter(field: string, query: string, fieldType?: string, exactMatch: boolean = false) {
    console.log('Creating filter for:', { field, query, fieldType, exactMatch });
    
    switch (fieldType) {
      case 'title':
        return {
          property: field,
          title: exactMatch ? {
            equals: query
          } : {
            contains: query
          }
        };
      
      case 'rich_text':
        return {
          property: field,
          rich_text: exactMatch ? {
            equals: query
          } : {
            contains: query
          }
        };
      
      case 'number':
      case 'auto_increment_id':
        const numValue = Number(query);
        return {
          property: field,
          number: {
            equals: numValue
          }
        };
      
      case 'select':
        return {
          property: field,
          select: {
            equals: query
          }
        };
      
      case 'multi_select':
        return {
          property: field,
          multi_select: {
            contains: query
          }
        };
      
      case 'checkbox':
        const boolValue = ['true', '1', 'yes', 'sí'].includes(query.toLowerCase());
        return {
          property: field,
          checkbox: {
            equals: boolValue
          }
        };
      
      case 'date':
        const dateMatch = query.match(/^\d{4}-\d{2}-\d{2}/);
        return {
          property: field,
          date: {
            equals: dateMatch![0] // Ya validamos que existe
          }
        };
      
      case 'email':
        return {
          property: field,
          email: exactMatch ? {
            equals: query
          } : {
            contains: query
          }
        };
      
      case 'phone_number':
        return {
          property: field,
          phone_number: exactMatch ? {
            equals: query
          } : {
            contains: query
          }
        };
      
      case 'url':
        return {
          property: field,
          url: exactMatch ? {
            equals: query
          } : {
            contains: query
          }
        };
      
      default:
        // Throw an error instead of defaulting to title filter
        throw new Error(`Unsupported field type: ${fieldType}. Cannot create search filter.`);
    }
  }

  // Validar propiedades antes de enviar a Notion
  private validatePropertiesForUpdate(properties: Record<string, any>): { valid: Record<string, any>; invalid: string[] } {
    const valid: Record<string, any> = {};
    const invalid: string[] = [];

    if (!this.databaseSchema) {
      console.warn('⚠️ No database schema available for validation');
      return { valid: properties, invalid: [] };
    }

    console.log('🔍 Available database properties:', Object.keys(this.databaseSchema.properties));

    Object.entries(properties).forEach(([key, value]) => {
      const schemaProperty = this.databaseSchema!.properties[key];
      
      if (!schemaProperty) {
        console.warn(`⚠️ Property "${key}" not found in database schema`);
        invalid.push(`Property "${key}" does not exist in database`);
        return;
      }



      // Check if the property is read-only
      const readOnlyTypes = ['created_time', 'created_by', 'last_edited_time', 'last_edited_by', 'formula', 'rollup', 'auto_increment_id'];
      if (readOnlyTypes.includes(schemaProperty.type)) {
        console.warn(`⚠️ Property "${key}" is read-only (${schemaProperty.type})`);
        invalid.push(`Property "${key}" is read-only`);
        return;
      }

      // Validate property type compatibility
      const propertyType = schemaProperty.type;
      console.log(`🔍 Validating "${key}" (${propertyType}):`, value);

      valid[key] = value;
    });

    return { valid, invalid };
  }

  async updatePage(pageId: string, properties: Record<string, any>): Promise<boolean> {
    if (!this.config) return false;

    try {
      // Validate properties first
      const { valid: validProperties, invalid: invalidProperties } = this.validatePropertiesForUpdate(properties);
      
      if (invalidProperties.length > 0) {
        console.error('🔴 Invalid properties found:', invalidProperties);
        throw new Error(`Invalid properties: ${invalidProperties.join(', ')}`);
      }

      if (Object.keys(validProperties).length === 0) {
        console.warn('⚠️ No valid properties to update');
        return false;
      }

      // Convert our properties to Notion format
      const notionProperties = this.convertToNotionProperties(validProperties);
      
      // 🔍 DEBUGGING: Log what we're sending
      console.log('🔍 UPDATE DEBUG - Original properties:', properties);
      console.log('🔍 UPDATE DEBUG - Valid properties:', validProperties);
      console.log('🔍 UPDATE DEBUG - Converted to Notion format:', notionProperties);
      console.log('🔍 UPDATE DEBUG - Page ID:', pageId);

      const requestBody = {
        properties: notionProperties
      };

      console.log('🔍 UPDATE DEBUG - Full request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.baseURL}/update-page`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: pageId,
          properties: notionProperties
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔴 UPDATE FAILED - Status:', response.status);
        console.error('🔴 UPDATE FAILED - Error response:', errorText);
        
        // Try to parse the error response
        try {
          const errorData = JSON.parse(errorText);
          console.error('🔴 UPDATE FAILED - Parsed error:', errorData);
          
          if (errorData.message) {
            throw new Error(`Notion API Error: ${errorData.message}`);
          }
        } catch (parseError) {
          console.error('🔴 Could not parse error response');
        }
        
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('✅ UPDATE SUCCESS - Response:', responseData);
      return true;
    } catch (error) {
      console.error('🔴 UPDATE FAILED - Exception:', error);
      return false;
    }
  }

  private convertNotionPageToItem(page: any): InventoryItem {
    const properties: Record<string, any> = {};
    
    // Convert each property based on its type
    Object.entries(page.properties).forEach(([key, prop]: [string, any]) => {
      properties[key] = this.extractPropertyValue(prop);
    });

    return {
      id: page.id,
      pageId: page.id,
      properties,
      lastEditedTime: page.last_edited_time,
      createdTime: page.created_time
    };
  }

  private extractPropertyValue(property: any): any {
    switch (property.type) {
      case 'title':
        return property.title?.[0]?.plain_text || '';
      
      case 'rich_text':
        return property.rich_text?.[0]?.plain_text || '';
      
      case 'number':
      case 'auto_increment_id':
        return property.number || property.auto_increment_id || 0;
      
      case 'select':
        return property.select?.name || '';
      
      case 'multi_select':
        return property.multi_select?.map((item: any) => item.name).join(', ') || '';
      
      case 'date':
        return property.date?.start || '';
      
      case 'checkbox':
        return property.checkbox || false;
      
      case 'url':
        return property.url || '';
      
      case 'email':
        return property.email || '';
      
      case 'phone_number':
        return property.phone_number || '';
      
      case 'formula':
        return this.extractPropertyValue(property.formula) || '';
      
      case 'relation':
        return property.relation?.map((rel: any) => rel.id) || [];
      
      case 'rollup':
        return property.rollup?.array?.map((item: any) => this.extractPropertyValue(item)) || [];
      
      case 'people':
        return property.people?.map((person: any) => person.name || person.id) || [];
      
      case 'files':
        return property.files?.map((file: any) => file.name || file.file?.url || file.external?.url) || [];
      
      case 'created_time':
        return property.created_time || '';
      
      case 'created_by':
        return property.created_by?.name || property.created_by?.id || '';
      
      case 'last_edited_time':
        return property.last_edited_time || '';
      
      case 'last_edited_by':
        return property.last_edited_by?.name || property.last_edited_by?.id || '';
      
      default:
        // ✅ SOLUCIÓN: Normalizar objetos a strings aquí
        const value = property[property.type];
        if (typeof value === 'object' && value !== null) {
          // Si es un objeto con estructura conocida como { prefijo, número }
          if (value.prefix && typeof value.number === 'number') {
            return `${value.prefix}-${value.number}`;
          }
          // Para otros objetos, usar JSON.stringify como fallback
          return JSON.stringify(value);
        }
        return value || '';
    }
  }

  private convertToNotionProperties(properties: Record<string, any>): Record<string, any> {
    const notionProperties: Record<string, any> = {};
    
    Object.entries(properties).forEach(([key, value]) => {
      console.log(`🔍 Converting property "${key}":`, value, typeof value);
      
      // Get the actual property type from schema if available
      const schemaProperty = this.databaseSchema?.properties[key];
      const propertyType = schemaProperty?.type;
      
      console.log(`🔍 Schema type for "${key}":`, propertyType);

      // Use schema type for more accurate conversion
      if (propertyType) {
        switch (propertyType) {
          case 'relation':
            // ...existing code...
            const relValues = Array.isArray(value) ? value : [value];
            notionProperties[key] = {
              relation: relValues
                .map((v: any) => {
                  if (typeof v === 'string') return { id: v };
                  if (v && typeof v === 'object' && v.id) return { id: v.id };
                  return null;
                })
                .filter(Boolean)
            };
            break;
          case 'checkbox':
            notionProperties[key] = {
              checkbox: Boolean(value)
            };
            break;

          case 'number':
            notionProperties[key] = {
              number: Number(value)
            };
            break;

          case 'date':
            const dateValue = value instanceof Date ? value.toISOString().split('T')[0] : value;
            notionProperties[key] = {
              date: {
                start: dateValue
              }
            };
            break;

          case 'select':
            notionProperties[key] = {
              select: {
                name: typeof value === 'object' && value !== null && value.name ? value.name : String(value)
              }
            };
            break;
          case 'status':
            notionProperties[key] = {
              status: {
                name: typeof value === 'object' && value !== null && value.name ? value.name : String(value)
              }
            };
            break;
          case 'multi_select':
            const multiSelectValues = Array.isArray(value) ? value : [value];
            notionProperties[key] = {
              multi_select: multiSelectValues.map(v => ({ name: typeof v === 'object' && v !== null && v.name ? v.name : String(v) }))
            };
            break;
          case 'files':
            // Permitir subir archivos externos por URL
            // value debe ser un array de objetos: [{ name, url }]
            const filesArray = Array.isArray(value) ? value : [value];
            notionProperties[key] = {
              files: filesArray
                .map((file: any) => {
                  if (file && typeof file === 'object' && file.url) {
                    return {
                      name: file.name || 'Archivo',
                      external: { url: file.url }
                    };
                  }
                  return null;
                })
                .filter(Boolean)
            };
            break;
          case 'rich_text':
            notionProperties[key] = {
              rich_text: [
                {
                  text: {
                    content: String(value)
                  }
                }
              ]
            };
            break;

          case 'title':
            notionProperties[key] = {
              title: [
                {
                  text: {
                    content: String(value)
                  }
                }
              ]
            };
            break;

          case 'email':
            notionProperties[key] = {
              email: String(value)
            };
            break;

          case 'phone_number':
            notionProperties[key] = {
              phone_number: String(value)
            };
            break;

          case 'url':
            notionProperties[key] = {
              url: String(value)
            };
            break;

          default:
            console.warn(`⚠️ Unsupported property type "${propertyType}" for field "${key}"`);
            break;
        }
      } else {
        // Fallback to old logic if no schema available
        if (typeof value === 'boolean') {
          notionProperties[key] = {
            checkbox: value
          };
        } else if (typeof value === 'number') {
          notionProperties[key] = {
            number: value
          };
        } else if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
          const dateValue = value instanceof Date ? value.toISOString().split('T')[0] : value;
          notionProperties[key] = {
            date: {
              start: dateValue
            }
          };
        } else if (typeof value === 'string') {
          // Try to determine if it's a select field based on common values
          const selectValues = ['Active', 'Inactive', 'Maintenance', 'Excellent', 'Good', 'Fair', 'Poor'];
          if (selectValues.includes(value)) {
            notionProperties[key] = {
              select: {
                name: value
              }
            };
          } else {
            // Default to rich_text for strings
            notionProperties[key] = {
              rich_text: [
                {
                  text: {
                    content: value
                  }
                }
              ]
            };
          }
        }
      }
      
      console.log(`✅ Converted "${key}":`, notionProperties[key]);
    });
    
    return notionProperties;
  }

  async exportData(items: InventoryItem[], format: 'csv' | 'xlsx'): Promise<void> {
    const data = items.map(item => {
      const exportItem: Record<string, any> = {};
      
      // Export all properties dynamically
      Object.entries(item.properties).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          exportItem[key] = value ? 'Yes' : 'No';
        } else if (Array.isArray(value)) {
          exportItem[key] = value.join(', ');
        } else {
          exportItem[key] = value || '';
        }
      });
      
      // Add metadata
      exportItem['Last Modified'] = item.lastEditedTime;
      exportItem['Created'] = item.createdTime;
      
      return exportItem;
    });

    if (format === 'csv') {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `inventory-export-${new Date().toISOString().split('T')[0]}.csv`);
    } else if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `inventory-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  }
}

export const notionService = new NotionService();