/**
 * WooCommerce Complete Backup System
 * Extrae y respalda todos los datos de WooCommerce antes de migración
 */

const WooCommerceRestApi = require('@woocommerce/woocommerce-rest-api').default;
const fs = require('fs').promises;
const path = require('path');

// Configuración - ACTUALIZAR CON TUS CREDENCIALES
const config = {
  woocommerce: {
    url: 'https://estudioartesana.com',
    consumerKey: 'ck_80b6b30ea578209890fd8725ab30cc53402185bc',
    consumerSecret: 'cs_b8a197caa4c8f71a9aa351ef867ee4b147f525a5',
    version: 'wc/v3',
    queryStringAuth: true // Para HTTPS
  },
  backup: {
    outputDir: './backup-data',
    batchSize: 100,
    delayBetweenRequests: 1000, // 1 segundo entre requests
    maxRetries: 3,
    includeImages: true,
    createTimestamp: true
  }
};

class WooCommerceBackup {
  constructor() {
    this.api = new WooCommerceRestApi(config.woocommerce);
    this.backupDir = config.backup.outputDir;
    this.timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    this.stats = {
      products: 0,
      categories: 0,
      orders: 0,
      customers: 0,
      errors: [],
      startTime: new Date(),
      endTime: null
    };
  }

  // Crear directorio de backup
  async setupBackupDirectory() {
    const timestampedDir = `${this.backupDir}/${this.timestamp}`;
    
    try {
      await fs.mkdir(timestampedDir, { recursive: true });
      await fs.mkdir(`${timestampedDir}/products`, { recursive: true });
      await fs.mkdir(`${timestampedDir}/categories`, { recursive: true });
      await fs.mkdir(`${timestampedDir}/orders`, { recursive: true });
      await fs.mkdir(`${timestampedDir}/customers`, { recursive: true });
      await fs.mkdir(`${timestampedDir}/media`, { recursive: true });
      await fs.mkdir(`${timestampedDir}/settings`, { recursive: true });
      await fs.mkdir(`${timestampedDir}/logs`, { recursive: true });
      
      this.backupDir = timestampedDir;
      console.log(`✅ Directorio de backup creado: ${timestampedDir}`);
    } catch (error) {
      console.error('❌ Error creando directorio de backup:', error);
      throw error;
    }
  }

