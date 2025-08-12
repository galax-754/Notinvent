import { ScanConfiguration, DisplayConfiguration, ScanHistory } from '../types/notion';

interface UserConfig {
  scanConfigurations: ScanConfiguration[];
  displayConfigurations: DisplayConfiguration[];
  activeDisplayConfig: string | null;
  scanHistory: ScanHistory[];
  demoMode: boolean;
}

class UserConfigService {
  private baseUrl = '/api/user/config';

  async getUserConfig(): Promise<UserConfig | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Usuario no autenticado, retornar null
          return null;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.appConfig || null;
    } catch (error) {
      console.error('Error obteniendo configuración del usuario:', error);
      return null;
    }
  }

  async saveUserConfig(config: UserConfig): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error guardando configuración del usuario:', error);
      return false;
    }
  }

  async deleteUserConfig(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error eliminando configuración del usuario:', error);
      return false;
    }
  }
}

export const userConfigService = new UserConfigService();
