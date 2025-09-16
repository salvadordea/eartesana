# 🦶 Footer Universal - Sistema de Sincronización de Datos

Sistema de footer dinámico que se carga automáticamente en todas las páginas del sitio y sincroniza los datos de contacto desde el panel de administración.

## 📋 Descripción General

El Footer Universal es un componente que:

1. **Se carga dinámicamente** desde un archivo HTML externo
2. **Ajusta las rutas** según la ubicación de la página
3. **Sincroniza datos de contacto** desde el panel de administración
4. **Se actualiza en tiempo real** cuando se modifican los datos

## 🗂️ Estructura de Archivos

```
EstArtesana/
├── components/
│   └── footer.html                   # Template HTML del footer
├── assets/js/
│   ├── footer-universal.js          # Script principal del footer
│   └── contact-data-loader.js       # Sincronización de datos (actualizado)
├── index.html                       # Incluye el footer universal
├── test-footer-universal.html       # Página de pruebas
└── README-footer-universal.md       # Esta documentación
```

## 🚀 Características

### ✅ Footer Dinámico
- Carga automáticamente desde `components/footer.html`
- Ajuste inteligente de rutas según ubicación de página
- Diseño responsivo con 4 columnas informativas

### ✅ Sincronización de Datos
- Lee datos desde `localStorage` (panel admin)
- Actualización automática al cambiar información
- Datos de respaldo en caso de no tener configuración

### ✅ Tiempo Real
- Escucha eventos de `localStorage`
- Sincronización entre pestañas abiertas
- Integración con `contact-data-loader.js`

### ✅ Rutas Inteligentes
- Ajusta automáticamente enlaces según ubicación:
  - **Desde raíz**: `pages/contacto.html`
  - **Desde `/pages/`**: `contacto.html`
  - **Desde `/admin/`**: `../pages/contacto.html`

## 🏗️ Implementación

### 1. Estructura del Footer

El footer contiene 4 columnas:

1. **Estudio Artesana**: Descripción y redes sociales
2. **Enlaces Rápidos**: Navegación principal
3. **Información**: Enlaces legales
4. **Contacto**: Datos de contacto sincronizados

### 2. Integración en Páginas

```html
<!-- En cualquier página HTML -->
<body>
    <!-- Contenido de la página -->
    
    <!-- Footer será cargado aquí automáticamente -->
    
    <!-- Scripts al final del body -->
    <script src="assets/js/footer-universal.js"></script>
</body>
```

### 3. Sincronización con Panel Admin

El footer se sincroniza automáticamente con estos datos del panel:

```javascript
{
    contactEmail: "info@estudioartesana.com",
    phoneNumber: "+52 123 456 7890",
    facebookUrl: "https://facebook.com/estudioartesana",
    instagramUrl: "https://instagram.com/estudioartesana", 
    whatsappNumber: "+5212345678490",
    locationText: "Ciudad de México, México",
    businessHours: "Lun - Vie: 9:00 AM - 6:00 PM\nSáb: 10:00 AM - 4:00 PM"
}
```

## 🔧 API del Sistema

### UniversalFooter Class

```javascript
// Instancia global disponible
window.UniversalFooter

// Métodos principales
UniversalFooter.refresh()           // Refrescar datos manualmente
UniversalFooter.loadContactData()   // Cargar datos desde localStorage
UniversalFooter.applyContactData()  // Aplicar datos al footer
```

### Eventos

```javascript
// Escuchar cambios en datos
window.addEventListener('storage', (e) => {
    if (e.key === 'contactInfo') {
        // Datos actualizados
    }
});
```

## 🧪 Página de Pruebas

Usa `test-footer-universal.html` para:

- **Probar la carga** del footer
- **Simular cambios** de datos
- **Verificar sincronización** en tiempo real
- **Monitorear logs** del sistema

### Funcionalidades de Prueba:

1. **Estado del Sistema**: Indicadores visuales
2. **Controles de Prueba**: Simular datos
3. **Logs en Tiempo Real**: Monitoreo de eventos
4. **Sincronización**: Prueba con múltiples pestañas

## 🚦 Proceso de Carga

1. **Inicialización**: Script se ejecuta al cargar página
2. **Detección de Ruta**: Determina ubicación actual
3. **Carga de Footer**: Fetch del HTML desde `components/`
4. **Ajuste de Rutas**: Modifica enlaces según contexto
5. **Inyección**: Añade footer al final del `<body>`
6. **Sincronización**: Carga y aplica datos de contacto

## 🔄 Integración con ContactDataLoader

El sistema se integra con el existente `contact-data-loader.js`:

```javascript
// En contact-data-loader.js
refresh() {
    console.log('🔄 Refrescando datos de contacto...');
    this.applyData();
    
    // También actualizar el footer
    if (window.UniversalFooter) {
        window.UniversalFooter.refresh();
    }
}
```

## 📝 Logs y Debugging

El sistema genera logs detallados:

```javascript
console.log('👟 Footer: Datos cargados desde admin:', contactData);
console.log('✅ Footer universal cargado correctamente');
console.log('🔄 Refrescando datos del footer...');
```

## 🎯 Beneficios

### ✅ Para Desarrolladores
- **Consistencia**: Footer igual en todas las páginas
- **Mantenimiento**: Un solo archivo para editar
- **Escalabilidad**: Fácil añadir nuevas páginas

### ✅ Para Administradores
- **Control Total**: Cambios desde panel admin
- **Tiempo Real**: Actualizaciones inmediatas
- **Centralización**: Una sola fuente de verdad

### ✅ Para Usuarios
- **Coherencia**: Información siempre actualizada
- **Funcionalidad**: Enlaces y datos correctos
- **Experiencia**: Navegación consistente

## 🔧 Configuración Avanzada

### Personalizar Datos por Defecto

En `footer-universal.js`:

```javascript
this.fallbackData = {
    contactEmail: 'tu-email@dominio.com',
    phoneNumber: '+52 XXX XXX XXXX',
    // ... más datos
};
```

### Modificar Rutas Personalizadas

```javascript
getFooterPath() {
    const path = window.location.pathname;
    
    // Lógica personalizada aquí
    if (path.includes('/mi-seccion/')) {
        return '../../components/footer.html';
    }
    
    return 'components/footer.html';
}
```

## 🚀 Próximos Pasos

1. **Implementar en más páginas**: Reemplazar footers estáticos
2. **Añadir más datos**: Expandir sincronización
3. **Optimizar rendimiento**: Cache y lazy loading
4. **Testing automatizado**: Pruebas unitarias

## ⚠️ Consideraciones

- **JavaScript requerido**: El footer no carga sin JS
- **Rutas relativas**: Importante mantener estructura
- **Fallback data**: Siempre tener datos por defecto
- **Cross-origin**: Considerar CORS en producción

---

## 📚 Uso Rápido

1. **Incluir script**: `<script src="assets/js/footer-universal.js"></script>`
2. **Crear componente**: Archivo en `components/footer.html`
3. **Configurar datos**: Desde panel admin o fallback
4. **Probar**: Usar página de pruebas

¡El footer se cargará automáticamente con los datos sincronizados! 🎉
