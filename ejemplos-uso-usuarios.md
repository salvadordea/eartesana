# Sistema de Usuarios - Estudio Artesana

## Descripción del Sistema

He creado un sistema completo de usuarios para Estudio Artesana con 3 tipos de usuario:

### Tipos de Usuario:
1. **Usuario** - Cliente regular
2. **Mayorista** - Cliente con descuentos especiales
3. **Admin** - Administrador del sistema

## Archivos Creados/Modificados

### 1. `supabase_schema.sql` - Esquema de Base de Datos
- Tablas de usuarios con perfiles extendidos
- Sistema de aplicaciones de mayorista
- Políticas de seguridad RLS
- Triggers automáticos

### 2. `js/auth-manager.js` - Módulo de Autenticación
- Registro y login de usuarios
- Manejo de sesiones
- Gestión de perfiles
- Aplicaciones de mayorista

### 3. `js/supabase-api-client.js` - Cliente API Extendido
- Integración con autenticación
- Precios personalizados para mayoristas
- Métodos de usuario

## Ejemplos de Uso

### Registro de Usuario
```javascript
// Registrar un usuario regular
const result = await authManager.signUp(
    'usuario@email.com',
    'password123',
    {
        fullName: 'Juan Pérez',
        phone: '+52 123 456 7890',
        role: 'Usuario'
    }
);

if (result.success) {
    console.log('Usuario registrado exitosamente');
}
```

### Login
```javascript
// Iniciar sesión
const result = await authManager.signIn('usuario@email.com', 'password123');

if (result.success) {
    console.log('Sesión iniciada');
    console.log('Usuario:', authManager.getCurrentUser());
    console.log('Perfil:', authManager.getUserProfile());
}
```

### Verificar Tipo de Usuario
```javascript
// Verificar autenticación y tipo de usuario
if (authManager.isAuthenticated()) {
    const userRole = authManager.getUserRole();
    console.log('Rol del usuario:', userRole);
    
    if (authManager.isAdmin()) {
        console.log('Usuario es administrador');
    }
    
    if (authManager.isWholesaler()) {
        console.log('Usuario es mayorista aprobado');
        console.log('Descuento:', authManager.getWholesaleDiscount() + '%');
    }
    
    if (authManager.isWholesalePending()) {
        console.log('Solicitud de mayorista pendiente');
    }
}
```

### Solicitar ser Mayorista
```javascript
// Aplicar para ser mayorista
const applicationData = {
    business_name: 'Mi Tienda S.A.',
    tax_id: 'RFC123456789',
    business_type: 'Retail',
    business_address: 'Calle Principal 123, Ciudad',
    business_phone: '+52 987 654 3210',
    business_email: 'contacto@mitienda.com',
    website_url: 'https://mitienda.com',
    years_in_business: 5,
    expected_monthly_volume: 50000
};

const result = await authManager.applyForWholesale(applicationData);
if (result.success) {
    console.log('Solicitud de mayorista enviada');
}
```

### Actualizar Perfil
```javascript
// Actualizar información del perfil
const result = await authManager.updateProfile({
    full_name: 'Juan Pérez González',
    phone: '+52 123 456 7890',
    address: 'Nueva dirección 456',
    city: 'Ciudad de México',
    newsletter_subscribed: true
});
```

### Escuchar Cambios de Autenticación
```javascript
// Suscribirse a cambios de autenticación
const unsubscribe = authManager.onAuthChange((isAuthenticated, user, profile) => {
    if (isAuthenticated) {
        console.log('Usuario logueado:', profile.full_name);
        updateUIForLoggedUser(profile);
    } else {
        console.log('Usuario deslogueado');
        updateUIForGuestUser();
    }
});

// Para cancelar la suscripción
// unsubscribe();
```

### Precios para Mayoristas
```javascript
// Los precios se aplican automáticamente en la API
const products = await artesanaAPI.getProducts();

// Si el usuario es mayorista, los precios ya incluyen el descuento
products.products.forEach(product => {
    console.log(`${product.name}: $${product.price}`);
    
    if (product.hasWholesalePricing) {
        console.log(`Descuento aplicado: ${product.wholesaleDiscount}%`);
    }
});
```

## Configuración en HTML

### Incluir los Scripts
```html
<!-- Incluir en el <head> de tus páginas HTML -->
<script src="js/auth-manager.js"></script>
<script src="js/supabase-api-client.js"></script>
```

