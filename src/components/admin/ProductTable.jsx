import { useState } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line
import {
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Package,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatPrice } from '../../utils/validation';
import { useTheme } from '../../contexts/ThemeContext';

const ProductTable = ({
  products,
  onEdit,
  onDelete,
  onToggleVisibility,
  onToggleFeatured
}) => {
  const { isDark } = useTheme();
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const toggleRowExpansion = (productId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedRows(newExpanded);
  };

  const toggleProductSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getStockStatus = (product) => {
    const totalStock = product.totalStock || 0;
    const minStock = product.minStockLevel || 5;

    if (totalStock === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    } else if (totalStock <= minStock) {
      return { status: 'low-stock', label: 'Low Stock', color: 'text-orange-600 bg-orange-100' };
    } else {
      return { status: 'in-stock', label: 'In Stock', color: 'text-green-600 bg-green-100' };
    }
  };

  const getStatusBadge = (product) => {
    if (!product.isVisible) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Hidden</span>;
    }
    if (product.status === 'inactive') {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">Inactive</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">Active</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className={`${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedProducts.size === products.length && products.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
              />
            </th>

            <th
              className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center space-x-1">
                <span>Product</span>
                {sortConfig.key === 'name' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </th>

            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Category
            </th>

            <th
              className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => handleSort('price')}
            >
              <div className="flex items-center space-x-1">
                <span>Price</span>
                {sortConfig.key === 'price' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </th>

            <th
              className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => handleSort('totalStock')}
            >
              <div className="flex items-center space-x-1">
                <span>Stock</span>
                {sortConfig.key === 'totalStock' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </th>

            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Status
            </th>

            <th
              className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => handleSort('views')}
            >
              <div className="flex items-center space-x-1">
                <span>Views</span>
                {sortConfig.key === 'views' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </th>

            <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Actions
            </th>
          </tr>
        </thead>

        <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {products.map((product, index) => {
            const stockStatus = getStockStatus(product);
            const isExpanded = expandedRows.has(product.id);
            const isSelected = selectedProducts.has(product.id);

            return (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`transition-colors ${isSelected ? (isDark ? 'bg-cyan-500/10' : 'bg-blue-50') : (isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50')}`}
              >
                {/* Checkbox */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleProductSelection(product.id)}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                  />
                </td>

                {/* Product Info */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0].url || product.images[0]}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}>
                          <Package className={`w-6 h-6 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {product.name}
                        </p>
                        {product.isFeatured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                        {product.badge && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">
                            {product.badge}
                          </span>
                        )}
                      </div>

                      <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {product.shortDescription || product.description?.substring(0, 60) + '...'}
                      </p>

                      {/* Expand button */}
                      <button
                        onClick={() => toggleRowExpansion(product.id)}
                        className="text-sm text-cyan-500 hover:text-cyan-600 mt-1"
                      >
                        {isExpanded ? (
                          <span className="flex items-center">
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Less details
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <ChevronDown className="w-4 h-4 mr-1" />
                            More details
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-sm rounded-full ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    {product.category}
                  </span>
                </td>

                {/* Price */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatPrice(product.price)}
                    </div>
                    {product.originalPrice && product.originalPrice !== product.price && (
                      <div className={`line-through text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {formatPrice(product.originalPrice)}
                      </div>
                    )}
                  </div>
                </td>

                {/* Stock */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {product.totalStock || 0}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(product)}
                </td>

                {/* Views */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center space-x-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <TrendingUp className="w-4 h-4" />
                    <span>{product.views || 0}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {/* Toggle Visibility */}
                    <button
                      onClick={() => onToggleVisibility(product)}
                      className={`p-2 rounded-lg transition-colors ${product.isVisible
                          ? 'text-green-600 hover:bg-green-500/10'
                          : (isDark ? 'text-gray-600 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100')
                        }`}
                      title={product.isVisible ? 'Hide from store' : 'Show in store'}
                    >
                      {product.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Toggle Featured */}
                    <button
                      onClick={() => onToggleFeatured(product)}
                      className={`p-2 rounded-lg transition-colors ${product.isFeatured
                          ? 'text-yellow-500 hover:bg-yellow-500/10'
                          : (isDark ? 'text-gray-600 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100')
                        }`}
                      title={product.isFeatured ? 'Remove from featured' : 'Add to featured'}
                    >
                      <Star className={`w-4 h-4 ${product.isFeatured ? 'fill-current' : ''}`} />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 text-cyan-600 hover:bg-cyan-500/10 rounded-lg transition-colors"
                      title="Edit product"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDelete(product)}
                      className="p-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* View Product */}
                    <a
                      href={`/products/${product.slug || product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}
                      title="View in store"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>

      {/* Expanded Row Details */}
      {products.map((product) => {
        const isExpanded = expandedRows.has(product.id);
        if (!isExpanded) return null;

        return (
          <motion.div
            key={`expanded-${product.id}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`border-t ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
          >
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Details */}
                <div>
                  <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Product Details</h4>
                  <dl className="space-y-2">

                    <div>
                      <dt className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Created</dt>
                      <dd className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Variants */}
                <div>
                  <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Variants ({product.variants?.length || 0})</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {product.variants && product.variants.length > 0 ? (
                      product.variants.map((variant, index) => (
                        <div key={index} className="text-sm">
                          <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{variant.size} - {variant.color}</span>
                          <span className={`ml-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Stock: {variant.stock || 0}</span>
                        </div>
                      ))
                    ) : (
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>No variants</p>
                    )}
                  </div>
                </div>


              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {products.length === 0 && (
        <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          <Package className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p>No products found</p>
        </div>
      )}
    </div>
  );
};

export default ProductTable;