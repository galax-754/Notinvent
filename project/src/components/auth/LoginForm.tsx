import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ErrorMessage } from '../common/ErrorMessage';
import { SimpleResetForm } from './SimpleResetForm';
import { TempPasswordForm } from './TempPasswordForm';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types/auth';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showSimpleReset, setShowSimpleReset] = useState(false);
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<LoginCredentials>>({});

  const validateForm = (): boolean => {
    const errors: Partial<LoginCredentials> = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ingresa un email válido';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await login(formData);
    
    if (!success) {
      // Error is handled by the auth context
      setFormData(prev => ({ ...prev, password: '' }));
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear global error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleForgotPasswordSuccess = () => {
    // Mostrar mensaje de éxito o redirigir
    console.log('Email de recuperación enviado');
  };



  if (showSimpleReset) {
    return (
      <SimpleResetForm
        onBack={() => setShowSimpleReset(false)}
        onSuccess={handleForgotPasswordSuccess}
      />
    );
  }

  if (showTempPassword) {
    return (
      <TempPasswordForm
        onBack={() => setShowTempPassword(false)}
        onSuccess={handleForgotPasswordSuccess}
      />
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <LogIn className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Iniciar Sesión</h1>
        <p className="text-gray-600 dark:text-gray-400">Accede a tu cuenta para continuar</p>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage 
            message={error} 
            onDismiss={clearError}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          type="email"
          label="Correo Electrónico"
          placeholder="tu@email.com"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={formErrors.email}
          icon={<Mail className="w-5 h-5" />}
          disabled={isLoading}
          autoComplete="email"
          autoFocus
          className="dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
        />

        <Input
          type={showPassword ? 'text' : 'password'}
          label="Contraseña"
          placeholder="Tu contraseña"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={formErrors.password}
          icon={<Lock className="w-5 h-5" />}
          showPasswordToggle
          isPassword={!showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          disabled={isLoading}
          autoComplete="current-password"
          className="dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          loadingText="Iniciando sesión..."
          icon={<LogIn className="w-5 h-5" />}
        >
          Iniciar Sesión
        </Button>
      </form>

      <div className="mt-4 text-center space-y-2">

        <button
          onClick={() => setShowSimpleReset(true)}
          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium transition-colors duration-200 block"
          disabled={isLoading}
        >
          Restablecer contraseña (Directo)
        </button>
        <button
          onClick={() => setShowTempPassword(true)}
          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium transition-colors duration-200 block"
          disabled={isLoading}
        >
          Contraseña temporal por email
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          ¿No tienes una cuenta?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
            disabled={isLoading}
          >
            Crear cuenta
          </button>
        </p>
      </div>
    </div>
  );
};