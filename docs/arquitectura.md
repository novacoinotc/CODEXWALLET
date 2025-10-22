# Arquitectura de la billetera Tron gas-free

## Selección de blockchain y mapeo de cuentas
- **Red objetivo:** Tron mainnet o sidechain compatible con la máquina virtual de Tron (TVM), priorizando baja latencia y costos mínimos.
- **Compatibilidad con TronLink:** Las cuentas de usuario se basan en claves `secp256k1`. Se firma con `SHA-256` sobre el payload y se codifica mediante el esquema de firmas Tron (idéntico a ECDSA sobre `secp256k1`).
- **Mapeo de cuentas:**
  - Identificador de cuenta interno = dirección Tron base58 derivada de la clave pública.
  - El backend almacena un registro `user_id ↔ tron_address` sin custodiar la clave privada.
  - Para integraciones con sidechain, se utiliza un contrato puente que mantiene la correspondencia `tron_address ↔ sidechain_address`.

## Modelo gas-free
- **Contratos de patrocinio (energy/bandwidth):**
  - Se despliega un contrato `SponsorManager` que registra direcciones patrocinadas y asigna cuotas de energía.
  - El contrato mantiene saldo de TRX para cubrir `bandwidth` y `energy` de contratos core.
- **Conversión automática USDT → TRX/gas:**
  - Backend vigila balances de TRX; si el umbral cae por debajo del límite, intercambia automáticamente USDT del pool operativo a TRX usando un DEX (JustSwap) o API de mercado.
  - Los swaps son firmados por una cuenta multisig de la empresa.
- **Relayer de transacciones:**
  - Backend actúa como `meta-transaction relayer`: recibe payloads firmados por usuarios, agrega cabeceras y paga gas con cuenta patrocinadora.
  - Alternativamente, un contrato `GasRelayer` verifica firmas off-chain y ejecuta llamadas con `delegatecall`, usando fondos del patrocinador.

## Pantallas clave de la app
1. **Home / Dashboard**
   - Mostrar balance total en TRX y USDT, movimientos recientes y estado del patrocinio (cuota disponible).
   - Indicadores de staking activo y recompensas pendientes.
2. **Enviar**
   - Formulario para seleccionar token (TRX/USDT), dirección destino, importe y memo opcional.
   - Validación de dirección Tron (base58) y confirmación de tasa de cambio si hay conversión de gas.
3. **Recibir**
   - Muestra dirección Tron y QR, opción de copiar.
   - Historial de solicitudes de pago generadas y estado de cada una.
4. **Staking**
   - Resumen de energía/bandwidth en stake, con opción de congelar/descongelar TRX.
   - Visualización de APY estimado y recompensas reclamables.
5. **Configuración**
   - Gestión de seguridad (verificación biométrica, PIN).
   - Preferencias de idioma, moneda fiat base y control de notificaciones.

## Requerimientos de seguridad
- **Almacenamiento local cifrado:** Llaves privadas y credenciales sensibles se guardan en `Secure Enclave` (iOS), `Android Keystore` o almacenamiento web cifrado (WebCrypto + IndexedDB).
- **Backup con seed:**
  - Proceso de onboarding genera una frase mnemónica BIP39 de 12/24 palabras.
  - Se ofrece guía paso a paso para anotarla y verificación de orden.
  - Opcional: backup cifrado en la nube con contraseña adicional (Secret Sharing).
- **Protección contra replay y phishing:**
  - Nonces en las transacciones y whitelist de contratos oficiales.
  - Alertas en UI cuando la dirección destino no coincide con contactos confiables.
- **Endurecimiento del backend:**
  - Cuentas patrocinadoras con multisig y monitoreo en tiempo real.
  - Auditorías regulares de contratos (TronScan + proveedores externos).
