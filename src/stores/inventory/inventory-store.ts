// ==========================================
// INVENTORY STORE - Connected to Backend API
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export type InventoryItemType = 'produto' | 'servico';
export type InventoryItemStatus = 'ativo' | 'inativo';

export interface InventoryItem {
  id: string;
  name: string;
  type: InventoryItemType;
  quantity: number;
  unit: string;
  status: InventoryItemStatus;
  description?: string;
  referenceValue?: number;
  minStockAlert?: number;
  category?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
}

// Map backend Product to frontend InventoryItem
function mapProductToItem(p: any): InventoryItem {
  return {
    id: p.id,
    name: p.name,
    type: p.category?.toLowerCase() === 'serviço' || p.category?.toLowerCase() === 'servico' ? 'servico' : 'produto',
    quantity: 0, // Products don't have stock in this simple model
    unit: 'un',
    status: p.isActive ? 'ativo' : 'inativo',
    description: p.description || undefined,
    referenceValue: p.price ? Number(p.price) : undefined,
    minStockAlert: undefined,
    category: p.category || undefined,
    code: p.code || undefined,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// React Hook
export function useInventoryStore() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      const products = Array.isArray(res.data) ? res.data : [];
      setItems(products.map(mapProductToItem));
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await api.post('/products', {
        name: item.name,
        code: item.code,
        description: item.description,
        price: item.referenceValue || 0,
        category: item.category || (item.type === 'servico' ? 'Serviço' : 'Produto'),
        isActive: item.status === 'ativo',
      });
      const newItem = mapProductToItem(res.data);
      setItems(prev => [newItem, ...prev]);
      return newItem;
    } catch (err) {
      console.error('Error creating product:', err);
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>) => {
    try {
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.referenceValue !== undefined) payload.price = updates.referenceValue;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.status !== undefined) payload.isActive = updates.status === 'ativo';
      if (updates.code !== undefined) payload.code = updates.code;

      const res = await api.put(`/products/${id}`, payload);
      const updatedItem = mapProductToItem(res.data);
      setItems(prev => prev.map(i => i.id === id ? updatedItem : i));
      return updatedItem;
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
      throw err;
    }
  };

  const getItems = () => items;
  const getActiveItems = () => items.filter(i => i.status === 'ativo');
  const getItemById = (id: string) => items.find(i => i.id === id) || null;
  const getItemsByType = (type: InventoryItemType) => items.filter(i => i.type === type);

  const getLowStockItems = () => items.filter(i => {
    if (!i.minStockAlert) return false;
    return i.quantity <= i.minStockAlert && i.quantity > 0;
  });

  const getOutOfStockItems = () => items.filter(i => i.quantity <= 0 && i.type === 'produto');

  const getStats = () => ({
    totalItems: items.length,
    activeItems: items.filter(i => i.status === 'ativo').length,
    inactiveItems: items.filter(i => i.status === 'inativo').length,
    totalProducts: items.filter(i => i.type === 'produto').length,
    totalServices: items.filter(i => i.type === 'servico').length,
    lowStockCount: getLowStockItems().length,
    outOfStockCount: getOutOfStockItems().length,
    totalValue: items.reduce((sum, i) => sum + (i.referenceValue || 0), 0),
  });

  return {
    items,
    loading,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    getItems,
    getActiveItems,
    getItemById,
    getItemsByType,
    getLowStockItems,
    getOutOfStockItems,
    getStats,
  };
}

// Backward compatibility — singleton store class (minimal, delegates to hook)
class InventoryStore {
  private items: InventoryItem[] = [];
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  getItems() { return this.items; }
  getActiveItems() { return this.items.filter(i => i.status === 'ativo'); }
  getItemById(id: string) { return this.items.find(i => i.id === id) || null; }

  addItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) {
    const newItem: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.items = [newItem, ...this.items];
    this.notify();
    return newItem;
  }

  updateItem(id: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>) {
    this.items = this.items.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i);
    this.notify();
    return this.items.find(i => i.id === id) || null;
  }

  deleteItem(id: string) {
    this.items = this.items.filter(i => i.id !== id);
    this.notify();
  }

  getStats() {
    return {
      totalItems: this.items.length,
      activeItems: this.items.filter(i => i.status === 'ativo').length,
      inactiveItems: this.items.filter(i => i.status === 'inativo').length,
      totalProducts: this.items.filter(i => i.type === 'produto').length,
      totalServices: this.items.filter(i => i.type === 'servico').length,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalValue: this.items.reduce((sum, i) => sum + (i.referenceValue || 0), 0),
    };
  }
}

export const inventoryStore = new InventoryStore();
