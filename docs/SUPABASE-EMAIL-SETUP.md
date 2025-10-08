# Configuración de Emails en Supabase - Estudio Artesana

Este documento explica cómo configurar los emails de confirmación personalizados en Supabase para que se vean profesionales y redirijan a la URL de producción correcta.

## 📋 Problemas Actuales

1. ❌ Email de confirmación es muy simple/plain
2. ❌ URL de confirmación redirige a `localhost:3000` en vez de `estudioartesana.com`
3. ❌ URL contiene el dominio de Supabase directamente

## ✅ Soluciones

### 1. Configurar URL de Redirección del Sitio

**Ir a:** Supabase Dashboard → Authentication → URL Configuration

**Cambiar:**

```
Site URL: http://localhost:3000
```

**A:**

```
Site URL: https://estudioartesana.com
```

**Redirect URLs (agregar ambas):**
- `https://estudioartesana.com/**`
- `http://localhost:3000/**` (solo para desarrollo)

### 2. Personalizar Template de Email de Confirmación

**Ir a:** Supabase Dashboard → Authentication → Email Templates → Confirm signup

**Reemplazar el template actual con el contenido de:**
`docs/email-template-confirmation.html`

**Variables disponibles en el template:**
- `{{ .ConfirmationURL }}` - URL de confirmación con token
- `{{ .Token }}` - Solo el token
- `{{ .TokenHash }}` - Hash del token
- `{{ .SiteURL }}` - URL del sitio configurada
- `{{ .Email }}` - Email del usuario

### 3. Configurar Email Sender (Remitente)

**Ir a:** Supabase Dashboard → Project Settings → Auth

**Sender Name:** `Estudio Artesana`

**Sender Email:** Una de estas opciones:

**Opción A: Usar Email Personalizado (Recomendado)**
- Configurar con tu dominio: `noreply@estudioartesana.com`
- Requiere verificación de dominio (DNS records)
- Sigue las instrucciones en: Auth → Email Provider → Custom SMTP

**Opción B: Usar Default de Supabase (Temporal)**
- Mantener el email por defecto de Supabase
- Funciona inmediatamente pero se ve menos profesional

### 4. Configurar SMTP con Resend (Recomendado)

Para emails más confiables y profesionales usaremos **Resend** (3,000 emails gratis/mes).

**Ir a:** Supabase Dashboard → Project Settings → Auth → SMTP Settings

**Habilitar Custom SMTP** y usar esta configuración:

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP Username: resend
SMTP Password: re_Gzs3wBQU_FTZYjHX2MD4Z1RnS54MZhLfg
Sender Email: noreply@estudioartesana.com
Sender Name: Estudio Artesana
```

**⚠️ IMPORTANTE:** Asegúrate de:
- ✅ Marcar "Enable Custom SMTP"
- ✅ Usar exactamente `resend` como username (no tu email)
- ✅ Copiar la API key completa sin espacios extras
- ✅ Guardar los cambios

**Configuración alternativa si Resend pide verificar dominio:**

Temporalmente puedes usar el email verificado de Resend:
```
Sender Email: onboarding@resend.dev
```

Luego cuando verifiques tu dominio, cámbialo a:
```
Sender Email: noreply@estudioartesana.com
```

### 5. Configurar Verificación de Dominio en Resend

Para poder enviar desde `noreply@estudioartesana.com` necesitas verificar tu dominio en Resend:

**Paso 1:** Ir a https://resend.com/domains → Add Domain

**Paso 2:** Agregar `estudioartesana.com`

**Paso 3:** Resend te mostrará los registros DNS que debes agregar. Ve a tu proveedor de dominio (GoDaddy, Namecheap, etc.) y agrega:

**Registros que te dará Resend (ejemplo):**

```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (valor largo que te da Resend)

