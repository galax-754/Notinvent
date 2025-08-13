import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Colores adaptativos según el tema
  const colors = {
    background: isDark ? '#1f2937' : '#f3f4f6', // gray-800 / gray-100
    rings: isDark ? '#9ca3af' : '#6b7280', // gray-400 / gray-500
    letter: isDark ? '#ffffff' : '#111827', // white / gray-900
    ring1: isDark ? '#d1d5db' : '#9ca3af', // gray-300 / gray-400
    ring2: isDark ? '#9ca3af' : '#6b7280', // gray-400 / gray-500
    ring3: isDark ? '#6b7280' : '#4b5563', // gray-500 / gray-600
  };

  return (
    <div className={`${sizeClasses[size]} ${className} group cursor-pointer transition-transform duration-300 hover:scale-110`}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Anillo exterior más grueso */}
        <circle
          cx="24"
          cy="24"
          r="22"
          stroke={colors.ring1}
          strokeWidth="2"
          fill="none"
          className="transition-all duration-300 group-hover:opacity-100"
          opacity="0.8"
        />
        
        {/* Anillo medio */}
        <circle
          cx="24"
          cy="24"
          r="18"
          stroke={colors.ring2}
          strokeWidth="1.5"
          fill="none"
          className="transition-all duration-300 group-hover:opacity-80"
          opacity="0.6"
        />
        
        {/* Anillo interior */}
        <circle
          cx="24"
          cy="24"
          r="14"
          stroke={colors.ring3}
          strokeWidth="1"
          fill="none"
          className="transition-all duration-300 group-hover:opacity-60"
          opacity="0.4"
        />
        
        {/* Círculo central con fondo */}
        <circle
          cx="24"
          cy="24"
          r="8"
          fill={colors.background}
          stroke={colors.rings}
          strokeWidth="0.5"
        />
        
        {/* Letra "N" en el centro */}
        <text
          x="24"
          y="28"
          textAnchor="middle"
          fill={colors.letter}
          fontSize="12"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
          className="select-none"
        >
          N
        </text>
      </svg>
    </div>
  );
};
