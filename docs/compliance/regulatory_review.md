# Revisión Regulatoria y Políticas KYC/AML

Este documento resume el análisis regulatorio para la operación de CODEX Wallet con respecto a la custodia de activos, licencias requeridas para la conversión USDT→TRX y las obligaciones de KYC/AML.

## 1. Modelo de negocio: custodia vs no custodia

| Aspecto | Custodia | No custodia |
| --- | --- | --- |
| Control de llaves | Empresa controla claves privadas | Usuario mantiene sus claves |
| Responsabilidad legal | Puede considerarse servicio de custodia de activos digitales | Menor carga regulatoria, depende de funcionalidades |
| Implicaciones | Requiere licencias de custodio/PSP en múltiples jurisdicciones | Enfocarse en cumplimiento AML y registro como VASP si aplica |

**Recomendación**: operar en modelo **no custodial** siempre que sea posible. Si el relayer firma transacciones en nombre del usuario o adelanta gas, evaluar si existe `control efectivo` de fondos y mitigar con:
- Arquitectura de firmas MPC o social recovery donde el usuario mantenga control.
- Contratos que permitan revocar permisos y mover fondos sin intervención del relayer.

## 2. Licencias para conversión USDT→TRX

1. **TRON blockchain** no impone licencias propias, pero la conversión fiat/crypto puede activar normativas locales.
2. Considerar principales jurisdicciones objetivo:
   - **Unión Europea** (MiCA + AMLD5/6): si se ofrece intercambio entre criptoactivos, puede requerirse registro como Proveedor de Servicios de Criptoactivos (CASP). Necesario demostrar políticas AML, gobernanza y capital mínimo.
   - **Estados Unidos**: posibles requisitos de Money Services Business (MSB) ante FinCEN y licencias estatales (transmission). Conversión USDT→TRX puede considerarse transmisión de dinero.
   - **Latinoamérica**: revisar regulaciones específicas (México: ITFs, Argentina: UIF Resolución 300/2014, Brasil: Bacen/Receita, etc.).
3. Si se usan rampas de terceros (exchanges, OTC), asegurar que ellos posean las licencias y establecer contratos de responsabilidad compartida.
4. Mantener registro legal actualizado y consultar asesoría especializada antes de operar en nueva jurisdicción.

## 3. Políticas KYC/AML

### 3.1 Alcance

Aplican cuando:
- Se ofrece onboarding fiat o conversión de tokens con valor monetario.
- El relayer adelanta fondos o mantiene cuentas omnibus.
- Se ejecuta programa de referidos con incentivos monetarios.

### 3.2 Procedimientos KYC

1. **Identificación**: recopilación de nombre, fecha de nacimiento, dirección y documento oficial (pasaporte, DNI, licencia).
2. **Verificación**: uso de proveedor externo (Onfido, Sumsub) con verificación biométrica y chequeo de autenticidad del documento.
3. **Screening**: listas PEP, sanciones (OFAC, UE, ONU), watchlists locales.
4. **Riesgo**: asignación de score bajo/medio/alto; aplicar enhanced due diligence (EDD) a scores altos.
5. **Re-evaluación**: revisión cada 12 meses o ante cambios significativos.

### 3.3 Procedimientos AML

- **Monitoreo transaccional**:
  - Reglas heurísticas (volumen, frecuencia, países de riesgo).
  - Integración con herramientas de análisis de cadena (Chainalysis, TRM Labs) para rastrear fondos.
- **Reportes**:
  - Suspicious Activity Reports (SAR) ante autoridades competentes en máximo 30 días desde la detección.
  - Registro de reportes en base segura y cifrada.
- **Conservación de datos**: al menos 5 años posteriores a la relación comercial (ver normativa local).
- **Capacitación**: entrenamientos AML anuales obligatorios para personal relevante.

### 3.4 Privacidad y protección de datos

- Cumplir con GDPR/leyes locales (consentimiento, derecho de acceso, borrado, minimización de datos).
- Contratos con proveedores KYC deben incluir cláusulas de tratamiento de datos y subprocesadores.
- Implementar cifrado en tránsito y reposo, controles de acceso RBAC y logging.

## 4. Gobernanza y documentación

- Designar un **Compliance Officer** responsable.
- Mantener políticas aprobadas por dirección y revisadas al menos cada año.
- Registro de auditorías internas y externas (financieras y de cumplimiento).
- Tabla de mapeo regulatorio por país en `docs/compliance/jurisdictions.xlsx` (pendiente de creación).

## 5. Próximos pasos

1. Validar modelo de negocio (custodia/no custodia) con arquitectos técnicos y legales.
2. Contratar asesoría externa para licencias en mercados objetivo prioritarios.
3. Implementar proveedor KYC/AML y conectarlo al flujo de onboarding.
4. Elaborar procedimientos operativos (SOP) para revisión manual y escalamiento.
5. Programar auditoría de cumplimiento anual y pruebas de penetración enfocadas en controles AML.

Este documento debe actualizarse según evolucione el producto, acuerdos con terceros y cambios regulatorios.
