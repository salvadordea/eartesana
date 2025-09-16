# 📱 Pruebas: Búsqueda Colapsable Móvil - Tienda

## 🎯 Objetivo
Verificar que la nueva funcionalidad de búsqueda colapsable funcione correctamente en dispositivos móvil, mejorando la experiencia de usuario al posicionar la búsqueda debajo de las categorías.

## 🔧 Cambios Implementados

### 1. **HTML** (tienda.html)
- ✅ Agregado botón de búsqueda móvil colapsable
- ✅ Duplicada la barra de búsqueda para móvil
- ✅ Reorganizada estructura para permitir reordenamiento
- ✅ Añadidos IDs únicos para cada elemento

### 2. **CSS** (assets/css/tienda.css)
- ✅ Estilos para el botón de toggle móvil
- ✅ Animaciones de colapso/expansión
- ✅ Media queries responsivas (768px breakpoint)
- ✅ Reordenamiento de elementos usando CSS flexbox
- ✅ Estilos para diferentes tamaños de pantalla

### 3. **JavaScript** (tienda.html)
- ✅ Funcionalidad de mostrar/ocultar búsqueda
- ✅ Sincronización entre búsqueda móvil y desktop
- ✅ Auto-focus en input al abrir
- ✅ Integración con función de búsqueda existente

## 🧪 Casos de Prueba

### **Desktop (>768px)**
1. **Acceder a la tienda desde desktop**
   - ✅ La barra de búsqueda debe estar visible en la parte superior
   - ✅ El botón de búsqueda móvil NO debe aparecer
   - ✅ La búsqueda móvil NO debe aparecer

2. **Funcionalidad normal**
   - ✅ La búsqueda debe funcionar como siempre
   - ✅ Los controles de vista y ordenamiento deben funcionar

### **Tablet (769px-1024px)**
1. **Comportamiento similar a desktop**
   - ✅ Búsqueda superior visible
   - ✅ Sin elementos móviles

### **Móvil (≤768px)**

#### **Carga inicial:**
1. **Acceder a la tienda desde móvil**
   - ✅ La barra de búsqueda superior NO debe aparecer
   - ✅ Debe aparecer el botón "Buscar productos" con ícono
   - ✅ La búsqueda móvil debe estar oculta inicialmente

#### **Orden de elementos:**
2. **Verificar orden correcto en móvil:**
   - ✅ 1. Categorías (primero)
   - ✅ 2. Búsqueda móvil (después de categorías, cuando se expande)
   - ✅ 3. Info de resultados
   - ✅ 4. Productos
   - ✅ 5. Paginación

#### **Interacción con botón:**
3. **Hacer clic en el botón "Buscar productos":**
   - ✅ El botón debe cambiar a estado "activo"
   - ✅ La flecha debe rotar 180°
   - ✅ La barra de búsqueda debe expandirse con animación suave
   - ✅ El input debe recibir focus automáticamente

4. **Hacer clic nuevamente en el botón:**
   - ✅ La barra de búsqueda debe colapsarse
   - ✅ La flecha debe volver a posición original
   - ✅ El botón debe salir del estado "activo"

#### **Funcionalidad de búsqueda:**
5. **Escribir en la búsqueda móvil:**
   - ✅ Debe ejecutar la búsqueda en tiempo real
   - ✅ Los resultados deben actualizarse

6. **Hacer clic en el botón de búsqueda:**
   - ✅ Debe ejecutar la función `searchProductsMobile()`
   - ✅ Debe sincronizarse con la búsqueda desktop (si existe)

### **Extra Small (≤480px)**

#### **Adaptación de estilos:**
7. **En pantallas muy pequeñas:**
   - ✅ El botón debe reducir padding (12px 16px)
   - ✅ Font-size del botón: 14px
   - ✅ Container de búsqueda con padding reducido (16px)
   - ✅ Input con padding 16px 20px

## 🔍 Puntos Específicos a Verificar

### **Visual:**
- [ ] El botón se ve correctamente estilizado
- [ ] Las animaciones son suaves (0.3s-0.4s)
- [ ] Los colores coinciden con el tema dark
- [ ] El backdrop-filter funciona correctamente
- [ ] Los bordes y sombras se ven bien

### **Funcionalidad:**
- [ ] El toggle funciona consistentemente
- [ ] El auto-focus funciona después de expandir
- [ ] La sincronización entre inputs funciona
- [ ] No hay errores en consola
- [ ] La búsqueda integra con el sistema existente

### **Responsive:**
- [ ] Transición suave entre breakpoints
- [ ] No hay elementos rotos en ninguna resolución
- [ ] El reordenamiento funciona solo en móvil
- [ ] Los elementos se ocultan/muestran correctamente

## 🚀 Cómo Probar

### **1. Servidor Local**
```bash
# En el directorio del proyecto
./server-local.bat
# O iniciar servidor HTTP simple
python -m http.server 8000
```

### **2. Acceso a la Tienda**
```
http://localhost:8000/tienda.html
```

### **3. Herramientas de Desarrollo**
- **Chrome DevTools**: F12 → Toggle device mode
- **Breakpoints a probar**: 320px, 480px, 768px, 1024px, 1200px+
- **Orientaciones**: Portrait y Landscape

### **4. Dispositivos Reales**
- Teléfonos Android/iPhone
- Tablets
- Diferentes navegadores móviles

## 📊 Lista de Verificación

### **Desktop (✅ Completar)**
- [ ] Búsqueda superior visible y funcional
- [ ] Botón móvil oculto
- [ ] Búsqueda móvil oculta
- [ ] Funcionalidad normal preservada

### **Móvil (✅ Completar)**
- [ ] Búsqueda superior oculta
- [ ] Botón móvil visible y estilizado
- [ ] Orden correcto de elementos
- [ ] Toggle funciona correctamente
- [ ] Animaciones suaves
- [ ] Auto-focus funciona
- [ ] Búsqueda ejecuta correctamente
- [ ] Sincronización entre inputs

### **Responsive (✅ Completar)**
- [ ] Transición suave en 768px breakpoint
- [ ] Estilos correctos en 480px
- [ ] Sin elementos rotos en ninguna resolución
- [ ] Compatibilidad con diferentes navegadores

## 🐛 Posibles Problemas a Buscar

1. **JavaScript:**
   - Errores en consola
   - Funciones `searchProducts` no definidas
   - Elementos DOM no encontrados

2. **CSS:**
   - Elementos superpuestos
   - Animaciones entrecortadas
   - Media queries que no aplican

3. **UX:**
   - Focus no funciona
   - Toggle inconsistente
   - Búsqueda no sincroniza

## ✅ Resultado Esperado

**En móvil (≤768px):**
- Orden: Categorías → [Búsqueda colapsable] → Productos
- Búsqueda inicialmente oculta, se despliega al hacer clic
- Animaciones fluidas y profesionales
- Funcionalidad de búsqueda completa
- UX mejorada significativamente

**En desktop (>768px):**
- Comportamiento exactamente igual que antes
- Sin cambios en la experiencia existente

---

## 📝 Notas de Desarrollo

- Breakpoint principal: 768px
- Framework CSS: Media queries nativas
- JavaScript: Vanilla JS, integra con sistema existente  
- Animaciones: CSS transitions con cubic-bezier
- Sincronización: Event listeners bidireccionales

¡Recuerda probar en dispositivos reales para mejor validación! 📱✨
