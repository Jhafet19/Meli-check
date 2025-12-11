import { db, updateLastSync, isOnline } from '../db/db';
import { getMyAssignments } from './assignmentService';
import { ProductService } from './productService';
import { VisitService } from './visitService';
import { OrderService } from './orderService';
import { cacheArrayItems } from './cacheService';
import api from './api';

/**
 * Servicio de sincronización offline-online
 * Maneja la descarga de datos para uso offline y la sincronización de datos pendientes
 */

// ============================
// DESCARGA DE DATOS (para uso offline)
// ============================

/**
 * Descarga y cachea las asignaciones del dealer actual
 * Incluye tiendas y productos asignados
 */
export const syncAssignmentsToLocal = async () => {
  try {
    console.log('📥 Sincronizando asignaciones del dealer...');
    const response = await getMyAssignments();
    const assignments = response.data.result || [];

    // Guardar asignaciones en IndexedDB
    await db.assignments.clear(); // Limpiar asignaciones anteriores

    for (const assignment of assignments) {
      await db.assignments.add({
        assignmentId: assignment.id,
        storeId: assignment.store?.id,
        productId: assignment.product?.id,
        dealerId: assignment.dealer?.id,
        status: assignment.status?.statusName || 'ACTIVE',
        assignmentType: assignment.assignmentType?.typeName,
        store: assignment.store, // Guardar objeto completo de la tienda
        product: assignment.product, // Guardar objeto completo del producto
        lastSync: new Date().toISOString()
      });

      // Guardar tienda en caché de tiendas si no existe
      if (assignment.store) {
        const existingStore = await db.stores.get(assignment.store.id);
        if (!existingStore) {
          await db.stores.add({
            id: assignment.store.id,
            name: assignment.store.name,
            address: assignment.store.address,
            latitude: assignment.store.latitude,
            longitude: assignment.store.longitude,
            qrCode: assignment.store.qrCode,
            phone: assignment.store.phone,
            status: assignment.store.status?.statusName || 'ACTIVE',
            lastSync: new Date().toISOString()
          });
        }
      }

      // Guardar producto en caché de productos si no existe
      if (assignment.product) {
        const existingProduct = await db.products.get(assignment.product.id);
        if (!existingProduct) {
          await db.products.add({
            id: assignment.product.id,
            name: assignment.product.name,
            sku: assignment.product.sku,
            unit: assignment.product.unit,
            price: assignment.product.price,
            image: assignment.product.image,
            status: assignment.product.status?.statusName || 'ACTIVE',
            lastSync: new Date().toISOString()
          });
        }
      }
    }

    console.log(`✅ ${assignments.length} asignaciones sincronizadas`);
    await updateLastSync('assignments');
    return { success: true, count: assignments.length };
  } catch (error) {
    console.error('❌ Error sincronizando asignaciones:', error);
    throw error;
  }
};

/**
 * Descarga y cachea el catálogo completo de productos activos
 */
export const syncProductsToLocal = async () => {
  try {
    console.log('📥 Sincronizando catálogo de productos...');
    const response = await ProductService.getActives();
    const products = response.data.result || [];

    // Actualizar productos en IndexedDB
    for (const product of products) {
      await db.products.put({
        id: product.id,
        name: product.name,
        sku: product.sku,
        unit: product.unit,
        price: product.price,
        image: product.image,
        status: product.status?.statusName || 'ACTIVE',
        lastSync: new Date().toISOString()
      });
    }

    console.log(`✅ ${products.length} productos sincronizados`);
    await updateLastSync('products');
    return { success: true, count: products.length };
  } catch (error) {
    console.error('❌ Error sincronizando productos:', error);
    throw error;
  }
};

/**
 * Sincronización completa de datos para uso offline
 */
export const syncAllDataToLocal = async () => {
  console.log('🔄 Iniciando sincronización completa...');
  const results = {
    assignments: null,
    products: null,
    errors: []
  };

  try {
    results.assignments = await syncAssignmentsToLocal();
  } catch (error) {
    results.errors.push({ type: 'assignments', error: error.message });
  }

  try {
    results.products = await syncProductsToLocal();
  } catch (error) {
    results.errors.push({ type: 'products', error: error.message });
  }

  await updateLastSync('lastFullSync');
  console.log('✅ Sincronización completa finalizada', results);

  return results;
};

