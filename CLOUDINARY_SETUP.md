# 🌩️ Configurar Cloudinary para Estudio Artesana

## 📋 Paso 1: Obtener Cloud Name

1. **Ve a tu Dashboard de Cloudinary**
   - URL: https://cloudinary.com/console
   - Inicia sesión con tu cuenta

2. **Encuentra tu Cloud Name**
   - En la parte superior del dashboard verás algo como:
   ```
   Cloud Name: tu-cloud-name-aqui
   API Key: 123456789012345
   API Secret: ************
   ```
   - **Solo necesitas el Cloud Name** (no copies API Key/Secret por seguridad)

## 📋 Paso 2: Crear Upload Preset (MUY IMPORTANTE)

1. **Ve a Settings**
   - Clic en el ícono ⚙️ "Settings" en la barra lateral

2. **Navega a Upload**
   - Clic en la pestaña "Upload" 

3. **Crear nuevo Upload Preset**
   - Scroll down hasta la sección "Upload presets"
   - Clic en "Add upload preset"

4. **Configuración recomendada:**
   ```
   Preset name: estudio-artesana-unsigned
   Signing mode: Unsigned ✅ (MUY IMPORTANTE!)
   Folder: estudio-artesana (opcional pero recomendado)
   Mode: Upload
   Resource type: Auto
   ```

5. **Configuración avanzada (opcional):**
   ```
   Transformations:
   - Quality: Auto
   - Format: Auto
   - Max file size: 10MB
   ```

6. **Guardar**
   - Clic "Save" al final

## ✅ Verificar la configuración

Después de crear el preset, deberías ver:
- ✅ Preset name: `estudio-artesana-unsigned`
- ✅ Signing mode: `Unsigned`
- ✅ Status: `Enabled`

## 🚀 Paso 3: Configurar en Admin Panel

1. **Acceder al admin**
   - URL: `https://tu-sitio-vercel.vercel.app/admin/login.html`
   - Ingresa con tus credenciales de WordPress

2. **Configurar Cloudinary**
   - Al primer acceso verás un modal
   - Ingresa:
     ```
     Cloud Name: [tu-cloud-name-de-paso-1]
     Upload Preset: estudio-artesana-unsigned
     ```

3. **¡Listo para usar!**
   - Ahora puedes subir logos e imágenes
   - Se guardarán en Cloudinary automáticamente
   - URLs optimizadas con CDN global

## 🛠️ Troubleshooting

### ❌ Error: "Invalid upload preset"
- ✅ Verifica que el preset sea `Unsigned`
- ✅ Nombre exacto: `estudio-artesana-unsigned`

### ❌ Error: "Invalid cloud name"
- ✅ Cloud Name no debe incluir espacios
- ✅ Copia exacto desde el dashboard

### ❌ Error: "Upload failed"
- ✅ Archivo menor a 10MB
- ✅ Formato: JPG, PNG, GIF, WebP

## 📊 Límites Free Tier

Tu cuenta gratuita incluye:
- 💾 **25 GB** de almacenamiento
- 📤 **25,000** imágenes/mes
- 🌐 **25 GB** de ancho de banda/mes
- 🔄 **25,000** transformaciones/mes

**Para Estudio Artesana esto es MÁS que suficiente** (usarás menos del 1%)

## 🎯 URLs finales

Una vez configurado:
- **Admin Panel:** `https://tu-sitio.vercel.app/admin/`
- **Login:** `https://tu-sitio.vercel.app/admin/login.html`
- **Tus imágenes:** `https://res.cloudinary.com/tu-cloud-name/image/upload/estudio-artesana/`

## 📞 Soporte

Si tienes problemas:
1. Verifica que el Upload Preset sea **Unsigned**
2. Cloud Name copiado exactamente
3. Archivo menor a 10MB
4. Formato de imagen válido

¡Todo listo! 🚀
