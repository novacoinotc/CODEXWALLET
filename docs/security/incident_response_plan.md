# Plan de Respuesta a Incidentes y Gestión de Vulnerabilidades

Este plan establece los procedimientos para responder a incidentes de seguridad, gestionar bugs y administrar el programa de recompensas.

## 1. Equipo de respuesta (IRT)

| Rol | Responsabilidades | Suplente |
| --- | --- | --- |
| Líder de Seguridad | Coordina la respuesta, comunica con stakeholders | CTO |
| Analista de Seguridad | Análisis técnico, contención y erradicación | DevSecOps |
| Responsable de Producto | Prioriza releases de fix, comunicación con clientes | PM |
| Legal/Compliance | Gestión regulatoria y notificación a autoridades | Asesor legal |
| Comunicaciones | Mensajes públicos y privados, FAQs | Marketing |

## 2. Ciclo de vida de incidentes

1. **Detección y reporte**
   - Fuentes: alertas de monitoreo, pipeline de seguridad, bug bounty, usuarios.
   - Canal centralizado: `security@codexwallet.com` y formulario interno.
2. **Clasificación**
   - Severidades: Crítico, Alto, Medio, Bajo.
   - Criterios basados en impacto a fondos, disponibilidad y reputación.
3. **Contención**
   - Pausa de contratos (si existe `CircuitBreaker`).
   - Suspensión del relayer o modo solo-lectura.
   - Revocación de claves comprometidas y rotación inmediata.
4. **Erradicación y recuperación**
   - Desarrollo de parches en ramas protegidas.
   - Pruebas automatizadas + manuales antes de despliegue.
   - Reanudación gradual de servicios con monitoreo reforzado.
5. **Lecciones aprendidas**
   - Postmortem en 5 días hábiles.
   - Actualización de controles y documentación.

## 3. Flujos de comunicación

- **Interno**: canal `#security-incidents` en Slack con acceso restringido.
- **Stakeholders**: notificación a socios, inversores y proveedores críticos según severidad.
- **Usuarios**: comunicado público en sitio web, redes y correo si hay impacto directo.
- **Autoridades**: según jurisdicción (ver sección regulatoria), se notifica dentro de 72h.

## 4. Gestión de bugs y backlog

- Uso de tablero `Security` en Jira:
  - Columna `Triage`, `En curso`, `En revisión`, `Listo para desplegar`.
- SLA de vulnerabilidades (ver pipeline).
- Validación por el equipo de seguridad antes de cerrar.
- Reportes mensuales de métricas (bugs abiertos, tiempo medio, etc.).

## 5. Programa de bug bounty

- Plataforma: Immunefi o HackenProof.
- Alcance inicial: contratos desplegados en testnet/mainnet, API pública del relayer.
- Recompensas sugeridas:
  - Crítico: 20 000 - 50 000 USDT.
  - Alto: 5 000 - 20 000 USDT.
  - Medio: 1 000 - 5 000 USDT.
  - Bajo: reconocimiento y swag.
- Reglas clave:
  - Coordinated Disclosure: periodo de embargo de 90 días.
  - Prohibido ataque a servicios de terceros o DoS prolongado.
  - Pruebas deben realizarse en testnet salvo coordinación previa.
- Proceso:
  1. Recepción y acuse en 24h.
  2. Evaluación técnica en 3 días.
  3. Pago dentro de 14 días tras validación.
  4. Publicación de hallazgos (si aplica) luego de remediación.

## 6. Integración con DevOps

- Playbooks automatizados en `runbooks/` para contención (despliegue de parches, revocación de claves, rollback).
- Alertas sincronizadas con PagerDuty (guardias 24/7).
- Backups cifrados diarios verificados durante respuesta.

## 7. Mantenimiento del plan

- Revisión semestral por el comité de seguridad.
- Ejercicios de tabletop trimestrales con participación de todo el IRT.
- Actualización de contactos y suplentes en cada incorporación o salida del equipo.

Este plan debe ser conocido y practicado por todos los miembros del equipo involucrado, y ajustado a medida que el producto evoluciona.