/**
 * PRE-CACHEA TODOS LOS DATOS DEL DEALER usando el nuevo sistema de cache API
 * Esta función se ejecuta automáticamente al hacer login
 * Cachea: visitas, pedidos, asignaciones, productos y tiendas
 */
export const preCacheAllDealerData = async () => {
  console.log('🚀 Pre-cacheando todos los datos del dealer...');
  const results = {
    visits: 0,
    orders: 0,
    assignments: 0,
    products: 0,
    errors: []
  };

  // 1. Pre-cachear visitas de hoy
  try {
    console.log('📅 Pre-cacheando visitas de hoy...');
    const visitsResponse = await VisitService.getTodayVisits();
    const visits = visitsResponse.data.result || [];
    results.visits = visits.length;

    // Auto-cachear cada visita individual
    if (visits.length > 0) {
      await cacheArrayItems(visits, '/api/visits');
    }
    console.log(`✅ ${visits.length} visitas pre-cacheadas`);
  } catch (error) {
    console.error('❌ Error pre-cacheando visitas:', error);
    results.errors.push({ type: 'visits', error: error.message });
  }

  // 2. Pre-cachear mis pedidos
  try {
    console.log('📦 Pre-cacheando mis pedidos...');
    const ordersResponse = await OrderService.getMyOrders();
    const orders = ordersResponse.data.result || [];
    results.orders = orders.length;

    // Auto-cachear cada pedido individual
    if (orders.length > 0) {
      await cacheArrayItems(orders, '/api/orders');
    }
    console.log(`✅ ${orders.length} pedidos pre-cacheados`);
  } catch (error) {
    console.error('❌ Error pre-cacheando pedidos:', error);
    results.errors.push({ type: 'orders', error: error.message });
  }

  // 3. Pre-cachear mis asignaciones
  try {
    console.log('🏪 Pre-cacheando mis asignaciones...');
    const assignmentsResponse = await getMyAssignments();
    const assignments = assignmentsResponse.data.result || [];
    results.assignments = assignments.length;

    // Auto-cachear cada asignación individual
    if (assignments.length > 0) {
      await cacheArrayItems(assignments, '/api/assignments/me');

      // También guardar las tiendas de las asignaciones en db.stores para escaneo QR offline
      console.log(`🔄 Actualizando ${assignments.length} tiendas en db.stores...`);
      let storesUpdated = 0;
      for (const assignment of assignments) {
        if (assignment.store) {
          try {
            console.log(`💾 Guardando tienda ${assignment.store.id} (${assignment.store.name}) en db.stores`);
            // Usar put en lugar de add para actualizar si ya existe
            await db.stores.put({
              id: assignment.store.id,
              name: assignment.store.name,
              address: assignment.store.address,
              latitude: assignment.store.latitude,
              longitude: assignment.store.longitude,
              qrCode: assignment.store.qrCode,
              status: assignment.store.status,
              lastSync: new Date().toISOString()
            });
            storesUpdated++;
            console.log(`✅ Tienda ${assignment.store.id} guardada exitosamente`);
          } catch (storeError) {
            console.error(`❌ Error guardando tienda ${assignment.store.id}:`, storeError);
          }
        }
      }
      console.log(`✅ ${assignments.length} asignaciones pre-cacheadas`);
      console.log(`✅ ${storesUpdated} tiendas actualizadas en db.stores`);
    }
  } catch (error) {
    console.error('❌ Error pre-cacheando asignaciones:', error);
    results.errors.push({ type: 'assignments', error: error.message });
  }

  // 4. Pre-cachear productos activos
  try {
    console.log('🛍️ Pre-cacheando productos activos...');
    const productsResponse = await ProductService.getActives();
    const products = productsResponse.data.result || [];
    results.products = products.length;
    console.log(`✅ ${products.length} productos pre-cacheados`);
  } catch (error) {
    console.error('❌ Error pre-cacheando productos:', error);
    results.errors.push({ type: 'products', error: error.message });
  }

  // 5. También ejecutar la sincronización vieja (para compatibilidad con código existente)
  try {
    await syncAllDataToLocal();
  } catch (error) {
    console.warn('⚠️ Error en sincronización legacy:', error);
  }

  console.log('✅ Pre-caché completado:', results);
  return results;
};

// ============================
// SUBIDA DE DATOS PENDIENTES (sincronización a servidor)
// ============================

/**
 * Sincroniza visitas pendientes con el servidor
 */
