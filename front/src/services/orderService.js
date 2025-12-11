import api from "./api";
import { db, isOnline } from '../db/db';
import { networkFirstThenCache } from "./cacheService";

/**
 * Servicio de pedidos con soporte offline
 */
export const OrderService = {
  // ==========================================
  // Métodos originales (online) con cache
  // ==========================================

  // Dealer endpoints
  createOrder: (data) => api.post("/api/orders/", data),

  updateOrder: (orderId, data) => api.put(`/api/orders/${orderId}, data`),

  sendOrder: (orderId) => api.post(`/api/orders/${orderId}/send`),

  cancelOrder: (orderId) => api.post(`/api/orders/${orderId}/cancel`),

  getOrderById: (orderId) =>
    networkFirstThenCache(
      () => api.get(`/api/orders/${orderId}`),
      `/api/orders/${orderId}`
    ),

  getOrdersByVisit: (visitId) =>
    networkFirstThenCache(
      () => api.get(`/api/orders/visit/${visitId}`),
      `/api/orders/visit/${visitId}`
    ),

  getMyOrders: () =>
    networkFirstThenCache(
      () => api.get("/api/orders/my-orders"),
      "/api/orders/my-orders"
    ),

  // Admin endpoints
  filterOrders: (params) => {
    const queryParams = new URLSearchParams();
    if (params.dealerId) queryParams.append('dealerId', params.dealerId);
    if (params.storeId) queryParams.append('storeId', params.storeId);
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    return api.get(`/api/orders/filter?${queryParams.toString()}`);
  },

  // ==========================================
  // Nuevos métodos con soporte offline
  // ==========================================

  /**
   * Crea un pedido con soporte offline
   * Si hay conexión, lo envía al servidor
   * Si no hay conexión, lo guarda localmente para sincronizar después
   */
  createOrderOffline: async (orderData) => {
    const { visitId, storeId, items, notes } = orderData;

    // Calcular total
    const total = items.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);

    // Intentar enviar al servidor si hay conexión
    if (isOnline()) {
      try {
        const response = await api.post('/api/orders/', {
          visitId,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          })),
          total,
          notes
        });

        console.log('✅ Pedido creado en servidor:', response.data);
        return {
          success: true,
          offline: false,
          data: response.data
        };
      } catch (error) {
        console.error('❌ Error al crear pedido online, guardando offline:', error);
        // Si falla, guardar offline
        return await saveOrderOffline(visitId, storeId, items, total, notes);
      }
    } else {
      // Sin conexión, guardar offline directamente
      console.log('📡 Sin conexión, guardando pedido offline');
      return await saveOrderOffline(visitId, storeId, items, total, notes);
    }
  },

  /**
   * Obtiene pedidos pendientes de sincronizar (offline)
   */
  getPendingOrders: async () => {
    return await db.pendingOrders.where('synced').equals(0).toArray();
  },

  /**
   * Obtiene el conteo de pedidos pendientes
   */
  getPendingCount: async () => {
    return await db.pendingOrders.where('synced').equals(0).count();
  },

  /**
   * Obtiene todos los pedidos (incluye pendientes offline)
   */
  getAllWithPending: async () => {
    const pendingOrders = await db.pendingOrders
      .where('synced').equals(0)
      .toArray();

    let serverOrders = [];
    if (isOnline()) {
      try {
        const response = await api.get('/api/orders/my-orders');
        serverOrders = response.data.result || [];
      } catch (error) {
        console.error('Error obteniendo pedidos del servidor:', error);
      }
    }

    // Combinar pedidos del servidor y pendientes offline
    return {
      serverOrders,
      pendingOrders,
      total: serverOrders.length + pendingOrders.length
    };
  }
};

/**
 * Función interna para guardar pedido offline
 */
const saveOrderOffline = async (visitId, storeId, items, total, notes) => {
  try {
    // Generar un identificador único para este pedido offline
    const offlineUniqueId = `OFFLINE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const offlineOrder = {
      offlineUniqueId, // ID único para identificar este pedido offline
      visitId: visitId || null,
      storeId,
      items: items.map(item => ({
        productId: item.productId,
        productName: item.name || item.productName,
        quantity: item.quantity,
        price: item.price,
        sku: item.sku
      })),
      total,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      synced: 0,
      syncAttempts: 0
    };

    const id = await db.pendingOrders.add(offlineOrder);

    console.log('💾 Pedido guardado offline con ID:', id);

    return {
      success: true,
      offline: true,
      localId: id,
      message: 'Pedido guardado offline. Se sincronizará cuando haya conexión.'
    };
  } catch (error) {
    console.error('Error guardando pedido offline:', error);
    throw error;
  }
};

export default OrderService;