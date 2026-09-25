import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  Layers,
  Edit2,
  Trash2,
  AlertCircle,
  Tag,
  Boxes,
  Upload,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  X,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../api.ts';
import { Business, Product, ProductCategory } from '../../types.ts';
import { CategoryIconBar } from '../common/CategoryIconBar.tsx';
import { optimizeProductImage, formatBytes, OptimizedImageResult } from '../../utils/imageOptimizer.ts';

interface ProductsSectionProps {
  business: Business;
  initialShowCategoryModal?: boolean;
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({
  business,
  initialShowCategoryModal = false,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(initialShowCategoryModal);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Category Edit & Delete States
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);
  const [reassignTargetCatId, setReassignTargetCatId] = useState<string>('');
  const [catActionError, setCatActionError] = useState<string | null>(null);
  const [catActionSuccess, setCatActionSuccess] = useState<string | null>(null);

  // New Category Form
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  // New Product Form
  const [prodName, setProdName] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodPurchasePrice, setProdPurchasePrice] = useState('');
  const [prodSellingPrice, setProdSellingPrice] = useState('');
  const [prodWeight, setProdWeight] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodOpeningStock, setProdOpeningStock] = useState('10');
  const [error, setError] = useState<string | null>(null);

  // Image Upload & Optimization States
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [imageOptimizationResult, setImageOptimizationResult] = useState<OptimizedImageResult | null>(null);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes] = await Promise.all([
        api.getCategories(business.id),
        api.getProducts(business.id),
      ]);
      setCategories(catsRes.categories || []);
      setProducts(prodsRes.products || []);
      if (catsRes.categories && catsRes.categories.length > 0 && !prodCatId) {
        setProdCatId(catsRes.categories[0].id.toString());
      }
    } catch (err: any) {
      console.error('Failed to load products/categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business.id]);

  // Handle client-side file selection, automatic optimization, compression and web conversion
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }

    setIsOptimizingImage(true);
    setError(null);

    try {
      const result = await optimizeProductImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.82,
        format: 'image/webp',
      });

      setProdImage(result.dataUrl);
      setImageOptimizationResult(result);
    } catch (err: any) {
      console.error('Image optimization failed', err);
      setError('Failed to optimize image. You can try another image or paste an image URL directly.');
    } finally {
      setIsOptimizingImage(false);
    }
  };

  const handleClearImage = () => {
    setProdImage('');
    setImageOptimizationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      const res = await api.createCategory(business.id, {
        name: categoryName,
        description: categoryDesc,
      });
      setCategories([...categories, res.category]);
      setCategoryName('');
      setCategoryDesc('');
      setCatActionSuccess(`Category "${res.category.name}" added successfully.`);
      setTimeout(() => setCatActionSuccess(null), 3000);
    } catch (err: any) {
      setCatActionError(err.message || 'Failed to create category');
    }
  };

  const startEditCategory = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
    setCatActionError(null);
    setCatActionSuccess(null);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;

    try {
      const res = await api.updateCategory(business.id, editingCategory.id, {
        name: editCatName,
        description: editCatDesc,
      });

      setCategories(
        categories.map((c) => (c.id === editingCategory.id ? res.category : c))
      );
      setEditingCategory(null);
      setCatActionSuccess(`Category "${res.category.name}" updated successfully.`);
      setTimeout(() => setCatActionSuccess(null), 3000);
      loadData();
    } catch (err: any) {
      setCatActionError(err.message || 'Failed to update category');
    }
  };

  const startDeleteCategory = (cat: ProductCategory) => {
    setDeletingCategory(cat);
    setCatActionError(null);
    setCatActionSuccess(null);
    const otherCats = categories.filter((c) => c.id !== cat.id);
    if (otherCats.length > 0) {
      setReassignTargetCatId(otherCats[0].id.toString());
    } else {
      setReassignTargetCatId('');
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      const targetId = reassignTargetCatId ? parseInt(reassignTargetCatId, 10) : undefined;
      const res = await api.deleteCategory(business.id, deletingCategory.id, targetId);

      setCatActionSuccess(
        `Category "${deletingCategory.name}" removed successfully. ${res.reassignedCount} products reassigned.`
      );
      setDeletingCategory(null);
      setTimeout(() => setCatActionSuccess(null), 3000);

      if (selectedCategory === deletingCategory.id.toString()) {
        setSelectedCategory('all');
      }
      loadData();
    } catch (err: any) {
      setCatActionError(err.message || 'Failed to delete category');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pPrice = prodPurchasePrice ? parseFloat(prodPurchasePrice) : 0;
    const sPrice = prodSellingPrice ? parseFloat(prodSellingPrice) : 0;

    try {
      if (editingProduct) {
        await api.updateProduct(business.id, editingProduct.id, {
          name: prodName,
          category_id: parseInt(prodCatId, 10) || categories[0]?.id,
          sku: prodSku,
          purchase_price: pPrice,
          selling_price: sPrice,
          weight: prodWeight,
          image: prodImage,
        });
      } else {
        await api.createProduct(business.id, {
          name: prodName,
          category_id: parseInt(prodCatId, 10) || categories[0]?.id,
          sku: prodSku || `SKU-${Date.now().toString().slice(-4)}`,
          purchase_price: pPrice,
          selling_price: sPrice,
          weight: prodWeight,
          image: prodImage,
          opening_stock: parseFloat(prodOpeningStock) || 0,
        });
      }

      setShowProductModal(false);
      resetProductForm();
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(business.id, id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdCatId(prod.category_id.toString());
    setProdSku(prod.sku);
    setProdPurchasePrice(prod.purchase_price > 0 ? prod.purchase_price.toString() : '');
    setProdSellingPrice(prod.selling_price > 0 ? prod.selling_price.toString() : '');
    setProdWeight(prod.weight || '');
    setProdImage(prod.image || '');
    setImageOptimizationResult(null);
    setShowProductModal(true);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProdName('');
    setProdSku('');
    setProdPurchasePrice('');
    setProdSellingPrice('');
    setProdWeight('');
    setProdImage('');
    setImageOptimizationResult(null);
    setProdOpeningStock('10');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const categoryCounts = products.reduce((acc, p) => {
    acc[p.category_id] = (acc[p.category_id] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || p.category_id.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <Package className="w-5 h-5 text-indigo-600 shrink-0" />
            <span>Product & Stock Catalog</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage inventory items, desktop photo uploads, prices, and category groupings
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setCatActionError(null);
              setCatActionSuccess(null);
              setEditingCategory(null);
              setDeletingCategory(null);
              setShowCategoryModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs flex items-center space-x-2 transition-colors cursor-pointer"
            id="manage-categories-btn"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Add Categories</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-medium">
              {categories.length}
            </span>
          </button>
          <button
            onClick={() => {
              resetProductForm();
              setShowProductModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center space-x-2 transition-colors cursor-pointer"
            id="add-product-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Category Icons at the top instead of a dropdown */}
      <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 flex items-center space-x-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            <span>Product Categories (Click to Filter):</span>
          </span>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              Reset to All
            </button>
          )}
        </div>

        {/* Clickable Category Icons Bar */}
        <CategoryIconBar
          categories={categories}
          selectedCategoryId={selectedCategory}
          onSelectCategory={(catId) => setSelectedCategory(catId)}
          productCounts={categoryCounts}
          totalCount={products.length}
        />

        {/* Search input below icons */}
        <div className="pt-3 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder={`Search in ${
                selectedCategory === 'all'
                  ? 'all products'
                  : categories.find((c) => c.id.toString() === selectedCategory)?.name || 'category'
              } by name or SKU...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Products Grid - Compact ~33% size, Dominant Product Image, High Information Density */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>
          Showing <strong className="text-slate-800 font-semibold">{filteredProducts.length}</strong> of{' '}
          <strong className="text-slate-800 font-semibold">{products.length}</strong> items
        </span>
        {search && (
          <span className="text-indigo-600">
            Filtered by &ldquo;{search}&rdquo;
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => openEditProduct(p)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openEditProduct(p);
              }
            }}
            className="bg-white border border-slate-200/90 hover:border-indigo-500 rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-left"
            id={`product-card-${p.id}`}
            title={`Click to edit or view ${p.name}`}
          >
            {/* Visually Dominant Image Area: allocates maximum available space within the button */}
            <div className="relative aspect-square w-full bg-slate-50 overflow-hidden flex items-center justify-center border-b border-slate-100">
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div
                  className="rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0"
                  style={{
                    width: 'calc(1.75rem * var(--app-icon-scale, 1))',
                    height: 'calc(1.75rem * var(--app-icon-scale, 1))',
                  }}
                >
                  <Package className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Minimal SKU badge overlay */}
              {p.sku && (
                <div className="absolute top-1.5 left-1.5 pointer-events-none">
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold bg-black/60 text-white/95 backdrop-blur-xs tracking-tight shadow-2xs">
                    {p.sku}
                  </span>
                </div>
              )}

              {/* Minimal Stock Status Badge overlay */}
              <div className="absolute top-1.5 right-1.5 pointer-events-none">
                <span
                  className={`px-1.5 py-0.5 rounded text-[9.5px] font-semibold backdrop-blur-xs shadow-2xs ${
                    p.current_stock > 10
                      ? 'bg-emerald-600/90 text-white'
                      : p.current_stock > 0
                      ? 'bg-amber-600/90 text-white'
                      : 'bg-rose-600/90 text-white'
                  }`}
                  title={`${p.current_stock} in stock`}
                >
                  {p.current_stock}
                </span>
              </div>

              {/* Floating Quick Action Buttons (Edit & Delete) positioned neatly without reducing image area */}
              <div className="absolute bottom-1.5 right-1.5 flex items-center space-x-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditProduct(p);
                  }}
                  className="w-6 h-6 rounded-md bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 shadow-xs flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80"
                  title="Edit Product"
                  aria-label="Edit Product"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProduct(p.id);
                  }}
                  className="w-6 h-6 rounded-md bg-white/95 hover:bg-rose-50 text-slate-700 hover:text-rose-600 shadow-xs flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80"
                  title="Delete Product"
                  aria-label="Delete Product"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Compact Details Area: minimal space (<25% of button) */}
            <div className="p-1.5 sm:p-2 bg-white flex flex-col justify-between">
              <h4
                className="text-[11px] sm:text-xs font-semibold text-slate-900 truncate leading-snug"
                title={p.name}
              >
                {p.name}
              </h4>
              <div className="flex items-center justify-between mt-1 text-[10.5px] sm:text-[11px]">
                <span className="font-mono font-bold text-slate-900 truncate">
                  {p.selling_price > 0
                    ? `${business.currency} ${p.selling_price.toFixed(2)}`
                    : '—'}
                </span>
                {p.weight ? (
                  <span
                    className="text-[9.5px] text-slate-400 font-medium truncate max-w-[45%] text-right"
                    title={`Weight: ${p.weight}`}
                  >
                    {p.weight}
                  </span>
                ) : (
                  <span
                    className="text-[9.5px] text-indigo-600/90 font-medium truncate max-w-[45%] text-right"
                    title={p.category_name}
                  >
                    {p.category_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-2">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-base font-semibold text-slate-800">No products found</p>
          <p className="text-sm text-slate-500 mt-1">Try resetting the category filter or adding a new product</p>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 shrink-0">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 flex-1 overflow-y-auto mt-4 pr-1">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. 22K Gold Bangle"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={prodCatId}
                    onChange={(e) => setProdCatId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    placeholder="e.g. GLD-BNG-001"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Price Fields - Optional as requested */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-slate-700">
                      Purchase / Cost Price ({business.currency})
                    </label>
                    <span className="text-xs text-slate-500">Optional</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPurchasePrice}
                    onChange={(e) => setProdPurchasePrice(e.target.value)}
                    placeholder="0.00 (Optional)"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-slate-700">
                      Selling Price ({business.currency})
                    </label>
                    <span className="text-xs text-slate-500">Optional</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={prodSellingPrice}
                    onChange={(e) => setProdSellingPrice(e.target.value)}
                    placeholder="0.00 (Optional)"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Weight / Unit</label>
                  <input
                    type="text"
                    value={prodWeight}
                    onChange={(e) => setProdWeight(e.target.value)}
                    placeholder="e.g. 14.50 gm, 22K"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                {!editingProduct && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Opening Stock
                    </label>
                    <input
                      type="number"
                      value={prodOpeningStock}
                      onChange={(e) => setProdOpeningStock(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Product Image: Direct Desktop Upload with Auto-Optimization & Compression */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-800 flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    <span>Product Image (Desktop Upload & Optimization)</span>
                  </label>
                  <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setImageMode('upload')}
                      className={`px-2.5 py-1 rounded-md ${
                        imageMode === 'upload' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600'
                      }`}
                    >
                      From Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`px-2.5 py-1 rounded-md ${
                        imageMode === 'url' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600'
                      }`}
                    >
                      Via URL
                    </button>
                  </div>
                </div>

                {imageMode === 'upload' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                      id="product-image-file-input"
                    />
                    <label
                      htmlFor="product-image-file-input"
                      className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl cursor-pointer bg-white transition-colors"
                    >
                      {isOptimizingImage ? (
                        <div className="flex flex-col items-center py-2 space-y-2 text-slate-600">
                          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                          <span className="text-sm font-medium">Optimizing & converting image to WebP...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center space-y-1">
                          <Upload className="w-6 h-6 text-indigo-600" />
                          <span className="text-sm font-semibold text-slate-800">
                            Click to upload image directly from your desktop
                          </span>
                          <span className="text-xs text-slate-500">
                            Auto-resizes (max 800px), converts to web-friendly WebP, & compresses for fast loading
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={prodImage}
                      onChange={(e) => {
                        setProdImage(e.target.value);
                        setImageOptimizationResult(null);
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Image Preview & Optimization Statistics */}
                {prodImage && (
                  <div className="flex items-center space-x-3 p-3 bg-white border border-slate-200 rounded-xl">
                    <img
                      src={prodImage}
                      alt="Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-700">
                          Optimized & Ready for Web
                        </span>
                      </div>
                      {imageOptimizationResult ? (
                        <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                          <div>
                            Format: <span className="font-semibold text-slate-800">{imageOptimizationResult.format}</span> • Size:{' '}
                            <span className="text-emerald-700 font-mono font-semibold">
                              {formatBytes(imageOptimizationResult.optimizedSize)}
                            </span>{' '}
                            (was {formatBytes(imageOptimizationResult.originalSize)})
                          </div>
                          <div className="text-emerald-600 font-semibold">
                            ✓ {imageOptimizationResult.reductionPercentage}% smaller size reduction achieved!
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 mt-0.5">Custom image attached</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                      title="Remove Image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal with Edit & Safe Delete Operations */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Product Category Management</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setDeletingCategory(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {catActionSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
                {catActionSuccess}
              </div>
            )}
            {catActionError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">
                {catActionError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
              {/* Form to Create or Edit Category */}
              {editingCategory ? (
                <form
                  onSubmit={handleUpdateCategory}
                  className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-900">
                      Editing Category: {editingCategory.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editCatDesc}
                      onChange={(e) => setEditCatDesc(e.target.value)}
                      placeholder="Optional details..."
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSaveCategory} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="text-sm font-bold text-slate-800">Create New Category</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Category Name (e.g. Diamond Rings)"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Description (Optional)"
                      value={categoryDesc}
                      onChange={(e) => setCategoryDesc(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center space-x-1.5 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Category</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Safety Modal for Deleting Category */}
              {deletingCategory && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-900">
                        Delete Category: "{deletingCategory.name}"
                      </h4>
                      <p className="text-xs text-slate-700 mt-1">
                        {categoryCounts[deletingCategory.id] > 0
                          ? `This category currently contains ${
                              categoryCounts[deletingCategory.id]
                            } product(s). To preserve data integrity, please select a category to reassign them to:`
                          : 'This category has no assigned products and can be safely deleted.'}
                      </p>
                    </div>
                  </div>

                  {categoryCounts[deletingCategory.id] > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Transfer {categoryCounts[deletingCategory.id]} products to:
                      </label>
                      <select
                        value={reassignTargetCatId}
                        onChange={(e) => setReassignTargetCatId(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                      >
                        {categories
                          .filter((c) => c.id !== deletingCategory.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        <option value="">Create Fallback: "General Inventory"</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-rose-200">
                    <button
                      type="button"
                      onClick={() => setDeletingCategory(null)}
                      className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteCategory}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-xs"
                    >
                      Confirm Safe Deletion
                    </button>
                  </div>
                </div>
              )}

              {/* List of Existing Categories with Edit and Delete options */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Existing Categories ({categories.length})
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {categories.map((c) => {
                    const prodCount = categoryCounts[c.id] || 0;
                    return (
                      <div
                        key={c.id}
                        className="p-3.5 flex items-center justify-between text-sm hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center space-x-2">
                            <span>{c.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-indigo-700 border border-slate-200 font-medium">
                              {prodCount} item{prodCount === 1 ? '' : 's'}
                            </span>
                          </div>
                          {c.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0 ml-3">
                          <button
                            type="button"
                            onClick={() => startEditCategory(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => startDeleteCategory(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setDeletingCategory(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
