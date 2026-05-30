# PedidosOficina 🎂

App web para gestionar pedidos de comida en la oficina, habilitada en días de cumpleaños.

## Stack
- Firebase Firestore (base de datos)
- Vanilla JS con módulos ES
- GitHub Pages (hosting gratuito)

## Estructura de Firestore

### Colección `usuarios`
```
{
  nombre: "Juan Pérez",
  rutClean: "123456789",   // RUT sin puntos ni guión, en mayúsculas
  rol: "usuario"           // o "admin"
}
```

### Colección `cumpleanos`
```
{
  nombre: "Juan Pérez",
  mes: 3,    // número de mes (1-12)
  dia: 15    // día del mes
}
```

### Colección `locales`
```
{
  id: "fuente-alemana",
  nombre: "Fuente Alemana",
  descripcion: "Concepción · Completos y sándwiches",
  emoji: "🌭"
}
```

### Colección `menu_items`
```
{
  localId: "fuente-alemana",
  categoria: "Completos",
  nombre: "Completo Italiano",
  descripcion: "Con tomate, palta y mayonesa",
  precio: 3200,
  emoji: "🌭"
}
```

### Colección `pedidos`
```
{
  usuarioId: "...",
  nombreUsuario: "Juan Pérez",
  localId: "fuente-alemana",
  localNombre: "Fuente Alemana",
  items: [...],
  total: 4400,
  fecha: Timestamp,
  estado: "pendiente"
}
```

## Configuración inicial en Firestore

### 1. Crear el usuario admin
En la consola de Firebase → Firestore → colección `usuarios`, crea un documento:
```
nombre: "Tu nombre"
rutClean: "TU_RUT_SIN_PUNTOS_NI_GUION"   // Ej: "123456789"  (sin el K si termina en K)
rol: "admin"
```

### 2. Crear el local Fuente Alemana
En colección `locales`, crea un documento con ID `fuente-alemana`:
```
nombre: "Fuente Alemana"
descripcion: "Concepción · Completos y sándwiches"
emoji: "🌭"
```

### 3. Importar el menú
Entra como admin → tab "Menú" → "Importar desde Justo"
Esto carga el menú de respaldo con los productos principales.

### 4. Configurar reglas de Firestore
En Firebase Console → Firestore → Reglas, pega el contenido de `firestore.rules`

## Despliegue en GitHub Pages

1. Crea un repo en GitHub llamado `pedidos-oficina`
2. Sube todos los archivos
3. Ve a Settings → Pages → Branch: main → / (root)
4. La app quedará en: `https://tuusuario.github.io/pedidos-oficina`

## Usuario admin
El usuario con `rol: "admin"` en Firestore accede al panel de administración
al ingresar su RUT. Desde ahí puede:
- Ver pedidos del día
- Gestionar cumpleaños
- Crear/eliminar usuarios
- Gestionar el menú