  // Función genérica para paginación automática
  async getAllData(endpoint, params = {}) {
    const allData = [];
    let page = 1;
    let hasMore = true;
    
    console.log(`📥 Extrayendo datos de ${endpoint}...`);
    
    while (hasMore) {
      try {
        const response = await this.apiRequest(endpoint, {
          ...params,
          page: page,
          per_page: config.backup.batchSize
        });
        
        if (response.data && response.data.length > 0) {
          allData.push(...response.data);
          console.log(`   📄 Página ${page}: ${response.data.length} registros`);
          page++;
          
          // Verificar si hay más páginas
          const totalPages = parseInt(response.headers['x-wp-totalpages']) || 1;
          hasMore = page <= totalPages;
          
          // Delay entre requests para no saturar el servidor
          if (hasMore) {
            await this.delay(config.backup.delayBetweenRequests);
          }
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error(`❌ Error en página ${page} de ${endpoint}:`, error.message);
        this.stats.errors.push(`${endpoint} - Página ${page}: ${error.message}`);
        
        if (error.response?.status === 404 || error.response?.status === 401) {
          break; // No continuar si hay error de autenticación
        }
        
        hasMore = false;
      }
    }
    
    console.log(`✅ ${endpoint}: ${allData.length} registros extraídos`);
    return allData;
  }

  // Request con retry logic
  async apiRequest(endpoint, params, retryCount = 0) {
    try {
      return await this.api.get(endpoint, params);
    } catch (error) {
      if (retryCount < config.backup.maxRetries) {
        console.log(`🔄 Reintentando ${endpoint} (${retryCount + 1}/${config.backup.maxRetries})`);
        await this.delay(2000 * (retryCount + 1)); // Backoff exponencial
        return await this.apiRequest(endpoint, params, retryCount + 1);
      }
      throw error;
    }
  }

  // Backup completo de productos
  async backupProducts() {
    console.log('\n🛍️  RESPALDANDO PRODUCTOS...');
    
    const products = await this.getAllData('products', {
      status: 'any' // Incluir todos los estados
      // Removido type: 'any' - causa error 400 (no es válido)
      // El API incluye todos los tipos por defecto
    });
    
    this.stats.products = products.length;
    
    // Guardar archivo principal
    await this.saveToFile('products/all-products.json', products);
    
    // Separar por categorías para análisis
    const productsByCategory = {};
    products.forEach(product => {
      if (product.categories && product.categories.length > 0) {
        product.categories.forEach(category => {
          if (!productsByCategory[category.slug]) {
            productsByCategory[category.slug] = [];
          }
          productsByCategory[category.slug].push(product);
        });
      } else {
        // Productos sin categoría
        if (!productsByCategory['uncategorized']) {
          productsByCategory['uncategorized'] = [];
        }
        productsByCategory['uncategorized'].push(product);
      }
    });
    
    // Guardar por categorías
    for (const [categorySlug, categoryProducts] of Object.entries(productsByCategory)) {
      await this.saveToFile(`products/by-category-${categorySlug}.json`, categoryProducts);
    }
    
    // Extraer información de imágenes
    if (config.backup.includeImages) {
      const imageUrls = [];
      products.forEach(product => {
        if (product.images && product.images.length > 0) {
          product.images.forEach(image => {
            imageUrls.push({
              productId: product.id,
              productName: product.name,
              imageId: image.id,
              src: image.src,
              alt: image.alt,
              position: image.position
            });
          });
        }
      });
      
      await this.saveToFile('media/product-images.json', imageUrls);
      console.log(`📸 ${imageUrls.length} URLs de imágenes extraídas`);
    }
    
    console.log(`✅ Productos respaldados: ${products.length}`);
  }

  // Backup de categorías
  async backupCategories() {
    console.log('\n📂 RESPALDANDO CATEGORÍAS...');
    
    const categories = await this.getAllData('products/categories', {
      hide_empty: false,
      parent: 0 // Primero las principales
    });
    
    // Obtener también subcategorías
    const allCategories = await this.getAllData('products/categories', {
      hide_empty: false
    });
    
    this.stats.categories = allCategories.length;
    
    await this.saveToFile('categories/all-categories.json', allCategories);
    await this.saveToFile('categories/main-categories.json', categories);
    
    // Crear estructura jerárquica
    const hierarchy = this.buildCategoryHierarchy(allCategories);
    await this.saveToFile('categories/category-hierarchy.json', hierarchy);
    
    console.log(`✅ Categorías respaldadas: ${allCategories.length}`);
  }

  // Backup de órdenes (últimas 500 para no sobrecargar)
  async backupOrders() {
    console.log('\n📋 RESPALDANDO ÓRDENES...');
    
    try {
      const orders = await this.getAllData('orders', {
        per_page: 50, // Menos órdenes para evitar problemas
        orderby: 'date',
        order: 'desc'
      });
      
      this.stats.orders = orders.length;
      
      await this.saveToFile('orders/recent-orders.json', orders);
      
      // Estadísticas de órdenes
      const orderStats = {
        total: orders.length,
        byStatus: {},
        totalRevenue: 0,
        averageOrder: 0
      };
      
      orders.forEach(order => {
        orderStats.byStatus[order.status] = (orderStats.byStatus[order.status] || 0) + 1;
        orderStats.totalRevenue += parseFloat(order.total || 0);
      });
      
      orderStats.averageOrder = orders.length > 0 ? orderStats.totalRevenue / orders.length : 0;
      
      await this.saveToFile('orders/order-statistics.json', orderStats);
      
      console.log(`✅ Órdenes respaldadas: ${orders.length}`);
    } catch (error) {
      console.log('⚠️  Órdenes no accesibles (posible restricción de permisos)');
      this.stats.errors.push(`Orders: ${error.message}`);
    }
  }

  // Backup de clientes (si es accesible)
  async backupCustomers() {
    console.log('\n👥 RESPALDANDO CLIENTES...');
    
    try {
      const customers = await this.getAllData('customers', {
        per_page: 100
      });
      
      this.stats.customers = customers.length;
      
      // Limpiar datos sensibles antes de guardar
      const sanitizedCustomers = customers.map(customer => ({
        id: customer.id,
        email: customer.email?.replace(/(.{3}).*(@.*)/, '$1***$2'), // Ofuscar email
        first_name: customer.first_name,
        last_name: customer.last_name,
        username: customer.username,
        date_created: customer.date_created,
        orders_count: customer.orders_count,
        total_spent: customer.total_spent,
        billing: customer.billing ? {
          city: customer.billing.city,
          state: customer.billing.state,
          country: customer.billing.country
        } : null
      }));
      
      await this.saveToFile('customers/customers-sanitized.json', sanitizedCustomers);
      
      console.log(`✅ Clientes respaldados: ${customers.length} (datos sanitizados)`);
    } catch (error) {
      console.log('⚠️  Clientes no accesibles (posible restricción de permisos)');
      this.stats.errors.push(`Customers: ${error.message}`);
    }
  }

  // Backup de configuraciones WooCommerce
  async backupSettings() {
    console.log('\n⚙️  RESPALDANDO CONFIGURACIONES...');
    
    try {
      // Configuraciones generales
      const settings = await this.api.get('settings');
      await this.saveToFile('settings/woocommerce-settings.json', settings.data);
      
      // Métodos de pago
      const paymentMethods = await this.api.get('payment_gateways');
      await this.saveToFile('settings/payment-methods.json', paymentMethods.data);
      
      // Métodos de envío
      const shippingZones = await this.api.get('shipping/zones');
      await this.saveToFile('settings/shipping-zones.json', shippingZones.data);
      
      console.log('✅ Configuraciones respaldadas');
    } catch (error) {
      console.log('⚠️  Configuraciones no completamente accesibles');
      this.stats.errors.push(`Settings: ${error.message}`);
    }
  }

  // Construir jerarquía de categorías
  buildCategoryHierarchy(categories) {
    const hierarchy = [];
    const categoryMap = {};
    
    // Crear mapa de categorías
    categories.forEach(cat => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });
    
    // Construir jerarquía
    categories.forEach(cat => {
      if (cat.parent === 0) {
        hierarchy.push(categoryMap[cat.id]);
      } else if (categoryMap[cat.parent]) {
        categoryMap[cat.parent].children.push(categoryMap[cat.id]);
      }
    });
    
    return hierarchy;
  }

