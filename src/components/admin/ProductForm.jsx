import { useState, useEffect } from 'react';
import { X, Upload, Trash2, Plus, Save, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  createProduct, 
  updateProduct 
} from '../../services/products.service';
import { 
  uploadMultipleProductImages,
  deleteProductImage 
} from '../../services/storage.service';
import { 
  validateProductForm, 
  validateVariants
} from '../../utils/validation';
import { CATEGORIES, SIZES, COLORS } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

const ProductForm = ({ product, onSave, onCancel, loading: externalLoading }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: CATEGORIES?.[0] || 'T-Shirts',
    price: '',
    originalPrice: '',
    badge: '',
    tags: [],
    status: 'active',
    isVisible: true,
    isFeatured: false,
    specifications: {
      material: '',
      careInstructions: '',
      fit: 'Regular'
    }
  });

  const [variants, setVariants] = useState([]);
  const [colorImages, setColorImages] = useState({}); // { colorName: [imageFiles] }
  const [existingImages, setExistingImages] = useState({}); // { colorName: [imageUrls] }
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [availableColors, setAvailableColors] = useState([]);
  const [newColorInput, setNewColorInput] = useState('');

  // Initialize form with existing product data
  useEffect(() => {
    if (product) {
      setFormData(prevFormData => ({
        ...prevFormData,
        ...product,
        price: product.price?.toString() || '',
        originalPrice: product.originalPrice?.toString() || '',
        tags: product.tags || [],
        specifications: {
          ...prevFormData.specifications,
          ...product.specifications
        }
      }));
      
      setVariants(product.variants || []);
      
      // Set available colors from existing variants
      if (product.variants && product.variants.length > 0) {
        const colors = [...new Set(product.variants.map(v => v.color))];
        setAvailableColors(colors);
      }
      
      // Set existing images grouped by color
      if (product.images) {
        const imagesByColor = {};
        product.images.forEach(img => {
          const color = img.color || 'default';
          if (!imagesByColor[color]) {
            imagesByColor[color] = [];
          }
          imagesByColor[color].push(img.url);
        });
        setExistingImages(imagesByColor);
      }
    }
  }, [product]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleStockChange = (size, color, stock) => {
    const stockValue = parseInt(stock) || 0;
    
    setVariants(prev => {
      const existingIndex = prev.findIndex(v => v.size === size && v.color === color);
      
      if (stockValue === 0) {
        // Remove variant if stock is 0
        return existingIndex >= 0 ? prev.filter((_, i) => i !== existingIndex) : prev;
      } else {
        // Update existing or add new variant
        if (existingIndex >= 0) {
          return prev.map((variant, i) => 
            i === existingIndex ? { ...variant, stock: stockValue } : variant
          );
        } else {
          return [...prev, {
            id: `${size}-${color}`,
            size,
            color,
            stock: stockValue
          }];
        }
      }
    });
  };

  const handleBulkStock = (stockValue) => {
    if (stockValue === 0) {
      setVariants([]);
    } else {
      const newVariants = [];
      SIZES.forEach(size => {
        availableColors.forEach(color => {
          newVariants.push({
            id: `${size}-${color}`,
            size,
            color,
            stock: stockValue
          });
        });
      });
      setVariants(newVariants);
    }
  };

  const handleAddColor = () => {
    if (newColorInput.trim() && !availableColors.includes(newColorInput.trim())) {
      setAvailableColors(prev => [...prev, newColorInput.trim()]);
      setNewColorInput('');
    }
  };

  const handleRemoveColor = (colorToRemove) => {
    setAvailableColors(prev => prev.filter(color => color !== colorToRemove));
    // Remove variants with this color
    setVariants(prev => prev.filter(variant => variant.color !== colorToRemove));
    
    // Remove images for this color
    setColorImages(prev => {
      const updated = { ...prev };
      delete updated[colorToRemove];
      return updated;
    });
    
    // Mark existing images for removal
    if (existingImages[colorToRemove]) {
      setImagesToRemove(prev => [...prev, ...existingImages[colorToRemove]]);
      setExistingImages(prev => {
        const updated = { ...prev };
        delete updated[colorToRemove];
        return updated;
      });
    }
  };

  // Image handling functions
  const handleImageUpload = (color, files) => {
    const fileArray = Array.from(files);
    
    // Validate file types and sizes
    const validFiles = fileArray.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (!isValidSize) {
        toast.error(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setColorImages(prev => ({
        ...prev,
        [color]: [...(prev[color] || []), ...validFiles]
      }));
    }
  };

  const handleRemoveNewImage = (color, imageIndex) => {
    setColorImages(prev => ({
      ...prev,
      [color]: prev[color]?.filter((_, index) => index !== imageIndex) || []
    }));
  };

  const handleRemoveExistingImage = (color, imageUrl) => {
    setImagesToRemove(prev => [...prev, imageUrl]);
    setExistingImages(prev => ({
      ...prev,
      [color]: prev[color]?.filter(url => url !== imageUrl) || []
    }));
  };

  const validateForm = () => {
    const formValidation = validateProductForm(formData);
    const variantValidation = validateVariants(variants);
    
    console.log('Form validation:', formValidation);
    console.log('Variant validation:', variantValidation);
    console.log('Current variants:', variants);
    console.log('Form data:', formData);
    
    const allErrors = {
      ...(formValidation.errors || formValidation),
      ...(variantValidation.errors || variantValidation)
    };

    console.log('All errors:', allErrors);
    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('User:', user);
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    if (!user?.uid) {
      toast.error('Authentication required. Please login again.');
      return;
    }

    setLoading(true);

    try {
      console.log('Preparing product data...');
      // Prepare product data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        variants: variants.map(variant => ({
          ...variant,
          stock: parseInt(variant.stock) || 0,
          weight: variant.weight ? parseFloat(variant.weight) : null
        }))
      };

      // Calculate total stock
      productData.totalStock = variants.reduce((sum, variant) => sum + (parseInt(variant.stock) || 0), 0);

      // Prepare images data for upload
      const allNewImageFiles = [];
      const imageColorMapping = [];
      
      Object.entries(colorImages).forEach(([color, files]) => {
        files.forEach(file => {
          allNewImageFiles.push(file);
          imageColorMapping.push(color);
        });
      });

      console.log('Image files prepared:', allNewImageFiles.length);
      console.log('Image color mapping:', imageColorMapping);

      let result;
      
      if (product) {
        console.log('Updating existing product:', product.id);
        // Update existing product
        result = await updateProduct(
          product.id,
          productData,
          allNewImageFiles,
          imagesToRemove,
          user?.uid,
          imageColorMapping
        );
      } else {
        console.log('Creating new product');
        // Create new product
        result = await createProduct(
          productData,
          allNewImageFiles,
          user?.uid,
          imageColorMapping
        );
      }

      console.log('Service result:', result);

      if (result.success) {
        toast.success(product ? 'Product updated successfully!' : 'Product created successfully!');
        
        // Clear form state if creating a new product
        if (!product) {
          setColorImages({});
          setExistingImages({});
          setImagesToRemove([]);
          setVariants([]);
          setAvailableColors([]);
        }
        
        onSave(result.product || { ...product, ...productData });
      } else {
        toast.error(result.error || 'Failed to save product');
        if (result.errors) {
          result.errors.forEach(error => toast.error(error));
        }
      }

    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error saving product');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: '📝' },
    { id: 'variants', name: 'Variants & Stock', icon: '📦' },
    { id: 'images', name: 'Images', icon: '🖼️' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter product name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                    )}
                  </div>

                  {/* Original Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Price (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.originalPrice}
                      onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Badge */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Badge
                    </label>
                    <select
                      value={formData.badge}
                      onChange={(e) => handleInputChange('badge', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">No Badge</option>
                      <option value="New">New</option>
                      <option value="Sale">Sale</option>
                      <option value="Hot">Hot</option>
                      <option value="Limited">Limited</option>
                      <option value="Bestseller">Bestseller</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter product description"
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description for product listing"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-blue-400 hover:text-blue-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add a tag"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-gray-600 text-white px-4 py-2 rounded-r-lg hover:bg-gray-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Status Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isVisible"
                      checked={formData.isVisible}
                      onChange={(e) => handleInputChange('isVisible', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isVisible" className="ml-2 block text-sm text-gray-700">
                      Visible in store
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-700">
                      Featured product
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="trackInventory"
                      checked={formData.trackInventory}
                      onChange={(e) => handleInputChange('trackInventory', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="trackInventory" className="ml-2 block text-sm text-gray-700">
                      Track inventory
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Add other tab contents here... */}
            
            {/* Variants Tab */}
            {activeTab === 'variants' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Stock Management</h3>
                <p className="text-gray-600">Add colors and set stock levels for different sizes</p>
                
                {/* Color Management */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Available Colors</h4>
                  
                  {/* Add New Color */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Enter color name (e.g., Black, White, Navy)"
                      value={newColorInput}
                      onChange={(e) => setNewColorInput(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-3 py-2"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddColor()}
                    />
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Add Color
                    </button>
                  </div>

                  {/* Color List */}
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(color => (
                      <span key={color} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {color}
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(color)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {availableColors.length === 0 && (
                      <p className="text-gray-500 text-sm">No colors added yet. Add colors to start managing stock.</p>
                    )}
                  </div>
                </div>

                {/* Size & Color Stock Grid */}
                {availableColors.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="overflow-x-auto">
                      <div className="grid gap-2 text-sm" style={{gridTemplateColumns: `1fr repeat(${availableColors.length}, minmax(80px, 1fr))`}}>
                        {/* Header */}
                        <div className="font-medium text-gray-700">Size/Color</div>
                        {availableColors.map(color => (
                          <div key={color} className="font-medium text-gray-700 text-center">{color}</div>
                        ))}
                        
                        {/* Stock Grid */}
                        {SIZES.map(size => (
                          <div key={size} className="contents">
                            <div className="font-medium text-gray-700">{size}</div>
                            {availableColors.map(color => {
                              const existingVariant = variants.find(v => v.size === size && v.color === color);
                              return (
                                <input
                                  key={color}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={existingVariant?.stock || ''}
                                  onChange={(e) => handleStockChange(size, color, e.target.value)}
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-center text-sm"
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Stock Actions */}
                {availableColors.length > 0 && (
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => handleBulkStock(10)}
                      className="bg-green-100 text-green-800 px-4 py-2 rounded-lg hover:bg-green-200"
                    >
                      Set All to 10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkStock(0)}
                      className="bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200"
                    >
                      Clear All Stock
                    </button>
                  </div>
                )}

                {/* Variants Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Stock Summary</h4>
                  <div className="text-sm text-gray-600">
                    Total Variants: {variants.length} | 
                    Total Stock: {variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0)} units
                  </div>
                </div>
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
                <p className="text-gray-600">Upload images for each color variant. You can add multiple images per color.</p>
                
                {availableColors.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-gray-500 mb-2">📦</div>
                    <p className="text-gray-600">Please add colors in the "Variants & Stock" tab first</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('variants')}
                      className="mt-2 text-blue-600 hover:text-blue-700 underline"
                    >
                      Go to Variants & Stock
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {availableColors.map(color => (
                      <div key={color} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: color.toLowerCase() }}
                          />
                          {color} Images
                        </h4>
                        
                        {/* Image Upload */}
                        <div className="mb-4">
                          <input
                            type="file"
                            id={`images-${color}`}
                            multiple
                            accept="image/*"
                            onChange={(e) => handleImageUpload(color, e.target.files)}
                            className="hidden"
                          />
                          <label
                            htmlFor={`images-${color}`}
                            className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors"
                          >
                            <div className="text-center">
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                Click to upload images for {color}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG, WEBP up to 5MB each
                              </p>
                            </div>
                          </label>
                        </div>
                        
                        {/* Existing Images */}
                        {existingImages[color] && existingImages[color].length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Current Images</h5>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                              {existingImages[color].map((imageUrl, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={imageUrl}
                                    alt={`${color} ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg border border-gray-300"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExistingImage(color, imageUrl)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* New Images Preview */}
                        {colorImages[color] && colorImages[color].length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">New Images</h5>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                              {colorImages[color].map((file, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`${color} new ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg border border-gray-300"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveNewImage(color, index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || externalLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
              >
                {loading || externalLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{product ? 'Update Product' : 'Create Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;