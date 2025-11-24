// =====================================================
// SHIPPING CALCULATOR - Frontend Module
// =====================================================
// Calcula costos de envío usando Envia.com API
// Integrado con checkout.html y carrito de compras
//
// Autor: Estudio Artesana
// Fecha: 2025-01-23
// =====================================================

class ShippingCalculator {
    constructor(config = {}) {
        // Configuración del servicio backend
        this.backendUrl = config.backendUrl || 'http://localhost:3001';
        this.shippingEndpoint = '/api/shipping/quote';

        // Código postal de origen (tu bodega)
        this.originZipCode = config.originZipCode || '01000';

        // Cache para evitar múltiples llamadas con los mismos datos
        this.quoteCache = new Map();
        this.cacheTTL = 1000 * 60 * 30; // 30 minutos

        // Estado
        this.isLoading = false;
        this.lastQuote = null;
        this.selectedCarrier = null;

        console.log('✅ ShippingCalculator inicializado');
    }

    /**
     * Calcula el peso total del carrito en gramos
     * @param {Array} cartItems - Items del carrito
     * @returns {number} Peso total en gramos
     */
    calculateTotalWeight(cartItems) {
        if (!cartItems || cartItems.length === 0) {
            console.warn('⚠️ Carrito vacío, usando peso por defecto');
            return 500; // Peso por defecto en gramos
        }

        let totalWeight = 0;
        cartItems.forEach(item => {
            const itemWeight = item.weight || 100; // 100g por defecto si no tiene peso
            const quantity = item.quantity || 1;
            totalWeight += itemWeight * quantity;
        });

        console.log(`📦 Peso total del carrito: ${totalWeight}g`);
        return totalWeight;
    }

    /**
     * Genera una clave única para el cache
     */
    getCacheKey(destinationZip, weight) {
        return `${destinationZip}-${weight}`;
    }

    /**
     * Obtiene una cotización del cache si existe y no ha expirado
     */
    getCachedQuote(destinationZip, weight) {
        const key = this.getCacheKey(destinationZip, weight);
        const cached = this.quoteCache.get(key);

        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > this.cacheTTL) {
            // Cache expirado
            this.quoteCache.delete(key);
            return null;
        }

