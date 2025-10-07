# 🎯 Migración wholesalers → user_profiles

## ¿Cuál Guía Usar?

### 🚀 **SIMPLE** - Datos de Prueba (RECOMENDADO para ti)

**Usa:** `SIMPLE-README.md` + `00-clean-start.sql`

**Cuándo:**
- ✅ Todos los mayoristas son de prueba
- ✅ No hay datos reales importantes
- ✅ Quieres empezar limpio

**Tiempo:** 2-5 minutos

**Proceso:**
1. Ejecutar `00-clean-start.sql` en Supabase
2. Crear mayoristas desde admin dashboard
3. Listo!

---

### 🔄 **COMPLETA** - Datos Reales en Producción

**Usa:** `README.md` + Scripts 01, 02, 03

**Cuándo:**
- ⚠️ Tienes mayoristas REALES con pedidos
- ⚠️ NO puedes perder datos
- ⚠️ Necesitas migración completa

**Tiempo:** 20-30 minutos

**Proceso:**
1. Backup de datos
2. Migración gradual (3 fases)
3. Testing extensivo
4. Notificar usuarios

---

## 📊 Comparación

| Característica | SIMPLE | COMPLETA |
|----------------|--------|----------|
| Datos de prueba | ✅ | ❌ |
| Datos reales | ❌ | ✅ |
| Backup necesario | No | Sí |
| Tiempo | 2-5 min | 20-30 min |
| Complejidad | Baja | Media |
| Migración de datos | No | Sí |
| Rollback | No necesario | Incluido |

---

## 🎯 TU CASO

**Según dijiste:** "todos eran de prueba"

👉 **USA LA VERSIÓN SIMPLE**

**Archivo:** `SIMPLE-README.md`

---

## 📁 Estructura de Archivos

```
sql/migration/
├── START-HERE.md ← Estás aquí
├── SIMPLE-README.md ← Para datos de prueba ⭐
├── 00-clean-start.sql ← Script simple ⭐
├── README.md ← Para datos reales
├── QUICK-START.md ← Guía rápida (datos reales)
├── 01-add-wholesale-fields.sql
├── 02-create-compatibility-view.sql
└── 03-migrate-wholesalers-data.sql
```

---

## ⚡ Quick Start (Datos de Prueba)

```sql
-- 1. Copia y ejecuta en Supabase:
-- Archivo: 00-clean-start.sql

-- 2. Listo! Ahora crea mayoristas desde:
-- http://localhost:8000/admin/dashboard.html
```

---

**¿Listo para empezar?** Abre `SIMPLE-README.md` 🚀
