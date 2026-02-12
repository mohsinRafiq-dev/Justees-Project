import { useTheme } from '../../contexts/ThemeContext';

const LoadingSpinner = ({ size = 'medium', color = 'blue' }) => {
  const { isDark } = useTheme();
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
    red: 'border-red-600',
    green: 'border-green-600'
  };

  return (
    <div className="flex items-center justify-center">
      <div 
        className={`
          ${sizeClasses[size]} 
          border-2 
          ${isDark ? "border-white/10" : "border-gray-200"}
          ${colorClasses[color]}
          border-t-transparent 
          rounded-full 
          animate-spin
        `}
      />
    </div>
  );
};

export default LoadingSpinner;