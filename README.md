# Selltium PSG - Sistema de Gestión y Punto de Venta (POS)

Selltium PSG es una solución integral de software empresarial diseñada para optimizar la gestión de inventarios, ventas, clientes y reportes financieros. El sistema combina una interfaz moderna y fluida con un núcleo robusto capaz de manejar operaciones críticas en tiempo real.

## 🚀 Tecnologías Utilizadas

### Frontend (Interfaz de Usuario)
- **React 19**: Biblioteca principal para la construcción de la interfaz.
- **Vite 6**: Herramienta de construcción (build tool) ultra rápida.
- **Tailwind CSS 4**: Framework de diseño para estilos modernos y responsivos.
- **Motion (framer-motion)**: Motor de animaciones para transiciones fluidas y una experiencia de usuario superior.
- **Zustand**: Gestión de estado ligero y eficiente (Auth, Settings).
- **Lucide React**: Set de iconos vectoriales consistentes.
- **Recharts**: Visualización de datos y gráficos analíticos.
- **Sonner**: Sistema de notificaciones tipo toast elegante.
- **Socket.io-client**: Comunicación bidireccional en tiempo real para sincronización de datos.

### Backend (Lógica del Servidor)
- **Node.js**: Entorno de ejecución para Javascript en el servidor.
- **Express**: Framework web para la API REST.
- **Socket.io**: Implementación de WebSockets para notificaciones de cambios en la base de datos a todos los clientes conectados.
- **Better-SQLite3**: Motor de base de datos SQL ligero, rápido y persistente.
- **JWT (JSON Web Token)**: Estándar para la autenticación segura.
- **Bcrypt.js**: Encriptación de contraseñas de alta seguridad.
- **Otplib & QRCode**: Generación y verificación de códigos de autenticación de dos factores (MFA/2FA).

### Herramientas y Utilidades
- **Google Gemini API**: Integración de Inteligencia Artificial para análisis y funciones avanzadas (opcional).
- **jsPDF & jsPDF-Autotable**: Generación de facturas, boletas y reportes en formato PDF desde el navegador.
- **XLSX**: Exportación de datos de inventario y ventas a hojas de cálculo Excel.
- **Zod**: Validación de esquemas de datos tanto en cliente como en servidor.

---

## 🛠️ Funcionalidades Principales

1. **Punto de Venta (POS)**: 
   - Procesamiento rápido de ventas con soporte para múltiples métodos de pago.
   - Generación instantánea de comprobantes (Boletas/Facturas).
   - Manejo de descuentos y cálculo de impuestos.

2. **Gestión de Inventario**:
   - Control de stock con alertas de existencias bajas.
   - Soporte para números de serie únicos por unidad de producto.
   - Categorización jerárquica y gestión de proveedores.

3. **Flujo de Caja y Sesiones**:
   - Control riguroso de aperturas y cierres de caja.
   - Registro detallado de ingresos y egresos.
   - Historial de sesiones por usuario.

4. **Seguridad Avanzada**:
   - Control de acceso basado en roles (RBAC): *Administrador, Estándar, Desarrollador*.
   - Autenticación multifactor (MFA) compatible con Google Authenticator.
   - Registro de auditoría (Audit Logs) para rastrear acciones críticas (quién hizo qué y cuándo).

5. **Reportes y Analítica**:
   - Cuadros de mando (Dashboards) interactivos.
   - Reportes de ventas por periodo, productos más vendidos y rentabilidad.
   - Exportación de auditorías e inventarios.

6. **Sincronización en Tiempo Real**:
   - El sistema emite eventos mediante WebSockets cada vez que hay una mutación de datos (POST, PUT, DELETE), permitiendo que todos los terminales se mantengan actualizados sin recargar manualmente.

---

## 📂 Estructura del Proyecto (Nueva Arquitectura)

El sistema ha sido reorganizado para separar claramente las responsabilidades y aplicar patrones de diseño industriales:

```text
├── client/               # Frontend (React + Vite)
│   ├── index.html        # Punto de entrada del cliente
│   └── src/              # Código fuente de la interfaz
│       ├── components/   # Componentes UI
│       ├── hooks/        # Hooks personalizados
│       ├── lib/          # Utilidades y configuración de API
│       ├── services/     # Servicios de comunicación con el backend
│       └── store/        # Gestión de estado (Zustand)
├── server/               # Backend (Node.js + Express)
│   ├── server.ts         # Punto de entrada del servidor
│   ├── db/               # Configuración de base de datos y esquema
│   ├── middleware/       # Capa de interceptores (Auth, Validaciones)
│   ├── repositories/     # CAPA DE REPOSITORIO: Acceso directo a datos (SQL)
│   ├── routes/           # CAPA DE RUTAS: Endpoints de la API
│   ├── schemas/          # Validaciones de datos (Zod)
│   └── services/         # CAPA DE SERVICIOS: Lógica de negocio y orquestación
├── dist/                 # Archivos compilados para producción
└── vite.config.ts        # Configuración de construcción
```

### Arquitectura Servidor: Service + Repository Layer
Se ha implementado una arquitectura multinivel en el backend:
1. **Rutas**: Gestionan las peticiones HTTP y delegan la lógica a los servicios.
2. **Servicios (Service Layer)**: Contienen la lógica de negocio, validaciones complejas y orquestación de transacciones.
3. **Repositorios (Repository Layer)**: Encapsulan todas las consultas SQL directas a la base de datos (SQLite), proporcionando una interfaz limpia para los datos.

---

## ⚙️ Funcionamiento Técnico

### Base de Datos
El sistema utiliza **SQLite** para la persistencia, lo que permite una configuración "cero" y una portabilidad total. El archivo `database.ts` inicializa automáticamente las tablas necesarias (usuarios, productos, ventas, registros de auditoría, etc.) al arrancar.

### Sincronización de Datos
El servidor intercepta todas las respuestas JSON exitosas de métodos que modifican datos. Si una operación es exitosa, el servidor emite un evento `data_changed` a través de **Socket.io**. El frontend escucha este evento y activa una actualización silenciosa de los datos para garantizar que la información mostrada sea siempre real.

---

## 📝 Instalación y Uso

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar variables de entorno (opcional) en `.env`.
3. Iniciar el sistema en modo desarrollo:
   ```bash
   npm run dev
   ```
4. Para producción, construir y ejecutar:
   ```bash
   npm run build
   npm start
   ```

---

**Selltium PSG** - *Transformando la gestión comercial con tecnología de vanguardia.*
