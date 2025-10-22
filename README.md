# CodexWallet Tron Gasless Relayer

Este repositorio contiene un prototipo de relayer para transacciones gasless en la red Tron. El servicio recibe una transacción firmada, estima el costo en TRX, cobra USDT equivalentes usando un oráculo de precios y realiza el swap automático de USDT→TRX antes de reenviar la transacción a la red.

## Componentes

- `relayer/config.js`: configuración del servicio y parámetros de riesgo.
- `relayer/oracle.js`: integración con un oráculo de precios (CoinGecko por defecto) para conocer el precio del TRX.
- `relayer/state.js`: persistencia simple en disco para límites diarios y uso por usuario.
- `relayer/swapper.js`: integración con SunSwap para convertir USDT en TRX.
- `relayer/relayer.js`: lógica principal del relayer (verificaciones KYC opcionales, límites, swaps y reenvío).

## Flujo de alto nivel

1. El cliente envía al relayer una transacción Tron previamente firmada junto con su identificador y, opcionalmente, datos KYC.
2. El relayer estima el consumo de energía y ancho de banda para determinar el costo en TRX.
3. Se consulta el oráculo de precios para convertir el costo en TRX a USDT.
4. Se aplican los límites de riesgo (diario y por usuario) y se verifica el estado KYC si está habilitado.
5. El relayer ejecuta un swap USDT→TRX (SunSwap) o utiliza un buffer interno de TRX como respaldo.
6. La transacción se retransmite a la red Tron usando la cuenta del relayer.
7. Se registran los costos para mantener los límites diarios.

## Puesta en marcha

1. Crear un archivo `.env` o exportar las variables necesarias:

```bash
export TRON_FULLNODE_URL="https://api.trongrid.io"
export TRON_API_KEY="<TRON_GRID_API_KEY>"
export TRON_RELAYER_PRIVATE_KEY="<PRIVATE_KEY>"
export TRON_USDT_CONTRACT="TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
export SUNSWAP_ROUTER="TPpSeYd2CrFbwzfo98rxhLT8Dnc5QwtAuT"
```

2. Instalar dependencias:

```bash
npm install
```

3. Ejecutar el relayer:

```bash
npm start
```

El servicio queda listo para integrar con un backend HTTP/WebSocket que entregue las transacciones firmadas.

## Consideraciones de seguridad

- **KYC opcional**: habilitar `KYC_REQUIRED=true` y proporcionar un `kycProvider` para bloquear operaciones no verificadas.
- **Límites**: ajustar `DAILY_TRX_LIMIT`, `DAILY_USDT_LIMIT` y `PER_USER_USDT_LIMIT` según la tolerancia al riesgo.
- **Swap**: definir una estrategia de liquidez alternativa (`LIQUIDITY_STRATEGY=internal`) si se prefiere usar reservas propias.
- **Persistencia**: la implementación usa un archivo JSON local (`relayer_state.json`). Para producción se recomienda un almacenamiento transaccional.

## Extensiones futuras

- Añadir API REST/GraphQL para enviar transacciones al relayer.
- Registrar operaciones en una base de datos auditada.
- Integrar proveedores de KYC externos y listas de sanciones.
- Gestionar múltiples fuentes de liquidez y estrategias de cobertura.
