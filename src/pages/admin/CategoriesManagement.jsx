import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isAdminUser } from '../../utils/validation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  getCategories,
  createCategory,
  deleteCategory,
} from '../../services/products.service';
import { uploadCategoryImage } from '../../services/storage.service';

const CategoriesManagement = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  useEffect(() => {
    if (!isAdminUser(user)) return;
    loadCategories();
  }, [user]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      if (res.success) setCategories(res.categories);
      else toast.error(res.error || 'Failed to load categories');
    } catch (err) {
      console.error(err);
      toast.error('Error loading categories');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleAdd = async () => {
    if (!newCategory.trim()) return;

    // Check if image is selected but not uploaded yet
    let imageUrl = '';

    try {
      if (selectedImage) {
        setLoading(true);
        const uploadRes = await uploadCategoryImage(selectedImage);
        if (uploadRes.success) {
          imageUrl = uploadRes.url;
        } else {
          toast.error('Failed to upload image: ' + uploadRes.error);
          setLoading(false);
          return;
        }
      }

      const res = await createCategory(newCategory.trim(), imageUrl);
      if (res.success) {
        toast.success('Category added');
        setNewCategory('');
        clearImage();
        setIsAddModalOpen(false);
        loadCategories();
        window.dispatchEvent(new Event('productAttributes:changed'));
      } else {
        toast.error(res.error || 'Failed to add category');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirm({ open: true, id });
  };

  const confirmDelete = async () => {
    const id = confirm.id;
    setConfirm({ open: false, id: null });
    try {
      const res = await deleteCategory(id);
      if (res.success) {
        toast.success('Category deleted');
        loadCategories();
      } else {
        toast.error(res.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting category');
    }
  };

  if (!isAdminUser(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
          <p className="text-gray-600">Create and manage product categories</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Category</h3>

            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image
                </label>
                <div className="flex items-center justify-center w-full">
                  {imagePreview ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="text-sm text-gray-500 font-semibold">Click to upload image</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG (MAX. 2MB)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  )}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. T-Shirts"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={loading || !newCategory.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Category</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        {loading ? (
          <LoadingSpinner />
        ) : categories.length === 0 ? (
          <p className="text-gray-600">No categories found.</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between border-b py-2">
                <div className="flex items-center gap-3">
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="w-10 h-10 rounded object-cover border" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Img</div>
                  )}
                  <span className="text-gray-900">{c.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-red-600 hover:text-red-700 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirm.open}
        title="Delete Category"
        message="Are you sure you want to delete this category? This will not delete existing products but they may become uncategorized."
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </div>
  );
};

export default CategoriesManagement;