export const syncPendingVisits = async () => {
  const pendingVisits = await db.pendingVisits.where('synced').equals(0).toArray();

  if (pendingVisits.length === 0) {
    console.log('✅ No hay visitas pendientes de sincronizar');
    return { success: true, count: 0, errors: [] };
  }

  console.log(`📤 Sincronizando ${pendingVisits.length} visitas pendientes...`);

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const visit of pendingVisits) {
    try {
      // Intentar hacer check-in en el servidor
      const response = await VisitService.checkInByQr({
        qrCode: visit.qrCode,
        latitude: visit.latitude,
        longitude: visit.longitude
      });

      // Eliminar la visita de IndexedDB ya que fue sincronizada exitosamente
      await db.pendingVisits.delete(visit.id);

      results.success++;
      console.log(`✅ Visita ${visit.id} sincronizada con servidor (Visit ID: ${response.data.result?.id}) y eliminada de caché local`);
    } catch (error) {
      console.error(`❌ Error sincronizando visita ${visit.id}:, error`);

      // Incrementar contador de intentos
      const syncAttempts = (visit.syncAttempts || 0) + 1;
      await db.pendingVisits.update(visit.id, {
        syncAttempts,
        errorMessage: error.response?.data?.message || error.message,
        lastSyncAttempt: new Date().toISOString()
      });

      results.failed++;
      results.errors.push({
        visitId: visit.id,
        error: error.response?.data?.message || error.message
      });
    }
  }

  console.log(`📊 Visitas sincronizadas: ${results.success}, Fallidas: ${results.failed}`);
  return results;
};

/**
 * Sincroniza pedidos pendientes con el servidor
 */
export const syncPendingOrders = async () => {
  const pendingOrders = await db.pendingOrders.where('synced').equals(0).toArray();

  if (pendingOrders.length === 0) {
    console.log('✅ No hay pedidos pendientes de sincronizar');
    return { success: true, count: 0, errors: [], skipped: 0 };
  }

  console.log(`📤 Sincronizando ${pendingOrders.length} pedidos pendientes...`);

  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  for (const order of pendingOrders) {
    try {
      // Si no tiene visitId, intentar obtenerlo de la visita sincronizada
      let visitIdToUse = order.visitId;

      if (!visitIdToUse && order.storeId) {
        // Buscar si hay una visita sincronizada para esta tienda hoy
        const today = new Date().toISOString().split('T')[0];

        // Primero intentar obtener visitas del servidor
        try {
          const visitsResponse = await api.get(`/api/visits/today`);
          const todayVisits = visitsResponse.data.result || [];

          // Buscar visita de esta tienda
          const matchingVisit = todayVisits.find(v => v.store?.id === order.storeId);

          if (matchingVisit) {
            visitIdToUse = matchingVisit.id;
            console.log(`📎 Vinculando pedido ${order.id} con visita ${visitIdToUse}`);

            // Actualizar el pedido con el visitId encontrado
            await db.pendingOrders.update(order.id, {
              visitId: visitIdToUse
            });
          }
        } catch (visitError) {
          console.warn('No se pudo obtener visitas del servidor:', visitError);
        }
      }

      // Si aún no tenemos visitId, omitir por ahora
      if (!visitIdToUse) {
        console.warn(`⏭ Pedido ${order.id} omitido: Sin visitId disponible. Debe sincronizarse la visita primero.`);

        // Actualizar con mensaje de error
        await db.pendingOrders.update(order.id, {
          errorMessage: 'Sin visitId: la visita debe sincronizarse primero',
          lastSyncAttempt: new Date().toISOString()
        });

        results.skipped++;
        results.errors.push({
          orderId: order.id,
          error: 'Sin visitId disponible',
          canRetry: true
        });
        continue;
      }

      // Preparar items para el servidor
      const itemsForServer = order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price || item.unitPrice,
        notes: item.notes || ''
      }));

      // Crear pedido en el servidor (incluye offlineUniqueId para prevenir duplicados)
      const response = await api.post('/api/orders/', {
        visitId: visitIdToUse,
        items: itemsForServer,
        total: order.total,
        notes: order.notes || '',
        offlineUniqueId: order.offlineUniqueId // Enviar el ID único offline
      });

      // Eliminar el pedido de IndexedDB ya que fue sincronizado exitosamente
      await db.pendingOrders.delete(order.id);

      results.success++;
      console.log(`✅ Pedido ${order.id} sincronizado con servidor (Order ID: ${response.data.result?.id}) y eliminado de caché local`);
    } catch (error) {
      console.error(`❌ Error sincronizando pedido ${order.id}:, error`);

      // Incrementar contador de intentos
      const syncAttempts = (order.syncAttempts || 0) + 1;
      const errorMsg = error.response?.data?.message || error.message;

      await db.pendingOrders.update(order.id, {
        syncAttempts,
        errorMessage: errorMsg,
        lastSyncAttempt: new Date().toISOString()
      });

      results.failed++;
      results.errors.push({
        orderId: order.id,
        error: errorMsg,
        canRetry: syncAttempts < 5
      });
    }
  }

  console.log(`📊 Pedidos: ${results.success} sincronizados, ${results.failed} fallidos, ${results.skipped} omitidos`);
  return results;
};

