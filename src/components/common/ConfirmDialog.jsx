import { useTheme } from '../../contexts/ThemeContext';

const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700',
  onConfirm, 
  onCancel, 
  loading = false 
}) => {
  const { isDark } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${isDark ? "bg-gray-800 border-gray-700 shadow-2xl" : "bg-white shadow-2xl"} rounded-2xl max-w-md w-full border`}>
        {/* Header */}
        <div className={`p-6 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h3>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>{message}</p>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 rounded-b-2xl flex justify-end space-x-4 ${isDark ? "bg-gray-900/50" : "bg-gray-50"}`}>
          <button
            onClick={onCancel}
            disabled={loading}
            className={`px-4 py-2 border rounded-lg transition-colors disabled:opacity-50 ${
              isDark 
                ? "border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white" 
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${confirmButtonClass}`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;