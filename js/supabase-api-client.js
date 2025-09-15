/**
 * CLIENTE API SUPABASE PARA ESTUDIO ARTESANA
 * ==========================================
 * Cliente que conecta el frontend con la base de datos Supabase
 */

class SupabaseAPI {
    constructor() {
        // Configuración de Supabase
        this.baseUrl = 'https://yrmfrfpyqctvwyhrhivl.supabase.co';
        this.apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybWZyZnB5cWN0dnd5aHJoaXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTg5MzUsImV4cCI6MjA3MzUzNDkzNX0.qEijwK3FlnqXP2qw0gl438Tt-Rd1vrfts1cXslUuteU';
        
        // Headers para todas las peticiones
        this.headers = {
            'Content-Type': 'application/json',
            'apikey': this.apiKey,
            'Authorization': `Bearer ${this.apiKey}`
        };
        
        console.log('✅ SupabaseAPI inicializado');
    }

    // ==========================================
    // PRODUCTOS
    // ==========================================

    /**
     * Obtener todos los productos con paginación
     */
    async getProducts(page = 1, limit = 12) {
        try {
            console.log(`📦 Obteniendo productos (página ${page}, límite ${limit})`);
            
            const offset = (page - 1) * limit;
            
            // Usar la tabla products directa
            const response = await fetch(`${this.baseUrl}/rest/v1/products?order=created_at.desc&limit=${limit}&offset=${offset}`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const products = await response.json();
            
            // Obtener category_ids para cada producto
            const productsWithCategories = await Promise.all(
                products.map(async (product) => {
                    const categoryIds = await this.getProductCategoryIds(product.id);
                    return {
                        ...product,
                        category_ids: categoryIds
                    };
                })
            );
            
            // Transformar datos al formato que espera el frontend
            const transformedProducts = productsWithCategories.map(this.transformProduct.bind(this));
            
            console.log(`✅ ${transformedProducts.length} productos obtenidos`);
            
            return {
                products: transformedProducts,
                total: transformedProducts.length,
                page: page,
                totalPages: Math.ceil(transformedProducts.length / limit)
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo productos:', error);
            throw error;
        }
    }

    /**
     * Obtener un producto específico por ID
     */
    async getProduct(id) {
        try {
            console.log(`📦 Obteniendo producto ID: ${id}`);
            
            const response = await fetch(`${this.baseUrl}/rest/v1/products?id=eq.${id}&limit=1`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const products = await response.json();
            
            if (products.length === 0) {
                throw new Error('Producto no encontrado');
            }

            const product = this.transformProduct(products[0]);
            
            // Obtener variantes del producto
            const variants = await this.getProductVariants(id);
            product.variations = variants;
            
            console.log(`✅ Producto "${product.name}" obtenido`);
            return product;
            
        } catch (error) {
            console.error('❌ Error obteniendo producto:', error);
            throw error;
        }
    }

    /**
     * Buscar productos por término
     */
    async searchProducts(query, limit = 12) {
        try {
            console.log(`🔍 Buscando productos: "${query}"`);
            
            const response = await fetch(`${this.baseUrl}/rest/v1/products?or=(name.ilike.*${query}*,description.ilike.*${query}*)&limit=${limit}`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const products = await response.json();
            const transformedProducts = products.map(this.transformProduct.bind(this));
            
            console.log(`✅ ${transformedProducts.length} productos encontrados`);
            
            return {
                products: transformedProducts,
                total: transformedProducts.length
            };
            
        } catch (error) {
            console.error('❌ Error buscando productos:', error);
            throw error;
        }
    }

    /**
     * Obtener productos por categoría
     */
    async getProductsByCategory(categoryId, limit = 12) {
        try {
            console.log(`📂 Obteniendo productos de categoría: ${categoryId}`);
            
            const response = await fetch(`${this.baseUrl}/rest/v1/products?category_ids=cs.{${categoryId}}&limit=${limit}`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const products = await response.json();
            const transformedProducts = products.map(this.transformProduct.bind(this));
            
            console.log(`✅ ${transformedProducts.length} productos obtenidos de la categoría`);
            
            return {
                products: transformedProducts,
                total: transformedProducts.length
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo productos por categoría:', error);
            throw error;
        }
    }

    /**
     * Obtener productos relacionados (misma categoría, excluyendo el actual)
     */
    async getRelatedProducts(productId, limit = 4) {
        try {
            console.log(`🔗 Obteniendo productos relacionados para ID: ${productId}`);
            
            // Primero obtener las categorías del producto actual
            const currentProduct = await this.getProduct(productId);
            
            if (!currentProduct.categories || currentProduct.categories.length === 0) {
                return { products: [] };
            }
            
            // Obtener productos de las mismas categorías
            const categoryIds = currentProduct.category_ids.join(',');
            const response = await fetch(`${this.baseUrl}/rest/v1/products?category_ids=cs.{${categoryIds}}&id=not.eq.${productId}&limit=${limit}`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const products = await response.json();
            const transformedProducts = products.map(this.transformProduct.bind(this));
            
            console.log(`✅ ${transformedProducts.length} productos relacionados obtenidos`);
            
            return {
                products: transformedProducts
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo productos relacionados:', error);
            return { products: [] };
        }
    }

    // ==========================================
    // VARIANTES DE PRODUCTOS
    // ==========================================

    /**
     * Obtener variantes de un producto
     */
    async getProductVariants(productId) {
        try {
            const response = await fetch(`${this.baseUrl}/rest/v1/product_variants?product_id=eq.${productId}&is_active=eq.true&order=name`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const variants = await response.json();
            
            // Transformar al formato esperado por el frontend
            return variants.map(variant => ({
                id: variant.id,
                name: variant.name,
                price: variant.price,
                stock: variant.stock,
                image: variant.image_url,
                inStock: variant.stock > 0
            }));
            
        } catch (error) {
            console.error('❌ Error obteniendo variantes:', error);
            return [];
        }
    }

    /**
     * Obtener category_ids de un producto específico
     */
    async getProductCategoryIds(productId) {
        try {
            const response = await fetch(`${this.baseUrl}/rest/v1/product_categories?product_id=eq.${productId}`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                // Si no se pueden obtener categorías, devolver array vacío
                return [];
            }

            const relations = await response.json();
            return relations.map(rel => rel.category_id);
            
        } catch (error) {
            console.error('❌ Error obteniendo category_ids:', error);
            return [];
        }
    }

    // ==========================================
    // CATEGORÍAS
    // ==========================================

    /**
     * Obtener todas las categorías
     */
    async getCategories() {
        try {
            console.log('📂 Obteniendo categorías');
            
            const response = await fetch(`${this.baseUrl}/rest/v1/categories?is_active=eq.true&order=name`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const categories = await response.json();
            
            console.log(`✅ ${categories.length} categorías obtenidas`);
            
            return {
                categories: categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description,
                    image: cat.image_url
                }))
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo categorías:', error);
            throw error;
        }
    }

    // ==========================================
    // CARRITO DE COMPRAS (SIMULADO - LOCAL STORAGE)
    // ==========================================

    /**
     * Agregar item al carrito
     */
    async addToCart(productId, variantId = null, quantity = 1) {
        try {
            console.log(`🛒 Agregando al carrito: Producto ${productId}, Variante ${variantId}, Cantidad ${quantity}`);
            
            // Obtener datos del producto
            const product = await this.getProduct(productId);
            
            // Buscar la variante específica si se proporcionó
            let selectedVariant = null;
            if (variantId && product.variations) {
                selectedVariant = product.variations.find(v => v.id === variantId);
            }
            
            // Crear item del carrito
            const cartItem = {
                productId: productId,
                variantId: variantId,
                name: product.name,
                price: selectedVariant ? selectedVariant.price : product.price,
                quantity: quantity,
                image: selectedVariant?.image || product.mainImage,
                variant: selectedVariant?.name || 'Estándar',
                slug: product.slug
            };
            
            // Obtener carrito actual
            let cart = JSON.parse(localStorage.getItem('artesana_cart') || '[]');
            
            // Buscar si el item ya existe
            const existingIndex = cart.findIndex(item => 
                item.productId === productId && item.variantId === variantId
            );
            
            if (existingIndex >= 0) {
                // Actualizar cantidad
                cart[existingIndex].quantity += quantity;
            } else {
                // Agregar nuevo item
                cart.push(cartItem);
            }
            
            // Guardar carrito
            localStorage.setItem('artesana_cart', JSON.stringify(cart));
            
            console.log('✅ Item agregado al carrito');
            
            return {
                success: true,
                message: 'Producto agregado al carrito',
                cart: cart
            };
            
        } catch (error) {
            console.error('❌ Error agregando al carrito:', error);
            throw error;
        }
    }

    /**
     * Obtener items del carrito
     */
    getCart() {
        return JSON.parse(localStorage.getItem('artesana_cart') || '[]');
    }

    /**
     * Limpiar carrito
     */
    clearCart() {
        localStorage.removeItem('artesana_cart');
        return { success: true, message: 'Carrito vaciado' };
    }

    // ==========================================
    // UTILIDADES
    // ==========================================

    /**
     * Transformar producto de Supabase al formato del frontend
     */
    transformProduct(product) {
        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            shortDescription: product.short_description,
            price: product.price,
            regularPrice: product.regular_price,
            salePrice: product.sale_price,
            onSale: product.on_sale,
            type: product.type,
            status: product.status,
            featured: product.featured,
            inStock: product.in_stock,
            totalSales: product.total_sales,
            averageRating: product.average_rating,
            mainImage: this.processImageUrl(product.main_image_url),
            permalink: product.permalink,
            categories: product.categories || [],
            category_ids: product.category_ids || [],
            images: (product.images || []).map(img => this.processImageUrl(img)),
            createdAt: product.created_at
        };
    }

    /**
     * Procesar URLs de imágenes para manejar fallbacks
     */
    processImageUrl(imageUrl) {
        if (!imageUrl) {
            // Usar placeholder desde Supabase Storage
            return 'https://yrmfrfpyqctvwyhrhivl.supabase.co/storage/v1/object/public/product-images/placeholder-product.jpg';
        }
        
        // Si la imagen ya es local, mantenerla
        if (imageUrl.startsWith('assets/') || imageUrl.startsWith('./assets/')) {
            return imageUrl;
        }
        
        // Si es una URL de Supabase Storage, mantenerla
        if (imageUrl.includes('supabase.co/storage')) {
            return imageUrl;
        }
        
        // Para cualquier otra URL, retornarla tal como está
        return imageUrl;
    }

    /**
     * Verificar conexión con Supabase
     */
    async testConnection() {
        try {
            console.log('🔌 Verificando conexión con Supabase...');
            
            const response = await fetch(`${this.baseUrl}/rest/v1/products?limit=1`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Conexión con Supabase exitosa');
            return true;
            
        } catch (error) {
            console.error('❌ Error conectando con Supabase:', error);
            return false;
        }
    }
}

// ==========================================
// INICIALIZAR API GLOBAL
// ==========================================

// Crear instancia global
window.artesanaAPI = new SupabaseAPI();

// Verificar conexión al cargar
window.artesanaAPI.testConnection();

console.log('🚀 Supabase API Client cargado y disponible como window.artesanaAPI');