/**
 * Sincroniza todos los datos pendientes
 * IMPORTANTE: Sincroniza visitas PRIMERO, luego pedidos
 */
export const syncAllPendingData = async () => {
  if (!isOnline()) {
    console.log('⚠ Sin conexión, no se puede sincronizar');
    return {
      success: false,
      message: 'Sin conexión a internet',
      visits: { success: 0, failed: 0 },
      orders: { success: 0, failed: 0, skipped: 0 }
    };
  }

  console.log('🔄 Sincronizando todos los datos pendientes...');

  // PASO 1: Sincronizar visitas primero
  console.log('📍 Paso 1/2: Sincronizando visitas...');
  const visits = await syncPendingVisits();

  // PASO 2: Sincronizar pedidos (ahora las visitas ya tienen IDs del servidor)
  console.log('📦 Paso 2/2: Sincronizando pedidos...');
  const orders = await syncPendingOrders();

  const totalSuccess = visits.success + orders.success;
  const totalFailed = visits.failed + orders.failed;
  const totalSkipped = orders.skipped || 0;

  console.log(`✅ Sincronización completa:`);
  console.log(`   - Éxitos: ${totalSuccess}`);
  console.log(`   - Fallos: ${totalFailed}`);
  console.log(`   - Omitidos: ${totalSkipped}`);

  return {
    success: totalFailed === 0 && totalSkipped === 0,
    visits,
    orders,
    totalSuccess,
    totalFailed,
    totalSkipped
  };
};

// ============================
// FUNCIONES DE UTILIDAD OFFLINE
// ============================

/**
 * Obtiene tiendas desde caché local (offline)
 */
export const getStoresFromCache = async () => {
  return await db.stores.toArray();
};

/**
 * Obtiene productos desde caché local (offline)
 */
export const getProductsFromCache = async () => {
  return await db.products.where('status').equals('ACTIVE').toArray();
};

/**
 * Obtiene asignaciones desde caché local (offline)
 */
export const getAssignmentsFromCache = async () => {
  return await db.assignments.where('status').equals('ACTIVE').toArray();
};

/**
 * Busca una tienda por QR en caché local
 */
export const getStoreByQrFromCache = async (qrCode) => {
  return await db.stores.where('qrCode').equals(qrCode).first();
};

/**
 * Verifica si hay datos disponibles offline
 */
export const hasOfflineData = async () => {
  const storesCount = await db.stores.count();
  const productsCount = await db.products.count();
  const assignmentsCount = await db.assignments.count();

  return {
    hasData: storesCount > 0 || productsCount > 0 || assignmentsCount > 0,
    stores: storesCount,
    products: productsCount,
    assignments: assignmentsCount
  };
};

/**
 * Auto-sincronización cuando se detecta conexión
 */
export const setupAutoSync = () => {
  window.addEventListener('online', async () => {
    console.log('🌐 Conexión restaurada, iniciando auto-sincronización...');
    try {
      await syncAllPendingData();
    } catch (error) {
      console.error('Error en auto-sincronización:', error);
    }
  });

  window.addEventListener('offline', () => {
    console.log('📡 Conexión perdida, modo offline activado');
  });
};

export default {
  // Descarga de datos
  syncAssignmentsToLocal,
  syncProductsToLocal,
  syncAllDataToLocal,

  // Subida de datos pendientes
  syncPendingVisits,
  syncPendingOrders,
  syncAllPendingData,

  // Utilidades offline
  getStoresFromCache,
  getProductsFromCache,
  getAssignmentsFromCache,
  getStoreByQrFromCache,
  hasOfflineData,
  setupAutoSync
};