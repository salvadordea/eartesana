# 🎛️ Guía Completa del Panel de Administración

## 🚀 Acceso al Panel

**URL**: `admin/index.html`

El panel de admin es una interfaz visual súper fácil para gestionar todo tu sitio web sin tocar código.

## 🎯 Características Principales

### ✅ Lo que puedes hacer:
- 🖼️ **Cambiar logos** (header y hero)
- 🛍️ **Actualizar imagen principal** del producto
- 🎉 **Gestionar promociones** mes a mes
- 📂 **Configurar categorías** (todas vs limitadas)
- 🎠 **Controlar carrusel** con productos random
- 🔧 **Limpiar cache** y hacer backups
- 👁️ **Vista previa** de cambios antes de aplicar

### ✅ Lo que es automático:
- ⚡ **Productos aleatorios** en carrusel
- 📦 **Todas las categorías** se muestran en inicio
- 🎨 **Temas estacionales** para promociones  
- 💾 **Cache inteligente** para velocidad

## 🎨 Secciones del Panel

### 1. 🖼️ Gestión de Logo
**¿Para qué?**: Cambiar los logos del sitio

#### Logos disponibles:
- **Logo Header**: Aparece en la barra superior (fondo blanco)
- **Logo Hero**: Aparece en la sección principal en blanco

#### Cómo usarlo:
1. Click en "Seleccionar Logo Header" o "Seleccionar Logo Hero"
2. Elige tu archivo de imagen (PNG, JPG, WebP)  
3. Ve la vista previa instantánea
4. Click "Guardar Logos"
5. Click "Guardar Todos los Cambios" al final

**💡 Tip**: El logo hero se convierte automáticamente a blanco para contraste

### 2. 🛍️ Imagen Producto Principal
**¿Para qué?**: La imagen grande que aparece al lado del logo en inicio

#### Opciones:
- **Subir imagen manual**: Tu propia foto
- **Producto aleatorio**: Toma una foto random de WooCommerce
- **Descripción**: Texto alternativo para SEO

#### Cómo usarlo:
1. **Opción A - Manual**: "Seleccionar Imagen" → elige archivo
2. **Opción B - Auto**: "Producto Aleatorio" → se carga solo
3. Escribe descripción del producto
4. "Guardar Imagen"

**💡 Tip**: El botón "Producto Aleatorio" es perfecto para mantener el sitio fresco

### 3. 🎉 Promoción del Mes 
**¿Para qué?**: El banner dorado con la oferta actual

#### Campos disponibles:
- **Título**: "¡OFERTA ESPECIAL!" 
- **Descripción**: "20% de descuento..."
- **Código**: "PRIMERA20"
- **Expiración**: "Válido hasta..."
- **Botón**: "¡Compra Ahora!"
- **Tema**: 5 colores diferentes

#### Temas de color:
- 🟡 **Default**: Dorado (todo el año)
- 💕 **San Valentín**: Rosa/Rojo
- 🌸 **Día Madre**: Rosa suave  
- 🎄 **Navidad**: Rojo/Verde
- ☀️ **Verano**: Naranja

#### Cómo usarlo:
1. Llena los campos de texto
2. Click en el tema de color que quieras
3. "Guardar Promoción"

**💡 Tip**: Usa "Plantillas" para cargar promociones pre-hechas para cada mes

### 4. 📂 Gestión de Categorías
**¿Para qué?**: Controlar qué categorías aparecen en inicio

#### Configuraciones:
- **Mostrar**: Todas / Top 6 / Top 12 / Top 18
- **Ordenar**: Por cantidad / Por nombre / Por ID

#### Estado actual:
- ✅ **Configurado**: Todas las categorías
- ⚡ **Velocidad**: Cache de 24 horas  
- 🔄 **Actualización**: Automática

#### Cómo usarlo:
1. Selecciona cuántas mostrar
2. Elige el orden
3. "Aplicar Cambios"
4. "Actualizar Cache" si necesitas refrescar datos

### 5. 🎠 Carrusel de Productos
**¿Para qué?**: Las fotos que rotan en el hero

#### Fuentes de imágenes:
- **🎲 Aleatorios**: Productos random de WooCommerce
- **⭐ Destacados**: Solo productos marcados como featured
- **🆕 Recientes**: Productos más nuevos
- **✋ Manual**: Selección personalizada

#### Configuraciones:
- **Cantidad**: 3, 5 u 8 imágenes
- **Velocidad**: 3, 4 o 5 segundos por imagen

#### Cómo usarlo:
1. Selecciona la fuente (recomendado: "Aleatorios")
2. Elige cantidad de imágenes
3. Ajusta velocidad
4. "Aplicar Configuración"
5. "Generar Nuevo" para cambiar las fotos

**💡 Tip**: "Generar Nuevo" te da un carrusel completamente diferente cada vez

