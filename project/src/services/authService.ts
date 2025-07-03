import { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';

class AuthService {
  private baseURL = '/api/auth';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for httpOnly tokens
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Error al iniciar sesión',
        };
      }

      return {
        success: true,
        user: data.user,
        message: data.message,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Error de conexión. Verifica tu internet.',
      };
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Error al crear la cuenta',
        };
      }

      return {
        success: true,
        user: data.user,
        message: data.message,
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: 'Error de conexión. Verifica tu internet.',
      };
    }
  }

  async logout(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      return {
        success: response.ok,
        message: data.message,
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Error al cerrar sesión',
      };
    }
  }

  async verifyToken(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/verify`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Token inválido',
        };
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return {
        success: false,
        error: 'Error de verificación',
      };
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Error al renovar sesión',
        };
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Error al renovar sesión',
      };
    }
  }
}

export const authService = new AuthService();