import { db, isOnline } from '../db/db';

/**
 * Servicio de cache con estrategia Network First, then Cache
 *
 * Esta estrategia:
 * 1. Intenta obtener datos de la red primero
 * 2. Si tiene éxito, cachea la respuesta en IndexedDB
 * 3. Si falla (offline o error), busca en cache
 * 4. Retorna datos en formato compatible con axios (.data)
 */

// Nombre de la tabla de cache en IndexedDB
const CACHE_STORE = 'apiCache';

// Agregar tabla de cache al schema de Dexie
db.version(3).stores({
  users: 'id, role, name, token',
  stores: 'id, name, address, latitude, longitude, qrCode, status, lastSync',
  products: 'id, name, sku, unit, price, status, lastSync',
  assignments: '++id, assignmentId, storeId, productId, dealerId, status, lastSync',
  pendingVisits: '++id, storeId, qrCode, timestamp, latitude, longitude, synced, syncAttempts, errorMessage',
  pendingOrders: '++id, offlineUniqueId, visitId, storeId, items, total, createdAt, synced, syncAttempts, errorMessage',
  syncMetadata: 'key, lastSync, status',
  // Nueva tabla para cache de API
  apiCache: 'cacheKey, data, timestamp, url'
});

/**
 * Genera una clave única para el cache basada en la URL
 */
const generateCacheKey = (url, params = null) => {
  let key = url;
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    key = `${url}?${queryString}`;
  }
  return key;
};

/**
 * Guarda datos en el cache
 */
const saveToCache = async (cacheKey, data, url) => {
  try {
    await db.apiCache.put({
      cacheKey,
      data,
      timestamp: new Date().toISOString(),
      url
    });
    console.log(`💾 Cache guardado: ${cacheKey}`);
  } catch (error) {
    console.error('Error guardando en cache:', error);
  }
};

/**
 * Obtiene datos del cache
 */
const getFromCache = async (cacheKey) => {
  try {
    const cached = await db.apiCache.get(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit: ${cacheKey}`);
      return cached.data;
    }
    console.log(`❌ Cache miss: ${cacheKey}`);
    return null;
  } catch (error) {
    console.error('Error leyendo cache:', error);
    return null;
  }
};

/**
 * Limpia el cache (opcional - para desarrollo/debug)
 */
export const clearCache = async () => {
  try {
    await db.apiCache.clear();
    console.log('🗑️ Cache limpiado completamente');
  } catch (error) {
    console.error('Error limpiando cache:', error);
  }
};

/**
 * Elimina entradas de cache antiguas (más de X días)
 */
export const clearOldCache = async (days = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const oldEntries = await db.apiCache
      .where('timestamp')
      .below(cutoffDate.toISOString())
      .count();

    await db.apiCache
      .where('timestamp')
      .below(cutoffDate.toISOString())
      .delete();

    console.log(`🗑️ ${oldEntries} entradas de cache eliminadas (más de ${days} días)`);
  } catch (error) {
    console.error('Error limpiando cache antiguo:', error);
  }
};

/**
 * Wrapper para llamadas GET con estrategia Network First, then Cache
 *
 * @param {Function} networkCall - Función que hace la llamada de red (debe retornar una Promise de axios)
 * @param {string} url - URL del endpoint (para generar clave de cache)
 * @param {object} params - Parámetros de query (opcional)
 * @param {boolean} cacheFirst - Si es true, intenta cache primero (útil después de pre-cache)
 * @returns {Promise} - Promesa que resuelve con los datos (formato axios)
 */
export const networkFirstThenCache = async (networkCall, url, params = null, cacheFirst = false) => {
  const cacheKey = generateCacheKey(url, params);

  // Estrategia Cache First (cuando sabemos que el cache está fresco)
  if (cacheFirst && isOnline()) {
    console.log(`💾 Cache First activado: ${url}`);
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      console.log(`✅ Datos obtenidos del cache (cache-first): ${url}`);
      return {
        data: cachedData,
        status: 200,
        statusText: 'OK (from cache - cache first)',
        headers: {},
        config: {},
        fromCache: true
      };
    }
    console.log(`⚠️ No hay cache, intentando red: ${url}`);
  }

  // 1. Intentar red primero
  if (isOnline()) {
    try {
      console.log(`🌐 Intentando red: ${url}`);
      const response = await networkCall();

      // Guardar en cache si la respuesta fue exitosa
      if (response && response.data) {
        await saveToCache(cacheKey, response.data, url);
      }

      return response;
    } catch (error) {
      console.warn(`⚠️ Error de red, buscando en cache: ${url}`, error.message);

      // Si falla la red, buscar en cache
      const cachedData = await getFromCache(cacheKey);
      if (cachedData) {
        console.log(`✅ Datos obtenidos del cache: ${url}`);
        // Retornar en formato axios
        return {
          data: cachedData,
          status: 200,
          statusText: 'OK (from cache)',
          headers: {},
          config: {},
          fromCache: true
        };
      }

      // Si no hay cache, lanzar el error original
      throw error;
    }
  } else {
    // 2. Si estamos offline, ir directo al cache
    console.log(`📴 Offline, buscando en cache: ${url}`);
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
      console.log(`✅ Datos obtenidos del cache (offline): ${url}`);
      return {
        data: cachedData,
        status: 200,
        statusText: 'OK (from cache - offline)',
        headers: {},
        config: {},
        fromCache: true
      };
    }

    // Si no hay cache, lanzar error
    throw new Error(`No hay datos en cache para ${url} y estás offline`);
  }
};

/**
 * Invalida (elimina) una entrada específica del cache
 */
export const invalidateCache = async (url, params = null) => {
  const cacheKey = generateCacheKey(url, params);
  try {
    await db.apiCache.delete(cacheKey);
    console.log(`🗑️ Cache invalidado: ${cacheKey}`);
  } catch (error) {
    console.error('Error invalidando cache:', error);
  }
};

/**
 * Guarda datos directamente en el cache (sin llamada de red)
 * Útil para cachear items individuales cuando ya los tenemos de un listado
 */
export const saveToCacheDirectly = async (url, data) => {
  const cacheKey = generateCacheKey(url);
  await saveToCache(cacheKey, data, url);
};

/**
 * Cachea items individuales de un array
 * Por ejemplo, si tienes un array de visitas de /api/visits/today,
 * cachea cada visita como /api/visits/{id}
 */
export const cacheArrayItems = async (items, baseUrl, idField = 'id') => {
  if (!Array.isArray(items) || items.length === 0) return;

  console.log(`📦 Cacheando ${items.length} items individuales de ${baseUrl}...`);

  for (const item of items) {
    if (item && item[idField]) {
      const itemUrl = `${baseUrl}/${item[idField]}`;
      await saveToCacheDirectly(itemUrl, { result: item });
    }
  }

  console.log(`✅ ${items.length} items cacheados individualmente`);
};

/**
 * Obtiene estadísticas del cache
 */
export const getCacheStats = async () => {
  try {
    const total = await db.apiCache.count();
    const entries = await db.apiCache.toArray();

    return {
      total,
      entries: entries.map(e => ({
        url: e.url,
        timestamp: e.timestamp,
        size: JSON.stringify(e.data).length
      }))
    };
  } catch (error) {
    console.error('Error obteniendo stats del cache:', error);
    return { total: 0, entries: [] };
  }
};

export default {
  networkFirstThenCache,
  clearCache,
  clearOldCache,
  invalidateCache,
  getCacheStats,
  saveToCacheDirectly,
  cacheArrayItems
};
