import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ModifierManagement from './ModifierManagement';
import { useBranch } from '../../contexts/BranchContext';

function MenuManagement() {
	const [categories, setCategories] = useState([]);
	const [branchId, setBranchId] = useState(null);
	const { selectedBranchId, selectBranch } = useBranch();
	const [newCategoryName, setNewCategoryName] = useState('');
	const [showItemForm, setShowItemForm] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [itemForm, setItemForm] = useState({ category_id: null, name: '', price: '', currency: 'USD', description: '', image: null, is_available: true, featured: false, is_out_of_stock: false });
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedItemForModifiers, setSelectedItemForModifiers] = useState(null);
	const [loading, setLoading] = useState(false);
	const [limits, setLimits] = useState({ branches_limit: 0, branches_used: 0, items_limit: 0, items_used: 0 });
	const [showUpgradeModal, setShowUpgradeModal] = useState(false);
	const [showWarning, setShowWarning] = useState(false);

	useEffect(() => {
		let cancelled = false;
		async function fetch() {
			try {
				const branchesRes = await api.get('/branches/');
				const branches = Array.isArray(branchesRes.data) ? branchesRes.data : (branchesRes.data?.results || []);
				if (cancelled) return;
				if (branches.length > 0) {
					const initialId = selectedBranchId || branches[0].id;
					setBranchId(initialId);
					if (!selectedBranchId) {
						selectBranch(branches[0].id);
					}
					fetchCategories(initialId);
				} else {
					toast.error('No branches found. Please create a branch first.');
				}
			} catch (e) {
				console.error('Failed to load branches', e);
			}
		}
		fetch();
		return () => { cancelled = true; };
	}, [selectedBranchId, selectBranch]);

	useEffect(() => {
		if (selectedBranchId && selectedBranchId !== branchId) {
			setBranchId(selectedBranchId);
			fetchCategories(selectedBranchId);
		}
	}, [selectedBranchId]);

	const fetchCategories = async (bId) => {
		if (!bId) return;
		try {
			const res = await api.get('/menu/categories/', { params: { branch_id: bId } });
			setCategories(res.data || []);
		} catch (e) {
			console.error('Failed to load categories', e);
			toast.error('Failed to load categories');
		}
	};

	const checkItemLimit = () => {
		if (limits.items_limit && limits.items_used >= limits.items_limit) {
			setShowUpgradeModal(true);
			return false;
		}
		return true;
	};

	const handleCreateCategory = async (e) => {
		e.preventDefault();
		const activeBranchId = branchId || selectedBranchId;
		if (!newCategoryName) return toast.error('Category name required');
		if (!activeBranchId) return toast.error('Please select a branch first');
		try {
			await api.post('/menu/categories/', { branch_id: activeBranchId, name: newCategoryName });
			setNewCategoryName('');
			toast.success('Category added');
			fetchCategories(activeBranchId);
		} catch (e) {
			const msg = e.response?.data?.branch_id?.[0] || e.response?.data?.detail || 'Failed to add category';
			toast.error(msg);
		}
	};

	const openItemForm = (categoryId, item = null) => {
		if (item) {
			setEditingItem(item);
			setItemForm({
				category_id: categoryId,
				name: item.name || '',
				price: item.price || '',
				currency: item.currency || 'USD',
				description: item.description || '',
				image: null,
				is_available: item.is_available !== undefined ? item.is_available : true,
				featured: item.featured || false,
				is_out_of_stock: item.is_out_of_stock || false,
			});
		} else {
			if (!checkItemLimit()) return;
			setEditingItem(null);
			setItemForm({ category_id: categoryId, name: '', price: '', currency: 'USD', description: '', image: null, is_available: true, featured: false, is_out_of_stock: false });
		}
		setShowItemForm(true);
	};

	const handleItemFile = (e) => {
		setItemForm({ ...itemForm, image: e.target.files[0] });
	};

	const handleSubmitItem = async (e) => {
		e.preventDefault();
		const activeBranchId = branchId || selectedBranchId;
		if (!activeBranchId) return toast.error('Please select a branch first');
		try {
			setLoading(true);
			let imageUrl = null;
			if (itemForm.image) {
				const fd = new FormData();
				fd.append('menu_image', itemForm.image);
				const up = await api.post('/menu/upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
				imageUrl = up.data.url;
			}

			const payload = {
				category_id: itemForm.category_id,
				branch_id: activeBranchId,
				name: itemForm.name,
				price: itemForm.price,
				currency: itemForm.currency,
				description: itemForm.description,
				image_url: imageUrl || editingItem?.image_url,
				is_available: itemForm.is_available,
				featured: itemForm.featured,
				is_out_of_stock: itemForm.is_out_of_stock,
			};

			if (editingItem) {
				await api.put(`/menu/items/${editingItem.id}/`, payload);
				toast.success('Item updated');
			} else {
				await api.post('/menu/items/', payload);
				toast.success('Item added');
			}
			setShowItemForm(false);
			setEditingItem(null);
			fetchCategories(branchId);
		} catch (e) {
			console.error('Failed to save item', e);
			toast.error(editingItem ? 'Failed to update item' : 'Failed to add item');
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteItem = async (itemId) => {
		if (!window.confirm('Are you sure you want to delete this item?')) return;
		try {
			await api.delete(`/menu/items/${itemId}/`);
			toast.success('Item deleted');
			fetchCategories(branchId);
		} catch (e) {
			toast.error('Failed to delete item');
		}
	};

	const toggleAvailability = async (item) => {
		try {
			await api.patch(`/menu/items/${item.id}/`, { is_available: !item.is_available });
			toast.success(item.is_available ? 'Item marked as unavailable' : 'Item marked as available');
			fetchCategories(branchId);
		} catch (e) {
			toast.error('Failed to update availability');
		}
	};

	const toggleFeatured = async (item) => {
		try {
			await api.patch(`/menu/items/${item.id}/`, { featured: !item.featured });
			toast.success(item.featured ? 'Removed from featured' : 'Added to featured');
			fetchCategories(branchId);
		} catch (e) {
			toast.error('Failed to update featured');
		}
	};

	const toggleOutOfStock = async (item) => {
		try {
			await api.patch(`/menu/items/${item.id}/`, { is_out_of_stock: !item.is_out_of_stock });
			toast.success(item.is_out_of_stock ? 'Marked as in stock' : 'Marked as out of stock');
			fetchCategories(branchId);
		} catch (e) {
			toast.error('Failed to update stock status');
		}
	};

	const moveCategory = async (category, direction) => {
		const sorted = [...categories].sort((a, b) => a.order - b.order);
		const idx = sorted.findIndex(c => c.id === category.id);
		const targetIdx = idx + direction;
		if (targetIdx < 0 || targetIdx >= sorted.length) return;

		const target = sorted[targetIdx];
		try {
			await api.put(`/menu/categories/${category.id}/`, { order: target.order });
			await api.put(`/menu/categories/${target.id}/`, { order: category.order });
			toast.success('Category order updated');
			fetchCategories(branchId);
		} catch (e) {
			toast.error('Failed to reorder category');
		}
	};

	const searchItems = async () => {
		if (!searchQuery.trim() || !branchId) return;
		try {
			const res = await api.get('/menu/items/', { params: { search: searchQuery, branch_id: branchId } });
			const searchResults = res.data || [];
			if (searchResults.length > 0) {
				const grouped = searchResults.reduce((acc, item) => {
					const catId = item.category?.id || 'uncategorized';
					if (!acc[catId]) acc[catId] = { ...item.category, items: [] };
					acc[catId].items.push(item);
					return acc;
				}, {});
				setCategories(Object.values(grouped));
			} else {
				setCategories([]);
			}
		} catch (e) {
			console.error('Search failed', e);
		}
	};

	const clearSearch = () => {
		setSearchQuery('');
		fetchCategories(branchId);
	};

	if (!branchId) return <div className="card text-center py-12">No branch selected</div>;

	return (
		<div>
			{showWarning && (
				<div className="mb-4 p-3 rounded-lg flex items-center justify-between" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--error)' }}>
					<span className="text-sm font-medium">⚠️ You are approaching your plan limit. You have used {limits.items_used} of {limits.items_limit} items.</span>
					<button onClick={() => setShowUpgradeModal(true)} className="text-sm font-medium underline">Upgrade Plan</button>
				</div>
			)}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
				<h2 className="text-xl font-semibold">Menu Management</h2>
				<div>
					<form onSubmit={handleCreateCategory} className="flex gap-2">
						<input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category" className="px-2 py-1 rounded border" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} />
						<button type="submit" className="btn">Add Category</button>
					</form>
				</div>
			</div>

			{/* Search */}
			<div className="mb-4">
				<div className="flex gap-2">
					<input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={(e) => e.key === 'Enter' && searchItems()}
						placeholder="Search items by name..."
						className="input-field flex-1"
					/>
					<button type="button" onClick={searchItems} className="btn-primary">Search</button>
					{searchQuery && (
						<button type="button" onClick={clearSearch} className="btn-secondary">Clear</button>
					)}
				</div>
			</div>

			{categories.length === 0 ? (
				<div className="card text-center py-8">No categories match your search</div>
			) : (
				categories.map((c) => (
					<div key={c.id} className="card mb-3">
						<div className="flex justify-between items-center">
							<div className="flex items-center gap-2">
								<div className="flex flex-col">
									<button onClick={() => moveCategory(c, -1)} disabled={categories.indexOf(c) === 0} className="text-xs p-0.5 disabled:opacity-30" style={{ color: 'var(--text-primary)' }}>↑</button>
									<button onClick={() => moveCategory(c, 1)} disabled={categories.indexOf(c) === categories.length - 1} className="text-xs p-0.5 disabled:opacity-30" style={{ color: 'var(--text-primary)' }}>↓</button>
								</div>
								<div>
									<h3 className="font-medium">{c.name}</h3>
									{c.description && <p className="text-sm text-gray-600">{c.description}</p>}
								</div>
							</div>
							<div>
								<button onClick={() => openItemForm(c.id)} className="btn">Add Item</button>
							</div>
						</div>
						<div className="mt-2">
							{c.items && c.items.length ? c.items.map(i => (
								<div key={i.id} className="py-2 border-t flex flex-wrap justify-between items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
									<div className="flex-1 min-w-0">
										<div className="font-medium flex items-center gap-2">
											{i.name}
											{i.is_out_of_stock && <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Out of Stock</span>}
											<span className={`inline-block w-2.5 h-2.5 rounded-full ${i.is_available ? 'bg-green-500' : 'bg-red-500'}`} title={i.is_available ? 'Available' : 'Unavailable'}></span>
										</div>
										<div className="text-sm text-gray-600">{i.description}</div>
										{i.modifiers && i.modifiers.length > 0 && (
											<button onClick={() => setSelectedItemForModifiers(i)} className="text-xs mt-1 underline" style={{ color: 'var(--accent)' }}>
												Manage Modifiers ({i.modifiers.length})
											</button>
										)}
									</div>
									<div className="flex items-center gap-2">
										<span className="font-semibold">{i.price} {i.currency}</span>
										<button onClick={() => toggleAvailability(i)} className={`px-2 py-1 text-xs rounded ${i.is_available ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
											{i.is_available ? 'Unavailable' : 'Available'}
										</button>
										<button onClick={() => toggleFeatured(i)} className={`px-2 py-1 text-xs rounded ${i.featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
											{i.featured ? '⭐ Featured' : 'Featured'}
										</button>
										<button onClick={() => toggleOutOfStock(i)} className={`px-2 py-1 text-xs rounded ${i.is_out_of_stock ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
											{i.is_out_of_stock ? '📦 Out of Stock' : '📦 Stock'}
										</button>
										<button onClick={() => openItemForm(c.id, i)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" style={{ color: 'var(--accent)' }}>
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
										</button>
										<button onClick={() => handleDeleteItem(i.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20" style={{ color: 'var(--error)' }}>
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.061-.94-1.75-1.816-1.816L17.25 3.75M6.75 21V3.75" /></svg>
										</button>
									</div>
								</div>
							)) : <div className="py-2 text-sm text-gray-600">No items</div>}
						</div>

						{/* Modifier Management */}
						{selectedItemForModifiers && selectedItemForModifiers.category?.id === c.id && (
							<ModifierManagement
								itemId={selectedItemForModifiers.id}
								itemName={selectedItemForModifiers.name}
								onClose={() => setSelectedItemForModifiers(null)}
							/>
						)}
					</div>
				))
			)}

			{showItemForm && (
				<div className="card p-4 fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-y-auto z-50">
					<h3 className="font-semibold mb-2">{editingItem ? 'Edit Item' : 'Add Item'}</h3>
				<form onSubmit={handleSubmitItem} className="flex flex-col gap-2">
					<input placeholder="Name" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="px-2 py-1 rounded border" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} />
					<div className="flex gap-2">
						<input placeholder="Price" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} className="px-2 py-1 rounded border flex-1" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} />
						<select value={itemForm.currency} onChange={(e) => setItemForm({ ...itemForm, currency: e.target.value })} className="px-2 py-1 rounded border" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
							<option value="USD">USD</option>
							<option value="ETB">ETB</option>
							<option value="EUR">EUR</option>
							<option value="GBP">GBP</option>
							<option value="SAR">SAR</option>
							<option value="AED">AED</option>
						</select>
					</div>
					<input placeholder="Description" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="px-2 py-1 rounded border" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} />
						<div className="flex items-center gap-4">
							<label className="flex items-center gap-1 text-sm cursor-pointer">
								<input type="checkbox" checked={itemForm.is_available} onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })} />
								Available
							</label>
							<label className="flex items-center gap-1 text-sm cursor-pointer">
								<input type="checkbox" checked={itemForm.featured} onChange={(e) => setItemForm({ ...itemForm, featured: e.target.checked })} />
								Featured
							</label>
							<label className="flex items-center gap-1 text-sm cursor-pointer">
								<input type="checkbox" checked={itemForm.is_out_of_stock} onChange={(e) => setItemForm({ ...itemForm, is_out_of_stock: e.target.checked })} />
								Out of Stock
							</label>
						</div>
						<input type="file" accept="image/*" onChange={handleItemFile} />
						<div className="flex justify-end gap-2">
							<button type="button" onClick={() => { setShowItemForm(false); setEditingItem(null); }} className="btn">Cancel</button>
							<button type="submit" disabled={loading} className="btn">{loading ? 'Saving...' : 'Save'}</button>
						</div>
					</form>
				</div>
			)}

			{showUpgradeModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowUpgradeModal(false)}>
					<div className="card max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
						<h3 className="text-lg font-semibold mb-2">Plan Limit Reached</h3>
						<p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>You have reached your plan limit of {limits.items_limit} items. Please upgrade your plan to add more.</p>
						<div className="p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
							<p className="text-sm font-medium">Current Plan</p>
							<p className="text-xs" style={{ color: 'var(--text-muted)' }}>{limits.items_used} / {limits.items_limit} items used</p>
						</div>
						<button onClick={() => setShowUpgradeModal(false)} className="btn-primary w-full">Upgrade Plan</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default MenuManagement;