### Ejemplo de Formulario de Login
```html
<form id="loginForm">
    <input type="email" id="email" placeholder="Email" required>
    <input type="password" id="password" placeholder="Contraseña" required>
    <button type="submit">Iniciar Sesión</button>
</form>

<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const result = await authManager.signIn(email, password);
    
    if (result.success) {
        alert('Sesión iniciada exitosamente');
        location.reload(); // Recargar página para actualizar UI
    } else {
        alert('Error: ' + result.message);
    }
});
</script>
```

### Ejemplo de Formulario de Registro
```html
<form id="registerForm">
    <input type="text" id="fullName" placeholder="Nombre completo" required>
    <input type="email" id="email" placeholder="Email" required>
    <input type="password" id="password" placeholder="Contraseña" required>
    <input type="tel" id="phone" placeholder="Teléfono">
    <select id="role">
        <option value="Usuario">Usuario</option>
        <option value="Mayorista">Solicitar ser Mayorista</option>
    </select>
    <button type="submit">Registrarse</button>
</form>

<script>
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        role: formData.get('role')
    };
    
    const result = await authManager.signUp(
        formData.get('email'),
        formData.get('password'),
        userData
    );
    
    if (result.success) {
        alert('Usuario registrado exitosamente. Revisa tu email.');
    } else {
        alert('Error: ' + result.message);
    }
});
</script>
```

### Mostrar Información del Usuario
```html
<div id="userInfo" style="display: none;">
    <h3>Bienvenido, <span id="userName"></span></h3>
    <p>Rol: <span id="userRole"></span></p>
    <div id="wholesaleInfo" style="display: none;">
        <p>Descuento mayorista: <span id="discountPercent"></span>%</p>
    </div>
    <button id="logoutBtn">Cerrar Sesión</button>
</div>

<div id="guestInfo">
    <a href="login.html">Iniciar Sesión</a> |
    <a href="register.html">Registrarse</a>
</div>

<script>
// Actualizar UI según estado de autenticación
authManager.onAuthChange((isAuthenticated, user, profile) => {
    const userInfo = document.getElementById('userInfo');
    const guestInfo = document.getElementById('guestInfo');
    
    if (isAuthenticated && profile) {
        // Mostrar información del usuario
        document.getElementById('userName').textContent = profile.full_name || 'Usuario';
        document.getElementById('userRole').textContent = profile.role;
        
        // Mostrar info de mayorista si aplica
        if (authManager.isWholesaler()) {
            document.getElementById('discountPercent').textContent = 
                authManager.getWholesaleDiscount();
            document.getElementById('wholesaleInfo').style.display = 'block';
        }
        
        userInfo.style.display = 'block';
        guestInfo.style.display = 'none';
    } else {
        // Mostrar opciones para invitados
        userInfo.style.display = 'none';
        guestInfo.style.display = 'block';
    }
});

// Botón de cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await authManager.signOut();
    location.reload();
});
</script>
```

## SQL para Configurar en Supabase

1. Copia todo el contenido del archivo `supabase_schema.sql`
2. Ve a tu dashboard de Supabase
3. Entra al editor SQL
4. Pega el código y ejecuta

## Funcionalidades Incluidas

### ✅ Autenticación Completa
- Registro con email y contraseña
- Login/logout
- Recuperación de contraseña
- Manejo de sesiones

### ✅ Perfiles de Usuario
- 3 tipos: Usuario, Mayorista, Admin
- Información extendida (teléfono, dirección, etc.)
- Actualización de perfiles

### ✅ Sistema de Mayoristas
- Solicitudes de mayorista
- Aprobación por administradores
- Descuentos automáticos en productos
- Precios especiales

### ✅ Seguridad
- Row Level Security (RLS)
- Políticas de acceso granulares
- Protección de datos sensibles

### ✅ Integración con API
- Precios personalizados automáticos
- Sincronización con sistema de productos existente

## Próximos Pasos Recomendados

1. **Ejecutar el schema SQL** en tu Supabase
2. **Probar la autenticación** con usuarios de prueba
3. **Crear un usuario admin** manualmente en la base de datos
4. **Implementar formularios** de login/registro en tu sitio
5. **Personalizar los estilos** según tu diseño

¡El sistema está listo para usar! 🚀