  // Guardar archivo con manejo de errores
  async saveToFile(filename, data) {
    try {
      const filePath = path.join(this.backupDir, filename);
      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, jsonData, 'utf8');
      console.log(`💾 Guardado: ${filename}`);
    } catch (error) {
      console.error(`❌ Error guardando ${filename}:`, error);
      this.stats.errors.push(`File save ${filename}: ${error.message}`);
    }
  }

  // Generar reporte final
  async generateReport() {
    this.stats.endTime = new Date();
    this.stats.duration = Math.round((this.stats.endTime - this.stats.startTime) / 1000);
    
    const report = {
      backup: {
        timestamp: this.timestamp,
        duration: `${this.stats.duration} segundos`,
        source: config.woocommerce.url
      },
      summary: {
        products: this.stats.products,
        categories: this.stats.categories,
        orders: this.stats.orders,
        customers: this.stats.customers,
        totalErrors: this.stats.errors.length
      },
      errors: this.stats.errors,
      recommendations: [
        'Verificar que todos los datos críticos fueron extraídos',
        'Hacer backup manual de la base de datos WordPress como respaldo adicional',
        'Probar la carga de datos en sistema de pruebas antes de migración',
        'Guardar este backup en múltiples ubicaciones (local, cloud)'
      ]
    };
    
    await this.saveToFile('backup-report.json', report);
    
    // Mostrar resumen en consola
    console.log('\n📊 RESUMEN DEL BACKUP:');
    console.log('====================');
    console.log(`🕒 Duración: ${this.stats.duration} segundos`);
    console.log(`📦 Productos: ${this.stats.products}`);
    console.log(`📂 Categorías: ${this.stats.categories}`);
    console.log(`📋 Órdenes: ${this.stats.orders}`);
    console.log(`👥 Clientes: ${this.stats.customers}`);
    console.log(`❌ Errores: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  ERRORES ENCONTRADOS:');
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log(`\n💾 Backup guardado en: ${this.backupDir}`);
  }

  // Utilidad para delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Función principal
  async execute() {
    console.log('🚀 INICIANDO BACKUP COMPLETO DE WOOCOMMERCE');
    console.log(`🌍 Fuente: ${config.woocommerce.url}`);
    console.log(`📅 Fecha: ${new Date().toLocaleString()}\n`);
    
    try {
      await this.setupBackupDirectory();
      
      // Ejecutar backups en paralelo para eficiencia
      await Promise.allSettled([
        this.backupProducts(),
        this.backupCategories(),
        this.backupOrders(),
        this.backupCustomers(),
        this.backupSettings()
      ]);
      
      await this.generateReport();
      
      console.log('\n🎉 BACKUP COMPLETADO EXITOSAMENTE!');
      
    } catch (error) {
      console.error('\n💥 ERROR CRÍTICO EN BACKUP:', error);
      this.stats.errors.push(`Critical: ${error.message}`);
      await this.generateReport();
    }
  }
}

// Ejecutar backup si se llama directamente
if (require.main === module) {
  const backup = new WooCommerceBackup();
  backup.execute().catch(console.error);
}

module.exports = WooCommerceBackup;