### 6. 🔧 Acciones del Sitio
**¿Para qué?**: Mantenimiento y utilidades

#### Opciones disponibles:
- **👁️ Ver Sitio**: Abre tu homepage
- **🧹 Limpiar Cache**: Borra datos guardados
- **💾 Backup Config**: Descarga tu configuración

#### Cuándo usar cada una:
- **Ver Sitio**: Para revisar cambios
- **Limpiar Cache**: Si algo no se actualiza
- **Backup**: Antes de cambios importantes

## 🎯 Barra de Acciones Principales

### Al final del panel tienes 3 botones súper importantes:

#### 1. 💾 "Guardar Todos los Cambios" 
- **Qué hace**: Aplica TODOS los cambios hechos
- **Resultado**: Descarga nuevo archivo `config.js`
- **Cuándo usar**: Cuando termines de hacer cambios

#### 2. 👁️ "Vista Previa General"
- **Qué hace**: Guarda + abre tu sitio
- **Resultado**: Ves los cambios aplicados
- **Cuándo usar**: Para revisar antes de publicar

#### 3. ↩️ "Restaurar Valores por Defecto"
- **Qué hace**: Borra todos los cambios
- **Resultado**: Vuelve a la configuración original
- **Cuándo usar**: Si algo salió mal

## 📋 Flujo de Trabajo Recomendado

### 🎯 Para cambiar promoción mensual:
1. Ir a sección "Promoción del Mes"
2. Click "Plantillas" → seleccionar mes actual
3. Ajustar fechas si es necesario
4. Elegir tema de color apropiado
5. "Guardar Promoción"
6. "Vista Previa General" para revisar
7. "Guardar Todos los Cambios"

### 🎯 Para refrescar el sitio:
1. Ir a "Carrusel de Productos"
2. Click "Generar Nuevo"
3. Ir a "Imagen Producto Principal"  
4. Click "Producto Aleatorio"
5. "Vista Previa General"
6. "Guardar Todos los Cambios"

### 🎯 Para cambio de temporada:
1. Subir nuevos logos si es necesario
2. Cambiar promoción con tema estacional
3. Generar nuevo carrusel
4. "Guardar Todos los Cambios"

## ⚠️ Instrucciones Importantes

### 📁 Después de "Guardar Todos los Cambios":

1. **Se descarga** un archivo `config.js`
2. **Debes reemplazar** el archivo en `assets/js/config.js`
3. **El sitio se actualiza** automáticamente

### 💾 Cómo reemplazar el archivo:

#### Opción A - Manualmente:
1. Ve a la carpeta `assets/js/`
2. Haz backup del `config.js` actual
3. Reemplaza con el nuevo `config.js` descargado

#### Opción B - Por FTP:
1. Conecta por FTP a tu servidor
2. Ve a `nueva-homepage/assets/js/`
3. Sube el nuevo `config.js`

### 🚨 Si algo sale mal:

1. **Restaurar backup**: Usa el `config.js` que respaldaste
2. **Limpiar cache**: Usa el botón en "Acciones del Sitio"
3. **Restaurar valores**: "Restaurar Valores por Defecto"

## 🎨 Plantillas de Promociones Disponibles

### Cuando presionas "Plantillas" aparecen:

1. **💝 San Valentín**: Rosa, descuento en joyería
2. **🌸 Día de la Madre**: Rosa suave, descuento + envío gratis
3. **🎄 Navidad**: Rojo/verde, descuentos grandes
4. **☀️ Verano**: Naranja, 2x1 en bolsas

**Solo escribe el número (1, 2, 3, 4) y se carga automáticamente**

## 💡 Consejos Pro

### 🎯 Para mantener el sitio fresco:
- **Cambia el carrusel** cada semana con "Generar Nuevo"
- **Rota la imagen principal** mensualmente
- **Actualiza promociones** el día 1 de cada mes

### 🎯 Para mejor rendimiento:
- **Haz backup** antes de cambios grandes
- **Limpia cache** después de cambiar categorías
- **Usa "Vista Previa"** antes de guardar todo

### 🎯 Para mejor conversión:
- **Promociones urgentes**: "Solo hasta..." "Últimas 24 horas"
- **Códigos memorables**: "MAMA30", "VERANO25"
- **Temas estacionales**: Usar colores apropiados para cada época

## 🎉 ¡Todo Listo!

El panel de admin está diseñado para ser súper fácil de usar. **No necesitas saber programación** para mantener tu sitio actualizado y atractivo.

### Recuerda:
1. 🔄 **Cambios regulares** = sitio más atractivo
2. 👁️ **Vista previa** antes de publicar
3. 💾 **Backup** antes de cambios importantes

¡Ahora puedes gestionar tu sitio como un profesional! 🚀
