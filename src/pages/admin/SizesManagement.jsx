import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sizes & Colors</h2>
        <p className="text-gray-600">Manage product sizes and available colors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Sizes</h3>
            <div className="flex items-center space-x-2">
              <input
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="e.g. XS"
              />
              <button onClick={handleAddSize} className="bg-blue-600 text-white px-3 py-2 rounded flex items-center space-x-2">
                <Plus className="w-4 h-4" /> <span>Add</span>
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : sizes.length === 0 ? (
            <p className="text-gray-600">No sizes defined.</p>
          ) : (
            <ul className="space-y-2">
              {sizes.map((s) => (
                <li key={s.id} className="flex items-center justify-between border-b py-2">
                  {editingItem && editingItem.type === 'size' && editingItem.id === s.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input className="border rounded px-2 py-1 w-full" value={editingItem.name} onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))} />
                      <div className="ml-auto flex gap-2">
                        <button onClick={saveEdit} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                        <button onClick={cancelEdit} className="bg-gray-200 px-3 py-1 rounded">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span>{s.name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(s, 'size')} className="text-blue-600">Edit</button>
                        <button onClick={() => handleDelete(s.id, 'size')} className="text-red-600 flex items-center">
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

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Colors</h3>
            <div className="flex items-center space-x-2">
              <input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="e.g. Burgundy"
              />
              <button onClick={handleAddColor} className="bg-blue-600 text-white px-3 py-2 rounded flex items-center space-x-2">
                <Plus className="w-4 h-4" /> <span>Add</span>
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : colors.length === 0 ? (
            <p className="text-gray-600">No colors defined.</p>
          ) : (
            <ul className="space-y-2">
              {colors.map((c) => (
                <li key={c.id} className="flex items-center justify-between border-b py-2">
                  {editingItem && editingItem.type === 'color' && editingItem.id === c.id ? (
                    <div className="flex items-center gap-2 w-full">
                      <input className="border rounded px-2 py-1 w-full" value={editingItem.name} onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))} />
                      <div className="ml-auto flex gap-2">
                        <button onClick={saveEdit} className="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                        <button onClick={cancelEdit} className="bg-gray-200 px-3 py-1 rounded">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span>{c.name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(c, 'color')} className="text-blue-600">Edit</button>
                        <button onClick={() => handleDelete(c.id, 'color')} className="text-red-600 flex items-center">
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
