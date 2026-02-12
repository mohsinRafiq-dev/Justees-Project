import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import { isAdminUser } from '../../utils/validation';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  getSizes,
  createSize,
  deleteSize,
  updateSize,
  getColors,
  createColor,
  deleteColor,
  updateColor,
} from '../../services/products.service';
import { generateSlug } from '../../utils/validation';

const SizesManagement = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: null, type: null });
  const [editingItem, setEditingItem] = useState(null); // { id, type, name, slug, order, isActive, hex }


  useEffect(() => {
    if (!isAdminUser(user)) return;
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sizesRes, colorsRes] = await Promise.all([getSizes(), getColors()]);
      if (sizesRes.success) setSizes(sizesRes.sizes);
      if (colorsRes.success) setColors(colorsRes.colors);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load sizes/colors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSize = async () => {
    if (!newSize.trim()) return;
    try {
      const res = await createSize(newSize.trim());
      if (res.success) {
        toast.success('Size added');
        setNewSize('');
        loadAll();
        // notify other components (eg. ProductForm) to refresh available sizes/colors
        window.dispatchEvent(new Event('productAttributes:changed'));
      } else toast.error(res.error || 'Failed to add size');
    } catch (err) {
      console.error(err);
      toast.error('Error adding size');
    }
  };

  const handleAddColor = async () => {
    if (!newColor.trim()) return;
    try {
      const res = await createColor(newColor.trim());
      if (res.success) {
        toast.success('Color added');
        setNewColor('');
        loadAll();
        // notify other components to refresh
        window.dispatchEvent(new Event('productAttributes:changed'));
      } else toast.error(res.error || 'Failed to add color');
    } catch (err) {
      console.error(err);
      toast.error('Error adding color');
    }
  };

  const handleDelete = (id, type) => {
    setConfirm({ open: true, id, type });
  };

  const confirmDelete = async () => {
    const { id, type } = confirm;
    setConfirm({ open: false, id: null, type: null });
    try {
      let res;
      if (type === 'size') res = await deleteSize(id);
      else res = await deleteColor(id);

      if (res.success) {
        toast.success('Deleted');
        loadAll();
        // notify other components to refresh
        window.dispatchEvent(new Event('productAttributes:changed'));
      } else {
        if (res.blockingProducts && res.blockingProducts.length > 0) {
          const names = res.blockingProducts.slice(0, 5).map(p => p.name).join(', ');
          const more = res.blockingProducts.length > 5 ? ` and ${res.blockingProducts.length - 5} more` : '';
          toast.error(`Cannot delete: used by products: ${names}${more}. Remove variants from those products first.`);
          console.warn('Blocking products:', res.blockingProducts);
        } else {
          toast.error(res.error || 'Failed to delete');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting');
    }
  };

  const startEdit = (item, type) => {
    setEditingItem({
      id: item.id,
      type,
      name: item.name,
      slug: item.slug || generateSlug(item.name),
      order: item.order || 0,
      isActive: item.isActive !== undefined ? item.isActive : true,
      hex: item.hex || ''
    });
  };

  const cancelEdit = () => setEditingItem(null);

  const saveEdit = async () => {
    if (!editingItem || !editingItem.name.trim()) return toast.error('Name is required');
    try {
      if (editingItem.type === 'size') {
        const res = await updateSize(editingItem.id, {
          name: editingItem.name.trim(),
          slug: editingItem.slug.trim() || generateSlug(editingItem.name.trim()),
          isActive: true
        });
        if (res.success) {
          toast.success('Size updated');
          setEditingItem(null);
          loadAll();
          window.dispatchEvent(new Event('productAttributes:changed'));
        } else toast.error(res.error || 'Failed to update size');
      } else {
        const res = await updateColor(editingItem.id, {
          name: editingItem.name.trim(),
          slug: editingItem.slug.trim() || generateSlug(editingItem.name.trim()),
          isActive: true
        });
        if (res.success) {
          toast.success('Color updated');
          setEditingItem(null);
          loadAll();
          window.dispatchEvent(new Event('productAttributes:changed'));
        } else toast.error(res.error || 'Failed to update color');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating');
    }
  };

  if (!isAdminUser(user)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-white"}`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Access Denied</h2>
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Sizes & Colors</h2>
        <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>Manage product sizes and available colors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`rounded-xl shadow-lg border p-6 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Sizes</h3>
            <div className="flex items-center space-x-2">
              <input
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                className={`rounded px-3 py-2 outline-none border transition-all ${
                  isDark ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50" : "bg-white border-gray-300 focus:ring-blue-500 text-gray-900"
                } focus:ring-2`}
                placeholder="e.g. XS"
              />
              <button onClick={handleAddSize} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> <span>Add</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-8"><LoadingSpinner /></div>
          ) : sizes.length === 0 ? (
            <p className={`${isDark ? "text-gray-500" : "text-gray-600"}`}>No sizes defined.</p>
          ) : (
            <ul className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-100"}`}>
              {sizes.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  {editingItem && editingItem.type === 'size' && editingItem.id === s.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input 
                        className={`rounded px-3 py-1 w-full outline-none border transition-all ${
                          isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300"
                        }`} 
                        value={editingItem.name} 
                        onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))} 
                      />
                      <div className="ml-auto flex gap-2">
                        <button onClick={saveEdit} className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">Save</button>
                        <button onClick={cancelEdit} className={`px-3 py-1 rounded-lg ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className={`${isDark ? "text-gray-200" : "text-gray-800"}`}>{s.name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(s, 'size')} className="text-blue-500 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(s.id, 'size')} className="text-red-500 hover:text-red-400 flex items-center">
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`rounded-xl shadow-lg border p-6 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Colors</h3>
            <div className="flex items-center space-x-2">
              <input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className={`rounded px-3 py-2 outline-none border transition-all ${
                  isDark ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-500/50" : "bg-white border-gray-300 focus:ring-blue-500 text-gray-900"
                } focus:ring-2`}
                placeholder="e.g. Burgundy"
              />
              <button onClick={handleAddColor} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" /> <span>Add</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-8"><LoadingSpinner /></div>
          ) : colors.length === 0 ? (
            <p className={`${isDark ? "text-gray-500" : "text-gray-600"}`}>No colors defined.</p>
          ) : (
            <ul className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-100"}`}>
              {colors.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-3">
                  {editingItem && editingItem.type === 'color' && editingItem.id === c.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input 
                        className={`rounded px-3 py-1 w-full outline-none border transition-all ${
                          isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300"
                        }`} 
                        value={editingItem.name} 
                        onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))} 
                      />
                      <div className="ml-auto flex gap-2">
                        <button onClick={saveEdit} className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">Save</button>
                        <button onClick={cancelEdit} className={`px-3 py-1 rounded-lg ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className={`${isDark ? "text-gray-200" : "text-gray-800"}`}>{c.name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(c, 'color')} className="text-blue-500 hover:underline">Edit</button>
                        <button onClick={() => handleDelete(c.id, 'color')} className="text-red-500 hover:text-red-400 flex items-center">
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirm.open}
        title="Confirm Delete"
        message="Are you sure you want to delete this item?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ open: false, id: null, type: null })}
      />
    </div>
  );
};

export default SizesManagement;
