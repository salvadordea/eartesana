/**
 * CLIENTE API SUPABASE CORREGIDO CON LÓGICA DE CATEGORÍAS
 * =======================================================
 * Versión corregida que implementa la lógica de categorías múltiples
 * usando el mismo enfoque exitoso del panel de administración
 */

class SupabaseAPIFixed {
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
        
        console.log('✅ SupabaseAPI (Fixed) inicializado');
    }

    // ==========================================
    // PRODUCTOS CON CATEGORÍAS CORREGIDAS
    // ==========================================

    /**
     * Obtener todos los productos con categorías usando JOIN manual
     */
    async getProducts(page = 1, limit = 12) {
        try {
            console.log(`📦 Obteniendo productos con categorías (página ${page}, límite ${limit})`);
            
            // Obtener productos con categorías usando la lógica corregida
            const productsWithCategories = await this.getProductsWithCategoriesJoin();
            
            // Aplicar paginación
            const offset = (page - 1) * limit;
            const paginatedProducts = productsWithCategories.slice(offset, offset + limit);

            // Transformar al formato esperado por el frontend con stock calculado
            const transformedProducts = await Promise.all(
                paginatedProducts.map(product => this.transformProductAsync(product))
            );
            
            console.log(`✅ ${transformedProducts.length} productos obtenidos con categorías`);
            console.log('🔍 EJEMPLO - Primer producto:', transformedProducts[0]);
            
            return {
                products: transformedProducts,
                total: productsWithCategories.length,
                page: page,
                totalPages: Math.ceil(productsWithCategories.length / limit)
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo productos:', error);
            throw error;
        }
    }

    /**
     * Obtener productos usando query directa optimizada (batch category loading)
     */
    async getProductsWithCategoriesJoin() {
        try {
            console.log('🔄 Obteniendo productos con query optimizada...');

            // Query básica siguiendo patrón mayoristas
            const url = `${this.baseUrl}/rest/v1/products?select=id,name,price,total_stock,has_variants,main_image_url,description,slug&status=eq.active&order=name`;

            console.log('🔗 URL Query:', url);

            const productsResponse = await fetch(url, {
                method: 'GET',
                headers: this.headers
            });

            if (!productsResponse.ok) {
                const errorText = await productsResponse.text();
                console.error('❌ Error response:', errorText);
                throw new Error(`Error obteniendo productos: ${productsResponse.status} - ${errorText}`);
            }

            const products = await productsResponse.json();
            console.log(`📦 ${products.length} productos obtenidos`);

            // OPTIMIZACIÓN: Cargar todas las relaciones producto-categoría en una sola query
            try {
                const batchCategoryUrl = `${this.baseUrl}/rest/v1/product_categories?select=product_id,categories(id,name,slug)`;

                const batchResponse = await fetch(batchCategoryUrl, {
                    method: 'GET',
                    headers: this.headers
                });

                if (batchResponse.ok) {
                    const allProductCategories = await batchResponse.json();

                    // Crear mapa de categorías por producto
                    const categoryMap = new Map();
                    allProductCategories.forEach(pc => {
                        if (!categoryMap.has(pc.product_id)) {
                            categoryMap.set(pc.product_id, {
                                categories: [],
                                category_ids: []
                            });
                        }
                        categoryMap.get(pc.product_id).categories.push(pc.categories.name);
                        categoryMap.get(pc.product_id).category_ids.push(pc.categories.id);
                    });

                    // Asignar categorías a cada producto
                    products.forEach(product => {
                        const productCats = categoryMap.get(product.id);
                        if (productCats) {
                            product.categories = productCats.categories;
                            product.category_ids = productCats.category_ids;
                        } else {
                            product.categories = [];
                            product.category_ids = [];
                        }
                    });

                    console.log('✅ Categorías cargadas en batch mode');
                } else {
                    console.warn('⚠️ Error cargando categorías en batch, usando fallback individual');
                    // Fallback al método anterior solo si falla el batch
                    await this.loadCategoriesIndividually(products);
                }
            } catch (error) {
                console.warn('⚠️ Error en batch loading, usando fallback:', error);
                await this.loadCategoriesIndividually(products);
            }

            // LOAD PRODUCT TRANSLATIONS
            try {
                const translationsUrl = `${this.baseUrl}/rest/v1/product_translations?select=product_id,language_code,name,description,short_description`;

                const translationsResponse = await fetch(translationsUrl, {
                    method: 'GET',
                    headers: this.headers
                });

                if (translationsResponse.ok) {
                    const allTranslations = await translationsResponse.json();

                    // Create translation map by product_id and language_code
                    const translationMap = new Map();
                    allTranslations.forEach(trans => {
                        if (!translationMap.has(trans.product_id)) {
                            translationMap.set(trans.product_id, {});
                        }
                        translationMap.get(trans.product_id)[trans.language_code] = {
                            name: trans.name,
                            description: trans.description,
                            short_description: trans.short_description
                        };
                    });

                    // Assign translations to each product
                    products.forEach(product => {
                        const productTranslations = translationMap.get(product.id);
                        if (productTranslations) {
                            product.translations = productTranslations;
                        } else {
                            product.translations = {};
                        }
                    });

                    console.log('✅ Product translations loaded');
                    // Log sample product with translations
                    if (products.length > 0) {
                        console.log('🔍 Sample product with translations:', {
                            id: products[0].id,
                            name: products[0].name,
                            translations: products[0].translations
                        });
                    }
                } else {
                    console.warn('⚠️ Error loading product translations:', translationsResponse.status);
                }
            } catch (error) {
                console.warn('⚠️ Error loading translations:', error);
            }

            console.log('🔍 DIAGNÓSTICO - Producto ejemplo con categorías:', products[0]);
            return products;

        } catch (error) {
            console.error('❌ Error obteniendo productos con query directa:', error);
            throw error;
        }
    }

    /**
     * Fallback method for individual category loading
     */
    async loadCategoriesIndividually(products) {
        for (let product of products) {
            try {
                const categoryUrl = `${this.baseUrl}/rest/v1/product_categories?select=categories(id,name,slug)&product_id=eq.${product.id}`;

                const categoriesResponse = await fetch(categoryUrl, {
                    method: 'GET',
                    headers: this.headers
                });

                if (categoriesResponse.ok) {
                    const productCategories = await categoriesResponse.json();

                    if (productCategories && productCategories.length > 0) {
                        product.categories = productCategories.map(pc => pc.categories.name);
                        product.category_ids = productCategories.map(pc => pc.categories.id);
                    } else {
                        product.categories = [];
                        product.category_ids = [];
                    }
                } else {
                    product.categories = [];
                    product.category_ids = [];
                }
            } catch (error) {
                console.warn(`⚠️ Error cargando categorías para producto ${product.id}:`, error);
                product.categories = [];
                product.category_ids = [];
            }
        }
    }

    /**
     * Obtener un producto específico con sus categorías
     */
    async getProduct(id) {
        try {
            console.log(`📦 Obteniendo producto ID: ${id}`);
            
            // Obtener todos los productos con categorías
            const productsWithCategories = await this.getProductsWithCategoriesJoin();
            
            // Buscar el producto específico
            const product = productsWithCategories.find(p => p.id == id);
            
            if (!product) {
                throw new Error('Producto no encontrado');
            }

            // Transformar al formato esperado
            let transformedProduct = await this.transformProductAsync(product);
            
            // Obtener variantes del producto
            const variants = await this.getProductVariants(id);
            transformedProduct.variations = variants;
            
            console.log(`✅ Producto "${transformedProduct.name}" obtenido con categorías`);
            return transformedProduct;
            
        } catch (error) {
            console.error('❌ Error obteniendo producto:', error);
            throw error;
        }
    }

    /**
     * Buscar productos por término (incluye búsqueda en categorías)
     */
    async searchProducts(query, limit = 12) {
        try {
            console.log(`🔍 Buscando productos: "${query}"`);
            
            // Obtener todos los productos con categorías
            const productsWithCategories = await this.getProductsWithCategoriesJoin();
            
            // Filtrar productos que coincidan con el término de búsqueda
            const searchTerm = query.toLowerCase();
            const filteredProducts = productsWithCategories.filter(product => {
                const matchName = product.name.toLowerCase().includes(searchTerm);
                const matchDescription = product.description && product.description.toLowerCase().includes(searchTerm);
                const matchCategories = product.category_names.toLowerCase().includes(searchTerm);
                
                return matchName || matchDescription || matchCategories;
            });

            // Aplicar límite
            const limitedProducts = filteredProducts.slice(0, limit);
            
            // Transformar al formato esperado
            const transformedProducts = await Promise.all(
                limitedProducts.map(product => this.transformProductAsync(product))
            );
            
            console.log(`✅ ${transformedProducts.length} productos encontrados`);
            
            return {
                products: transformedProducts,
                total: filteredProducts.length
            };
            
        } catch (error) {
            console.error('❌ Error buscando productos:', error);
            throw error;
        }
    }

    /**
     * Obtener productos por categoría usando la nueva lógica
     */
    async getProductsByCategory(categoryName, limit = 12) {
        try {
            console.log(`📂 Obteniendo productos de categoría: "${categoryName}"`);
            
            // Obtener todos los productos con categorías
            const productsWithCategories = await this.getProductsWithCategoriesJoin();
            
            // Filtrar productos que pertenezcan a la categoría
            const categoryProducts = productsWithCategories.filter(product => {
                return product.categories && product.categories.includes(categoryName);
            });

            // Aplicar límite
            const limitedProducts = categoryProducts.slice(0, limit);
            
            // Transformar al formato esperado
            const transformedProducts = await Promise.all(
                limitedProducts.map(product => this.transformProductAsync(product))
            );
            
            console.log(`✅ ${transformedProducts.length} productos obtenidos de la categoría "${categoryName}"`);
            
            return {
                products: transformedProducts,
                total: categoryProducts.length
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo productos por categoría:', error);
            throw error;
        }
    }

    /**
     * Obtener productos relacionados basados en categorías compartidas
     */
    async getRelatedProducts(productId, limit = 4) {
        try {
            console.log(`🔗 Obteniendo productos relacionados para ID: ${productId}`);
            
            // Obtener el producto actual
            const currentProduct = await this.getProduct(productId);
            
            if (!currentProduct.categories || currentProduct.categories.length === 0) {
                return { products: [] };
            }

            // Obtener todos los productos con categorías
            const productsWithCategories = await this.getProductsWithCategoriesJoin();
            
            // Filtrar productos que compartan al menos una categoría (excluyendo el actual)
            const relatedProducts = productsWithCategories
                .filter(product => product.id != productId) // Excluir el producto actual
                .filter(product => {
                    // Verificar si comparte alguna categoría
                    const hasSharedCategory = currentProduct.categories.some(category => 
                        product.categories && product.categories.includes(category)
                    );
                    return hasSharedCategory;
                })
                .slice(0, limit); // Aplicar límite
            
            // Transformar al formato esperado
            const transformedProducts = await Promise.all(
                relatedProducts.map(product => this.transformProductAsync(product))
            );
            
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
    // CATEGORÍAS
    // ==========================================

    /**
     * Obtener todas las categorías activas
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

            // LOAD CATEGORY TRANSLATIONS
            try {
                const translationsUrl = `${this.baseUrl}/rest/v1/category_translations?select=category_id,language_code,name,description`;

                const translationsResponse = await fetch(translationsUrl, {
                    method: 'GET',
                    headers: this.headers
                });

                if (translationsResponse.ok) {
                    const allTranslations = await translationsResponse.json();

                    // Create translation map by category_id and language_code
                    const translationMap = new Map();
                    allTranslations.forEach(trans => {
                        if (!translationMap.has(trans.category_id)) {
                            translationMap.set(trans.category_id, {});
                        }
                        translationMap.get(trans.category_id)[trans.language_code] = {
                            name: trans.name,
                            description: trans.description
                        };
                    });

                    // Assign translations to each category
                    categories.forEach(category => {
                        const categoryTranslations = translationMap.get(category.id);
                        if (categoryTranslations) {
                            category.translations = categoryTranslations;
                        } else {
                            category.translations = {};
                        }
                    });

                    console.log('✅ Category translations loaded');
                } else {
                    console.warn('⚠️ Error loading category translations');
                }
            } catch (error) {
                console.warn('⚠️ Error loading category translations:', error);
            }

            return {
                categories: categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    description: cat.description,
                    image: cat.image_url,
                    translations: cat.translations || {}
                }))
            };

        } catch (error) {
            console.error('❌ Error obteniendo categorías:', error);
            throw error;
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

    // ==========================================
    // UTILIDADES
    // ==========================================

    /**
     * Calcular stock total incluyendo variantes
     */
    async calculateTotalStock(product) {
        console.log(`🔢 Calculating stock for product: ${product.name}`);
        console.log(`🔍 Product details:`, {
            id: product.id,
            name: product.name,
            status: product.status,
            has_variants: product.has_variants,
            total_stock: product.total_stock,
            total_stock_type: typeof product.total_stock,
            is_total_stock_null: product.total_stock === null,
            is_total_stock_undefined: product.total_stock === undefined
        });

        if (!product.has_variants) {
            // For simple products, be more aggressive with fallbacks
            let stock = 0;

            if (product.total_stock !== null && product.total_stock !== undefined) {
                stock = parseInt(product.total_stock) || 0;
            }

            // Only assign fallback stock if total_stock is null/undefined (missing data)
            // Don't assign fallback for products that legitimately have 0 stock
            if (stock === 0 && product.total_stock === null && (product.status === 'publish' || product.status === 'published')) {
                stock = 1; // Minimal fallback stock for products with missing data
                console.log(`📦 Assigning fallback stock (${stock}) to published product with null stock data`);
            }

            console.log(`📦 Simple product final stock: ${stock} (original: ${product.total_stock})`);
            return stock;
        }

        try {
            // Si tiene variantes, sumar stock de todas las variantes activas
            const variantsResponse = await fetch(`${this.baseUrl}/rest/v1/product_variants?select=stock&product_id=eq.${product.id}&is_active=eq.true`, {
                method: 'GET',
                headers: this.headers
            });

            if (variantsResponse.ok) {
                const variants = await variantsResponse.json();
                console.log(`🔍 Found ${variants.length} active variants`);

                const totalVariantStock = variants.reduce((sum, variant) => {
                    const variantStock = parseInt(variant.stock) || 0;
                    console.log(`🔹 Variant stock: ${variantStock} (raw: ${variant.stock})`);
                    return sum + variantStock;
                }, 0);
                console.log(`🔢 Producto ${product.name}: stock total de variantes = ${totalVariantStock}`);

                // Only provide fallback stock if there are NO variants but product claims to have variants
                // (this indicates missing data, not legitimate 0 stock)
                if (variants.length === 0 && (product.status === 'publish' || product.status === 'published')) {
                    console.log(`📦 No active variants found but product claims to have variants, assigning fallback stock of 1`);
                    return 1;
                }

                return totalVariantStock;
            } else {
                console.warn(`⚠️ No se pudieron cargar variantes para producto ${product.id}, usando stock base`);
                // Use actual total_stock or 0 (no artificial stock assignment)
                const fallbackStock = parseInt(product.total_stock) || 0;
                console.log(`📦 API error fallback stock: ${fallbackStock} (product status: ${product.status})`);
                return fallbackStock;
            }
        } catch (error) {
            console.error(`❌ Error calculando stock de variantes para producto ${product.id}:`, error);
            // Use actual total_stock or 0 (no artificial stock assignment)
            const errorFallbackStock = parseInt(product.total_stock) || 0;
            console.log(`📦 Error fallback stock: ${errorFallbackStock} (product status: ${product.status})`);
            return errorFallbackStock;
        }
    }

    /**
     * Transformar producto al formato del frontend con stock calculado
     */
    async transformProductAsync(product) {
        const calculatedStock = await this.calculateTotalStock(product);

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
            // Proper stock handling with variant support
            totalStock: calculatedStock,
            hasVariants: product.has_variants || false,
            totalSales: product.total_sales || 0,
            averageRating: product.average_rating || 4.8,
            mainImage: this.processImageUrl(product.main_image_url),
            permalink: product.permalink,
            categories: product.categories || [],
            category_ids: product.category_ids || [],
            // Para compatibilidad con la lógica de frontend
            category_id: product.category_ids && product.category_ids.length > 0 ? product.category_ids[0] : null,
            images: (product.images || []).map(img => this.processImageUrl(img)),
            createdAt: product.created_at,
            // Include translations for multi-language support
            translations: product.translations || {}
        };
    }

    /**
     * Transformar producto al formato del frontend (versión síncrona)
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
            // Proper stock handling with variant support (follows mayoristas pattern)
            totalStock: product.calculated_stock || product.total_stock || 0,
            hasVariants: product.has_variants || false,
            totalSales: product.total_sales || 0,
            averageRating: product.average_rating || 4.8,
            mainImage: this.processImageUrl(product.main_image_url),
            permalink: product.permalink,
            categories: product.categories || [],
            category_ids: product.category_ids || [],
            // Para compatibilidad con la lógica de frontend
            category_id: product.category_ids && product.category_ids.length > 0 ? product.category_ids[0] : null,
            images: (product.images || []).map(img => this.processImageUrl(img)),
            createdAt: product.created_at
        };
    }

    /**
     * Procesar URLs de imágenes
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

    // ==========================================
    // CARRITO DE COMPRAS (LOCAL STORAGE)
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
}

// Inicializar el API corregido
window.artesanaAPI = new SupabaseAPIFixed();

console.log('🔧 Cliente API Supabase CORREGIDO cargado - Listo para manejar categorías múltiples');
