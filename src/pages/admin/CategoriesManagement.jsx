import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { isAdminUser } from '../../utils/validation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  getCategories,
  createCategory,
  deleteCategory,
} from '../../services/products.service';

const CategoriesManagement = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
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

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await createCategory(newCategory.trim());
      if (res.success) {
        toast.success('Category added');
        setNewCategory('');
        loadCategories();
      } else {
        toast.error(res.error || 'Failed to add category');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding category');
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
          <input
            className="border rounded px-3 py-2"
            placeholder="New category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        {loading ? (
          <LoadingSpinner />
        ) : categories.length === 0 ? (
          <p className="text-gray-600">No categories found.</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between border-b py-2">
                <span className="text-gray-900">{c.name}</span>
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
        open={confirm.open}
        title="Delete Category"
        message="Are you sure you want to delete this category? This will not delete existing products but they may become uncategorized."
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </div>
  );
};

export default CategoriesManagement;
