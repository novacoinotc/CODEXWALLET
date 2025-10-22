# CodexWallet Tron

Implementación de referencia para CodexWallet orientada a ecosistema Tron con dos superficies principales:

- **Extensión de navegador** que inyecta un proveedor `tronWeb`/`tronLink` compatible en páginas web, ofreciendo gestión básica de cuentas software y sesiones WalletConnect adaptadas a Tron.
- **Aplicación móvil híbrida** basada en React Native que expone almacenamiento seguro, deep links y conexión con dApps mediante WalletConnect o API propietaria.

## Estructura del repositorio

```
.
├── README.md
├── index.html
├── mobile/
│   ├── App.tsx
│   ├── package.json
│   └── src/
│       ├── hooks/
│       │   └── useTronWalletConnect.ts
│       ├── providers/
│       │   └── SecureStorageProvider.tsx
│       ├── screens/
│       │   └── DashboardScreen.tsx
│       └── utils/
│           └── tron.ts
└── web-extension/
    ├── background.js
    ├── contentScript.js
    ├── injected.js
    ├── manifest.json
    ├── popup.css
    ├── popup.html
    ├── popup.js
    └── walletconnect/
        └── tronWalletConnect.js
```

## Extensión de navegador

La carpeta `web-extension/` contiene todos los archivos necesarios para empaquetar la extensión.

### Instalación manual

1. Abra `chrome://extensions` (o el menú equivalente en Edge/Brave).
2. Active el modo desarrollador.
3. Cargue la carpeta `web-extension/` como **extensión sin empaquetar**.

### Funcionalidades clave

- Inyección de un proveedor Tron compatible (`window.tronLink` y `window.tronWeb`) mediante un _content script_.
- Popup principal con gestión básica de cuentas software (generación pseudo determinística, importación y selección).
- Creación de sesiones WalletConnect adaptadas a Tron para compartir con dApps.
- API de fondo que expone métodos como `tron_requestAccounts`, `tron_signMessage`, `tron_signTransaction` y `tron_openWalletConnect` para las dApps integradas.

> **Nota**: La firma criptográfica implementada se basa en un esquema simplificado pensado para entornos de prueba. Para entornos productivos debe sustituirse por firmas ECDSA secp256k1 reales.

## Aplicación móvil híbrida (React Native)

La carpeta `mobile/` contiene un _scaffolding_ ligero orientado a React Native (Expo o CLI bare).

### Configuración

```bash
cd mobile
npm install
npm run start
```

### Elementos destacables

- `SecureStorageProvider` encapsula almacenamiento seguro usando `expo-secure-store`/`react-native-keychain` (configurable).
- Hook `useTronWalletConnect` que maneja handshake, aprobación y desconexión de sesiones WalletConnect específicas para Tron.
- Pantalla `DashboardScreen` que integra lectura de cuentas, conexión mediante deep link (`Linking`) y llamado a API propietaria como respaldo.
- Se usa el icono por defecto de Expo para evitar binaries en el repositorio; añada sus propios assets en `mobile/assets/` si necesita personalización.

## index.html

Se incluye un _playground_ mínimo que interactúa con el proveedor inyectado por la extensión para validar solicitudes de conexión y firma.

## Próximos pasos recomendados

- Sustituir el generador de claves simplificado por criptografía real (TronWeb + secp256k1).
- Integrar envío de transacciones reales contra nodos TronGrid o nodos privados.
- Añadir pruebas automatizadas y pipelines de CI/CD.