        console.log('💾 Cotización obtenida del cache');
        return cached.data;
    }

    /**
     * Guarda una cotización en el cache
     */
    setCachedQuote(destinationZip, weight, data) {
        const key = this.getCacheKey(destinationZip, weight);
        this.quoteCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Obtiene cotizaciones de envío desde el backend
     * @param {Object} params - Parámetros de la cotización
     * @param {string} params.destinationZipCode - Código postal destino
     * @param {number} params.weight - Peso en gramos
     * @param {Object} params.dimensions - Dimensiones del paquete (opcional)
     * @returns {Promise<Array>} Array de opciones de envío
     */
    async getQuote(params) {
        const { destinationZipCode, weight, dimensions } = params;

        // Validación básica
        if (!destinationZipCode) {
            throw new Error('Se requiere código postal de destino');
        }

        if (!weight || weight <= 0) {
            throw new Error('El peso debe ser mayor a 0');
        }

        // Verificar cache primero
        const cached = this.getCachedQuote(destinationZipCode, weight);
        if (cached) {
            return cached;
        }

        this.isLoading = true;

        try {
            const requestBody = {
                originZipCode: this.originZipCode,
                destinationZipCode,
                weight,
                dimensions: dimensions || {
                    length: 30,
                    width: 20,
                    height: 15
                }
            };

            console.log('📡 Solicitando cotización de envío:', requestBody);

            const response = await fetch(`${this.backendUrl}${this.shippingEndpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al obtener cotización');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Error en la respuesta del servidor');
            }

            console.log('✅ Cotización obtenida:', data.rates);

            // Guardar en cache
            this.setCachedQuote(destinationZipCode, weight, data.rates);

            this.lastQuote = data.rates;
            return data.rates;

        } catch (error) {
            console.error('❌ Error al obtener cotización:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Renderiza las opciones de envío en el DOM
     * @param {Array} rates - Opciones de envío
     * @param {string} containerId - ID del contenedor donde renderizar
     */
    renderShippingOptions(rates, containerId) {
        const container = document.getElementById(containerId);

        if (!container) {
            console.error(`❌ No se encontró el contenedor #${containerId}`);
            return;
        }

        // Limpiar contenedor
        container.innerHTML = '';

        if (!rates || rates.length === 0) {
            container.innerHTML = `
                <div class="shipping-no-options">
                    <p>⚠️ No hay opciones de envío disponibles para este código postal.</p>
                    <p class="text-muted">Por favor verifica el código postal ingresado.</p>
                </div>
            `;
            return;
        }

        // Ordenar por precio (más barato primero)
        const sortedRates = [...rates].sort((a, b) => a.cost - b.cost);

        // Renderizar cada opción
        sortedRates.forEach((rate, index) => {
            const optionHtml = this.createShippingOptionHTML(rate, index === 0);
            container.insertAdjacentHTML('beforeend', optionHtml);
        });

        // Agregar event listeners a los radio buttons
        this.attachShippingOptionListeners(containerId);

        console.log(`✅ ${rates.length} opciones de envío renderizadas`);
    }

    /**
     * Crea el HTML para una opción de envío
     */
    createShippingOptionHTML(rate, isRecommended) {
        const deliveryText = rate.deliveryDays
            ? `${rate.deliveryDays} días hábiles`
            : 'Tiempo estimado no disponible';

        const recommendedBadge = isRecommended
            ? '<span class="badge badge-success ml-2">Recomendado</span>'
            : '';

        return `
            <div class="shipping-option" data-carrier="${rate.carrier}" data-service="${rate.service}">
                <label class="shipping-option-label">
                    <input
                        type="radio"
                        name="shippingOption"
                        value="${rate.carrier}|${rate.service}"
                        data-cost="${rate.cost}"
                        ${isRecommended ? 'checked' : ''}
                    >
                    <div class="shipping-option-content">
                        <div class="shipping-option-header">
                            <span class="shipping-carrier">${rate.carrier}</span>
                            ${recommendedBadge}
                        </div>
                        <div class="shipping-option-details">
                            <span class="shipping-service">${rate.serviceDisplayName || rate.service}</span>
                            <span class="shipping-delivery">
                                <i class="fas fa-clock"></i> ${deliveryText}
                            </span>
                        </div>
                    </div>
                    <div class="shipping-option-price">
                        <span class="shipping-cost">$${rate.cost.toFixed(2)}</span>
                        <span class="shipping-currency">MXN</span>
                    </div>
                </label>
            </div>
        `;
    }

    /**
     * Adjunta event listeners a las opciones de envío
     */
    attachShippingOptionListeners(containerId) {
        const container = document.getElementById(containerId);
        const radioButtons = container.querySelectorAll('input[name="shippingOption"]');

        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const [carrier, service] = e.target.value.split('|');
                const cost = parseFloat(e.target.dataset.cost);

                this.selectedCarrier = {
                    carrier,
                    service,
                    cost
                };

                // Disparar evento personalizado
                const event = new CustomEvent('shippingOptionSelected', {
                    detail: this.selectedCarrier
                });
                document.dispatchEvent(event);

                console.log('📦 Opción de envío seleccionada:', this.selectedCarrier);
            });
        });

        // Seleccionar la primera opción por defecto
        if (radioButtons.length > 0 && radioButtons[0].checked) {
            radioButtons[0].dispatchEvent(new Event('change'));
        }
    }

    /**
     * Obtiene la opción de envío seleccionada actualmente
     */
    getSelectedOption() {
        return this.selectedCarrier;
    }

    /**
     * Muestra un indicador de carga
     */
    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="shipping-loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Cargando...</span>
                </div>
                <p class="mt-3">Calculando opciones de envío...</p>
            </div>
        `;
    }

    /**
     * Muestra un mensaje de error
     */
    showError(containerId, errorMessage) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <strong>Error:</strong> ${errorMessage}
            </div>
        `;
    }

    /**
     * Limpia el cache de cotizaciones
     */
    clearCache() {
        this.quoteCache.clear();
        console.log('🗑️ Cache de cotizaciones limpiado');
    }
}

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

/**
 * Valida un código postal mexicano
 * @param {string} zipCode - Código postal a validar
 * @returns {boolean}
 */
function isValidMexicanZipCode(zipCode) {
    // Código postal mexicano: 5 dígitos
    const zipRegex = /^\d{5}$/;
    return zipRegex.test(zipCode);
}

/**
 * Formatea un código postal (elimina espacios, guiones)
 * @param {string} zipCode - Código postal a formatear
 * @returns {string}
 */
function formatZipCode(zipCode) {
    if (!zipCode) return '';
    return zipCode.toString().replace(/\D/g, '').substring(0, 5);
}

// =====================================================
// EXPORTAR PARA USO GLOBAL
// =====================================================

// Si se usa en navegador, hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.ShippingCalculator = ShippingCalculator;
    window.isValidMexicanZipCode = isValidMexicanZipCode;
    window.formatZipCode = formatZipCode;
}

// Si se usa con módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ShippingCalculator,
        isValidMexicanZipCode,
        formatZipCode
    };
}

console.log('📦 Módulo shipping-calculator.js cargado');
