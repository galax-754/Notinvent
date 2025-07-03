import React, { useState } from 'react';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ErrorMessage } from '../common/ErrorMessage';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterCredentials } from '../../types/auth';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<RegisterCredentials>>({});

  const validateForm = (): boolean => {
    const errors: Partial<RegisterCredentials> = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ingresa un email válido';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'La contraseña debe contener al menos una mayúscula, una minúscula y un número';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await register(formData);
    
    if (!success) {
      // Error is handled by the auth context
      setFormData(prev => ({ 
        ...prev, 
        password: '', 
        confirmPassword: '' 
      }));
    }
  };

  const handleInputChange = (field: keyof RegisterCredentials, value: string) => {
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

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Crear Cuenta</h1>
        <p className="text-gray-600">Únete para gestionar tu inventario</p>
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
          type="text"
          label="Nombre Completo"
          placeholder="Tu nombre completo"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={formErrors.name}
          icon={<User className="w-5 h-5" />}
          disabled={isLoading}
          autoComplete="name"
          autoFocus
        />

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
        />

        <Input
          type={showPassword ? 'text' : 'password'}
          label="Contraseña"
          placeholder="Mínimo 8 caracteres"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={formErrors.password}
          icon={<Lock className="w-5 h-5" />}
          showPasswordToggle
          isPassword={!showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          disabled={isLoading}
          autoComplete="new-password"
        />

        <Input
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirmar Contraseña"
          placeholder="Repite tu contraseña"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          error={formErrors.confirmPassword}
          icon={<Lock className="w-5 h-5" />}
          showPasswordToggle
          isPassword={!showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          disabled={isLoading}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          loadingText="Creando cuenta..."
          icon={<UserPlus className="w-5 h-5" />}
        >
          Crear Cuenta
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            disabled={isLoading}
          >
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  );
};