Type: MX (opcional, solo si quieres recibir emails)
Priority: 10
Name: estudioartesana.com
Value: feedback-smtp.resend.com
```

**Paso 4:** Esperar verificación (usualmente 5-30 minutos)

**Paso 5:** Una vez verificado, cambiar en Supabase:
```
Sender Email: noreply@estudioartesana.com
```

**Mientras tanto:** Usar el email temporal de Resend:
```
Sender Email: onboarding@resend.dev
```

## 🎨 Plantilla de Email Incluida

La plantilla en `docs/email-template-confirmation.html` incluye:

✅ **Diseño profesional** con colores de marca
✅ **Responsive** - se ve bien en móvil y desktop
✅ **Botón CTA destacado** para confirmar email
✅ **Sección de beneficios** de crear cuenta
✅ **Enlaces a redes sociales** y contacto
✅ **Nota de seguridad** para usuarios que no crearon la cuenta
✅ **Información de expiración** del enlace

## 📝 Otros Templates de Email que Puedes Personalizar

En Supabase → Authentication → Email Templates:

1. **Confirm signup** - Cuando el usuario crea cuenta (✅ ya configurado)
2. **Invite user** - Invitación a crear cuenta
3. **Magic Link** - Login sin contraseña
4. **Change Email Address** - Confirmación de cambio de email
5. **Reset Password** - Recuperación de contraseña

## 🧪 Probar los Emails

1. **Crear usuario de prueba:**
   ```javascript
   // En la consola del navegador o en tu código
   const { data, error } = await supabase.auth.signUp({
     email: 'prueba@ejemplo.com',
     password: 'password123'
   })
   ```

2. **Verificar en:**
   - La bandeja de entrada del email de prueba
   - Supabase Dashboard → Authentication → Logs (para ver errores)

3. **Checklist de verificación:**
   - [ ] Email llega a la bandeja (no spam)
   - [ ] Diseño se ve profesional
   - [ ] Botón de confirmación funciona
   - [ ] Redirige a `estudioartesana.com` (no localhost)
   - [ ] Después de confirmar, el usuario queda verificado

## 🔧 Troubleshooting

### El email no llega
- ✓ Verificar en spam/correo no deseado
- ✓ Revisar Supabase logs: Dashboard → Logs
- ✓ Verificar que el SMTP esté configurado correctamente
- ✓ Confirmar que el dominio esté verificado

### Redirige a localhost
- ✓ Cambiar Site URL en Auth settings a `https://estudioartesana.com`
- ✓ Agregar redirect URL en la lista permitida

### Email se ve plain/sin formato
- ✓ Confirmar que copiaste el HTML completo del template
- ✓ No usar "Plain text" en el editor de Supabase
- ✓ Usar el editor HTML

### Token inválido o expirado
- ✓ Los tokens expiran en 24 horas por defecto
- ✓ Cambiar expiración en: Auth → Settings → Email Auth Token Lifetime

## 📞 Personalización Adicional

### Cambiar colores del template
En el archivo `email-template-confirmation.html`, busca y reemplaza:

```css
/* Gradiente principal (morado) */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Cambiar a tus colores de marca */
background: linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%);
```

### Cambiar información de contacto
Buscar y reemplazar en el template:

```html
contacto@estudioartesana.com → tu-email@dominio.com
+52 1 55 1234 5678 → tu-número
```

### Cambiar enlaces sociales
```html
https://facebook.com/estudioartesana → tu-página
https://instagram.com/estudioartesana → tu-instagram
```

## ✅ Checklist Final

Después de configurar todo:

- [ ] Site URL apunta a `https://estudioartesana.com`
- [ ] Redirect URLs incluyen el dominio de producción
- [ ] Template de email personalizado está configurado
- [ ] SMTP configurado (opcional pero recomendado)
- [ ] Dominio verificado (si usas email personalizado)
- [ ] Emails de prueba enviados y recibidos correctamente
- [ ] Emails NO van a spam
- [ ] Confirmación redirige correctamente al sitio de producción
- [ ] Otros templates (password reset, etc.) también personalizados

## 🎯 Prioridad de Implementación

**Alta Prioridad (Hacer ahora):**
1. ✅ Cambiar Site URL a estudioartesana.com
2. ✅ Copiar template HTML personalizado
3. ✅ Probar con un usuario real

**Media Prioridad (Esta semana):**
4. Configure SMTP personalizado (SendGrid/Resend)
5. Personalizar template de password reset
6. Verificar dominio para emails

**Baja Prioridad (Cuando tengas tiempo):**
7. Personalizar todos los templates restantes
8. Configurar email tracking/analytics
9. A/B testing de subject lines

---

**Documentado por:** Claude Code
**Última actualización:** 2025-01-07
**Versión:** 1.0
