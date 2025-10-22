# Pipeline de Seguridad para Contratos y Relayer

Este documento detalla el flujo de seguridad continuo para los contratos inteligentes del proyecto y el relayer asociado. El objetivo es detectar vulnerabilidades de forma temprana, ejecutar pruebas de fuzzing y coordinar auditorías externas periódicas.

## 1. Herramientas y configuración

### 1.1 Análisis estático de contratos
- **Slither**: análisis de patrones de vulnerabilidad y métricas de calidad.
  - Configuración en `slither.config.json` con rutas hacia la carpeta `contracts/`.
  - Se ejecuta en cada commit a ramas activas y diariamente en `main`.
- **Mythril** (modo análisis estático/simbólico): identifica posibles flows de control inseguros.
  - Se ejecuta semanalmente en pipelines nocturnos debido a su coste.
- **Solhint**: linting de estilo y estándares de seguridad (naming, visibilidad, etc.).

### 1.2 Análisis estático del relayer
- **ESLint + TypeScript** (o lenguaje equivalente): reglas extendidas con `eslint-plugin-security`.
- **Semgrep**: reglas personalizadas para patrones específicos (inyecciones, uso inseguro de librerías Tron/HTTP).
- **Snyk Code/OSS**: escaneo de dependencias para CVEs conocidas.

### 1.3 Fuzzing de contratos
- **Echidna**:
  - Casos de prueba definidos en `contracts/test/echidna/`.
  - Objetivos: invariantes de balances, control de acceso y límites de gas.
  - Ejecución continua en cada merge request y corrida extendida nocturna (>=1h).
- **Foundry (forge fuzz)** como alternativa rápida dentro de CI.

### 1.4 Fuzzing del relayer
- **AFL/LibFuzzer vía cargo-fuzz o Jazzer** según lenguaje.
- Fuzzing dirigido a parsers de mensajes, serialización/deserialización Tron y validación de firmas.
- Corredores dedicados en infraestructura con límite de 2h y cobertura mínima requerida (>80%).

### 1.5 Auditorías externas
- Selección de firma acreditada (p.ej., CertiK, OpenZeppelin, Hacken).
- Alcance: contratos principales, librerías auxiliares y relayer (código y despliegues).
- Auditorías completas en hitos clave (antes de mainnet, cada actualización crítica) y revisiones de seguimiento trimestrales.

## 2. Integración en CI/CD

1. **Trigger**: cada Pull Request y nightly builds en `main`.
2. **Jobs**:
   - `lint-contracts`: Solhint.
   - `static-contracts`: Slither (fast) + Mythril (condicionado a etiquetas `run-mythril`).
   - `fuzz-contracts`: Echidna corto (15 minutos) + Foundry fuzz.
   - `lint-relayer`: ESLint/Semgrep.
   - `deps-audit`: Snyk OSS + `npm audit`/`yarn audit`.
   - `fuzz-relayer`: LibFuzzer/Jazzer modo humo (5 minutos) y pipeline extendida nocturna.
3. **Artefactos**: reportes en formato SARIF subidos a Security tab de GitHub/GitLab.
4. **Gates**: PRs se bloquean si hay fallos de severidad alta o media sin excepción aprobada por Seguridad.
5. **Alertas**: integración con Slack/Teams para notificar fallos críticos.

## 3. Gestión de resultados

- Los reportes se almacenan en `s3://security-reports/codexwallet/<fecha>`.
- Issues de seguridad se crean automáticamente en el repositorio privado de seguridad.
- SLA de remediación:
  - Críticos: 24h.
  - Altos: 3 días.
  - Medios: 7 días.
  - Bajos: backlog planificado.

## 4. Checklist previa a despliegues

1. Último escaneo Slither/Mythril sin hallazgos críticos.
2. Cobertura de fuzzing >80% en rutas críticas.
3. Revisar reporte de auditoría externa vigente (<6 meses).
4. Confirmar mitigaciones aplicadas y validadas.
5. Ejecutar `hardhat test`/`forge test` y pruebas de integración del relayer.

## 5. Métricas y mejora continua

- Porcentaje de PRs bloqueados por seguridad.
- Tiempo medio de remediación.
- Cobertura de fuzzing y número de invariantes.
- Revisión trimestral del pipeline con retroalimentación del equipo.

## 6. Recursos

- Plantillas de configuración en `infrastructure/security/` (pendiente de creación).
- Documentación interna sobre patrones seguros de Tron/USDT.

Este pipeline debe mantenerse actualizado con los cambios de arquitectura y dependencias. Cualquier excepción o bypass requiere aprobación del CISO o responsable de seguridad.
