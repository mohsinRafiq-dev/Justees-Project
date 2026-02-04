import { useState } from 'react';
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

const ProductTable = ({ 
  products, 
  onEdit, 
  onDelete, 
  onToggleVisibility, 
  onToggleFeatured 
}) => {
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
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedProducts.size === products.length && products.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </th>
            
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center space-x-1">
                <span>Product</span>
                {sortConfig.key === 'name' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </th>
            
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('totalStock')}
            >
              <div className="flex items-center space-x-1">
                <span>Stock</span>
                {sortConfig.key === 'totalStock' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </th>
            
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('views')}
            >
              <div className="flex items-center space-x-1">
                <span>Views</span>
                {sortConfig.key === 'views' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </th>
            
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        
        <tbody className="bg-white divide-y divide-gray-200">
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
                className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
              >
                {/* Checkbox */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleProductSelection(product.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                        <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
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
                      
                      <p className="text-sm text-gray-500 truncate">
                        {product.shortDescription || product.description?.substring(0, 60) + '...'}
                      </p>
                      
                      {/* Expand button */}
                      <button
                        onClick={() => toggleRowExpansion(product.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 mt-1"
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
                  <span className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                    {product.category}
                  </span>
                </td>
                
                {/* Price */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {formatPrice(product.price)}
                    </div>
                    {product.originalPrice && product.originalPrice !== product.price && (
                      <div className="text-gray-500 line-through text-xs">
                        {formatPrice(product.originalPrice)}
                      </div>
                    )}
                  </div>
                </td>
                
                {/* Stock */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
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
                      className={`p-2 rounded-full ${
                        product.isVisible 
                          ? 'text-green-600 hover:bg-green-100' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={product.isVisible ? 'Hide from store' : 'Show in store'}
                    >
                      {product.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    
                    {/* Toggle Featured */}
                    <button
                      onClick={() => onToggleFeatured(product)}
                      className={`p-2 rounded-full ${
                        product.isFeatured 
                          ? 'text-yellow-500 hover:bg-yellow-100' 
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={product.isFeatured ? 'Remove from featured' : 'Add to featured'}
                    >
                      <Star className={`w-4 h-4 ${product.isFeatured ? 'fill-current' : ''}`} />
                    </button>
                    
                    {/* Edit */}
                    <button
                      onClick={() => onEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                      title="Edit product"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    {/* Delete */}
                    <button
                      onClick={() => onDelete(product)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    {/* View Product */}
                    <a
                      href={`/products/${product.slug || product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
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
            className="bg-gray-50 border-t border-gray-200"
          >
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Product Details */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Product Details</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">SKU</dt>
                      <dd className="text-sm text-gray-900">{product.sku || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Brand</dt>
                      <dd className="text-sm text-gray-900">{product.brand || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="text-sm text-gray-900">
                        {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                {/* Variants */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Variants ({product.variants?.length || 0})</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {product.variants && product.variants.length > 0 ? (
                      product.variants.map((variant, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{variant.size} - {variant.color}</span>
                          <span className="text-gray-500 ml-2">Stock: {variant.stock || 0}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No variants</p>
                    )}
                  </div>
                </div>
                
                {/* Performance */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Views</dt>
                      <dd className="text-sm text-gray-900">{product.views || 0}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Sales</dt>
                      <dd className="text-sm text-gray-900">{product.sales || 0}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Rating</dt>
                      <dd className="text-sm text-gray-900">
                        {product.rating ? `${product.rating}/5 (${product.reviewCount || 0} reviews)` : 'No ratings'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full"
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
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No products found</p>
        </div>
      )}
    </div>
  );
};

export default ProductTable;