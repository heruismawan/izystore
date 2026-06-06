import React, { createContext, useState, useContext } from 'react';
import {
  initialUsers,
  initialSalespersons,
  initialInventory,
  initialTransactions,
  initialWarrantyClaims
} from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // In-memory states (mock state, reset on refresh per user request)
  const [currentUser, setCurrentUser] = useState(null); // Default: null (no logged in user)
  const [usersList, setUsersList] = useState(initialUsers);
  const [inventory, setInventory] = useState(initialInventory);
  const [cart, setCart] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [salespersons, setSalespersons] = useState(initialSalespersons);
  const [warrantyClaims, setWarrantyClaims] = useState(initialWarrantyClaims);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  // --- USER MANAGEMENT (Owner Only) ---
  const addUser = (newUser) => {
    setUsersList((prev) => [...prev, { ...newUser, id: 'u_' + Date.now() }]);
  };

  const deleteUser = (userId) => {
    // Prevent self-deletion
    if (currentUser.id === userId) return false;
    setUsersList((prev) => prev.filter((u) => u.id !== userId));
    return true;
  };

  const updateUserRole = (userId, newRole) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    // If updating current user's role, update active session too
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, role: newRole }));
    }
  };

  // --- CART OPERATIONS ---
  const addToCart = (product) => {
    // If it's a gadget, it has a unique IMEI, so maximum qty is 1 and must check if already in cart
    if (product.kategori === 'Gadget') {
      const exists = cart.some((item) => item.id === product.id);
      if (exists) return { success: false, message: 'Gadget dengan IMEI ini sudah berada di keranjang.' };
      
      setCart((prev) => [...prev, { ...product, qty: 1 }]);
      return { success: true };
    } else {
      // Accessories can have quantities
      const existingItemIndex = cart.findIndex((item) => item.id === product.id);
      if (existingItemIndex > -1) {
        const existingItem = cart[existingItemIndex];
        if (existingItem.qty >= product.stok) {
          return { success: false, message: 'Stok aksesoris tidak mencukupi.' };
        }
        setCart((prev) =>
          prev.map((item, idx) =>
            idx === existingItemIndex ? { ...item, qty: item.qty + 1 } : item
          )
        );
      } else {
        setCart((prev) => [...prev, { ...product, qty: 1 }]);
      }
      return { success: true };
    }
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateCartQty = (productId, newQty) => {
    const productInInventory = inventory.find((p) => p.id === productId);
    if (!productInInventory) return;

    if (productInInventory.kategori === 'Gadget') {
      // Gadget qty is strictly 1 per IMEI
      return;
    }

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > productInInventory.stok) {
      alert(`Stok hanya tersedia ${productInInventory.stok} unit.`);
      return;
    }

    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, qty: newQty } : item))
    );
  };

  const clearCart = () => setCart([]);

  // --- PENDING TRANSACTIONS (Hold / Resume) ---
  const holdTransaction = (salespersonName) => {
    if (cart.length === 0) return { success: false, message: 'Keranjang belanja kosong.' };
    
    const newHold = {
      id: 'hold_' + Date.now(),
      date: new Date().toISOString(),
      items: [...cart],
      salesperson: salespersonName || 'Tanpa Sales',
      total: cart.reduce((acc, item) => acc + item.hargaJual * item.qty, 0)
    };
    
    setPendingTransactions((prev) => [...prev, newHold]);
    setCart([]);
    return { success: true };
  };

  const resumeTransaction = (holdId) => {
    const held = pendingTransactions.find((h) => h.id === holdId);
    if (!held) return false;
    
    setCart(held.items);
    setPendingTransactions((prev) => prev.filter((h) => h.id !== holdId));
    return true;
  };

  const cancelPendingTransaction = (holdId) => {
    setPendingTransactions((prev) => prev.filter((h) => h.id !== holdId));
  };

  // --- INVENTORY OPERATIONS ---
  const addInventoryItem = (newItem) => {
    // Generate code/SKU if empty
    const prefix = newItem.brand.slice(0, 3).toUpperCase();
    const modelClean = newItem.model.replace(/\s+/g, '').toUpperCase();
    const genSku = newItem.sku || `${prefix}-${modelClean}-${newItem.kondisi === 'Bekas' ? 'SECO' : 'NEW'}-${Date.now().toString().slice(-4)}`;
    
    const itemToAdd = {
      ...newItem,
      id: 'p_' + Date.now(),
      sku: genSku,
      createdAt: new Date().toISOString(),
      stok: parseInt(newItem.stok) || 1
    };

    setInventory((prev) => [itemToAdd, ...prev]);
    return itemToAdd;
  };

  const updateInventoryItem = (updatedItem) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? { ...item, ...updatedItem } : item))
    );
  };

  const deleteInventoryItem = (itemId) => {
    setInventory((prev) => prev.filter((item) => item.id !== itemId));
  };

  // --- CHECKOUT & TRANSACTION LOGGING ---
  const completeTransaction = (transactionData) => {
    const { items, salesperson, discount, total, paymentMethod, cashAmount, changeAmount, tradeInDetails } = transactionData;
    
    // 1. Deduct Stock or Add Trade-In device
    setInventory((prevInventory) => {
      let updatedInventory = [...prevInventory];
      
      // Reduce purchased stock
      items.forEach((purchaseItem) => {
        updatedInventory = updatedInventory.map((invItem) => {
          if (invItem.id === purchaseItem.id) {
            // For Gadgets, stock goes to 0 (unit sold). For accessories, reduce qty.
            const newStok = Math.max(0, invItem.stok - purchaseItem.qty);
            return { ...invItem, stok: newStok };
          }
          return invItem;
        });
      });
      
      // If there is a Trade-In (gadget lama pelanggan masuk ke stok bekas)
      if (tradeInDetails && tradeInDetails.isTradeIn) {
        const tradeInItem = {
          id: 'p_trade_' + Date.now(),
          sku: `TI-${tradeInDetails.brand.slice(0,3).toUpperCase()}-${tradeInDetails.model.replace(/\s+/g,'').toUpperCase()}-SECO`,
          imei: tradeInDetails.imei,
          brand: tradeInDetails.brand,
          model: tradeInDetails.model,
          warna: tradeInDetails.warna || 'Default',
          ram: tradeInDetails.ram || '-',
          rom: tradeInDetails.rom || '-',
          kondisi: 'Bekas',
          hargaBeli: tradeInDetails.taksiranHarga, // Harga beli toko
          hargaJual: Math.round(tradeInDetails.taksiranHarga * 1.25), // Mock resale price markup
          stok: 1,
          kategori: 'Gadget',
          batteryHealth: parseInt(tradeInDetails.batteryHealth) || 80,
          garansiAsal: tradeInDetails.garansiAsal || 'Inter',
          garansiAktif: false,
          gradeFisik: tradeInDetails.gradeFisik || 'B',
          minus: tradeInDetails.minus || '',
          createdAt: new Date().toISOString(),
          // Data penjual untuk audit hukum
          sellerName: tradeInDetails.sellerName,
          sellerKtp: tradeInDetails.sellerKtp,
          sellerPhone: tradeInDetails.sellerPhone,
          ktpImage: tradeInDetails.ktpImage
        };
        updatedInventory.unshift(tradeInItem);
      }
      
      return updatedInventory;
    });

    // 2. Save transaction to log
    const invoiceNo = `INV-${Date.now().toString().slice(-8)}`;
    const newTransaction = {
      id: 't_' + Date.now(),
      invoiceNo,
      date: new Date().toISOString(),
      items: items.map(item => ({...item})),
      salesperson: salesperson || 'Tanpa Sales',
      discount: discount || 0,
      total,
      paymentMethod,
      cashAmount: cashAmount || total,
      changeAmount: changeAmount || 0,
      tradeInDetails: tradeInDetails && tradeInDetails.isTradeIn ? { ...tradeInDetails } : null,
      type: tradeInDetails && tradeInDetails.isTradeIn ? 'Tukar Tambah' : 'Penjualan'
    };

    setTransactions((prev) => [newTransaction, ...prev]);
    clearCart();
    return { success: true, invoiceNo, transaction: newTransaction };
  };

  // --- WARRANTY CLAIMS ---
  const addWarrantyClaim = (claim) => {
    const newClaim = {
      ...claim,
      id: 'w_' + Date.now(),
      claimDate: new Date().toISOString(),
      status: 'Proses'
    };
    setWarrantyClaims((prev) => [newClaim, ...prev]);
    return newClaim;
  };

  const updateWarrantyClaimStatus = (claimId, newStatus, notes) => {
    setWarrantyClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: newStatus, notes: notes || c.notes } : c))
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        usersList,
        addUser,
        deleteUser,
        updateUserRole,
        
        inventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        
        pendingTransactions,
        holdTransaction,
        resumeTransaction,
        cancelPendingTransaction,
        
        transactions,
        completeTransaction,
        
        salespersons,
        
        warrantyClaims,
        addWarrantyClaim,
        updateWarrantyClaimStatus,
        theme,
        toggleTheme
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
