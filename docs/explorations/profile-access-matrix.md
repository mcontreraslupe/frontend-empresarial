# Matriz de Accesos y Control de Navegación por Perfil

Este documento detalla los resultados obtenidos durante la fase de exploración y descubrimiento no destructivo de perfiles y módulos en el ambiente de QA de la plataforma SUCAL.

> [!NOTE]
> Esta matriz fue extraída inspeccionando directamente el DOM real de la aplicación en sesiones aisladas, sin modificar datos ni ejecutar acciones destructivas. Ninguna credencial, RUT o información confidencial está documentada aquí.

---

## 1. Resumen de Perfiles y Comportamiento Inicial

| Perfil Funcional | Identificador en Encabezado (UI) | Pantalla Post-Login           | Requiere Selección de Plataforma |
| :--------------- | :------------------------------- | :---------------------------- | :------------------------------- |
| **EECC**         | `EMPRESA CONTRATISTA FULL`       | `/v2/account/select-platform` | Sí (Ir a Acreditación)           |
| **ADC CODELCO**  | `ADC CODELCO`                    | `/v2/inicio`                  | No (Ingreso directo a Inicio)    |
| **DGFREC**       | `DGFREC`                         | `/v2/account/select-platform` | Sí (Ir a Acreditación)           |
| **AUDITOR/A**    | `AUDITOR/A`                      | `/v2/account/select-platform` | Sí (Ir a Acreditación)           |
| **INSPECTOR**    | `INSPECTOR CERT. LABORAL`        | `/v2/account/select-platform` | Sí (Ir a Acreditación)           |
| **SUPERVISOR**   | `SUPERVISOR`                     | `/v2/account/select-platform` | Sí (Ir a Acreditación)           |

---

## 2. Detalle de Accesos por Perfil

### 2.1 Perfil: EECC (Empresa Contratista)

- **Nombre en Interfaz:** `EMPRESA CONTRATISTA FULL`
- **Página Inicial:** `/v2/account/select-platform` -> Acreditación (`/v2/inicio`)
- **Módulos Permitidos (18):**
  1. Usuarios
  2. Empresas / Contratos
  3. Personas
  4. Licencia de Conducir
  5. Vehículos
  6. Credencialización
  7. Cursos
  8. Medición de Dotación de Empresas Contratistas
  9. Visitas
  10. Carpeta Arranque
  11. Control Dotacional
  12. Vacunas
  13. Alimentación
  14. Consultar Fichas
  15. Bolsa de Empleabilidad
  16. Reportes Flexibles
  17. Certificaciones Especiales
  18. Repositorio
- **Submódulos Destacados:**
  - _Empresas / Contratos:_ Lista de Solicitudes, Mi Empresa
  - _Personas:_ Lista de Solicitudes Creadas, Lista de Solicitudes Atributos Adicionales
- **Módulos Restringidos (11):**
  - Aplicabilidad Control Laboral
  - Bel
  - Consultar Solicitudes
  - Excepciones
  - Gestión Estructura Codelco
  - Informe Incunplimiento de Jornadas
  - Reconocimiento Para ti
  - Reportes
  - Segunda Validación
  - Sindicalización
  - Soporte
- **Módulo de Prueba:** _Empresas / Contratos_ -> _Lista de Solicitudes_ (`/v2/empresas/contratos`)

---

### 2.2 Perfil: ADC CODELCO (Administrador de Contrato Codelco)

- **Nombre en Interfaz:** `ADC CODELCO`
- **Página Inicial:** `/v2/inicio` (acceso directo)
- **Módulos Permitidos (15):**
  1. Empresas / Contratos
  2. Personas
  3. Licencia de Conducir
  4. Vehículos
  5. Medición de Dotación de Empresas Contratistas
  6. Reportes
  7. Gestión Estructura Codelco
  8. Carpeta Arranque
  9. Control Dotacional
  10. Consultar Fichas
  11. Reconocimiento Para ti
  12. Bel
  13. Certificaciones Especiales
  14. Informe Incunplimiento de Jornadas
  15. Repositorio
- **Submódulos Destacados:**
  - _Empresas / Contratos:_ Lista de Solicitudes a Validar
  - _Personas:_ Lista de Solicitudes a Validar
  - _Licencia de Conducir:_ Lista de Solicitudes Pendientes a Validar
  - _Vehículos:_ Lista de Solicitudes de Maquinarias a Validar, Lista de Solicitudes de Vehículos a Validar
- **Módulos Restringidos (13):**
  - Alimentación
  - Aplicabilidad Control Laboral
  - Bolsa de Empleabilidad
  - Consultar Solicitudes
  - Credencialización
  - Cursos
  - Excepciones
  - Segunda Validación
  - Sindicalización
  - Soporte
  - Usuarios
  - Vacunas
  - Visitas
- **Módulo de Prueba:** _Empresas / Contratos_ -> _Lista de Solicitudes a Validar_ (`/v2/empresas/validador`)

---

### 2.3 Perfil: DGFREC

- **Nombre en Interfaz:** `DGFREC`
- **Página Inicial:** `/v2/account/select-platform` -> Acreditación (`/v2/inicio`)
- **Módulos Permitidos (24):**
  1. Usuarios
  2. Empresas / Contratos
  3. Personas
  4. Vehículos
  5. Credencialización
  6. Excepciones
  7. Medición de Dotación de Empresas Contratistas
  8. Aplicabilidad Control Laboral
  9. Reportes
  10. Visitas
  11. Carpeta Arranque
  12. Gestión Estructura Codelco
  13. Segunda Validación
  14. Control Dotacional
  15. Consultar Fichas
  16. Reconocimiento Para ti
  17. Bolsa de Empleabilidad
  18. Bel
  19. Sindicalización
  20. Soporte
  21. Consultar Solicitudes
  22. Reportes Flexibles
  23. Informe Incunplimiento de Jornadas
  24. Repositorio
- **Submódulos Destacados:**
  - _Empresas / Contratos:_ Lista de Solicitudes a Validar
  - _Usuarios:_ Lista de Solicitudes a Validar
- **Módulos Restringidos (4):**
  - Alimentación
  - Cursos
  - Licencia de Conducir
  - Vacunas
- **Módulo de Prueba:** _Empresas / Contratos_ -> _Lista de Solicitudes a Validar_ (`/v2/empresas/validador`)

---

### 2.4 Perfil: AUDITOR/A

- **Nombre en Interfaz:** `AUDITOR/A`
- **Página Inicial:** `/v2/account/select-platform` -> Acreditación (`/v2/inicio`)
- **Módulos Permitidos (1):**
  1. Consultar Fichas
- **Submódulos:** Sin submódulos desplegables (menú directo).
- **Módulos Restringidos (28):**
  - Todos los demás módulos de la plataforma (Empresas / Contratos, Personas, Vehículos, Reportes, Usuarios, etc.).
- **Módulo de Prueba:** _Consultar Fichas_

---

### 2.5 Perfil: INSPECTOR

- **Nombre en Interfaz:** `INSPECTOR CERT. LABORAL`
- **Página Inicial:** `/v2/account/select-platform` -> Acreditación (`/v2/inicio`)
- **Módulos Permitidos (8):**
  1. Empresas / Contratos
  2. Personas
  3. Licencia de Conducir
  4. Vehículos
  5. Reportes
  6. Visitas
  7. Consultar Fichas
  8. Reportes Flexibles
- **Submódulos Destacados:**
  - _Empresas / Contratos:_ Consulta de Solicitudes
  - _Personas:_ Consulta de Solicitudes
  - _Licencia de Conducir:_ Consulta de Solicitudes
  - _Vehículos:_ Consulta de Solicitudes
- **Módulos Restringidos (21):**
  - Alimentación, Aplicabilidad Control Laboral, Bel, Bolsa de Empleabilidad, Carpeta Arranque, Certificaciones Especiales, Consultar Solicitudes, Control Dotacional, Credencialización, Cursos, Excepciones, Gestión Estructura Codelco, Informe Incunplimiento de Jornadas, Medición de Dotación de Empresas Contratistas, Reconocimiento Para ti, Repositorio, Segunda Validación, Sindicalización, Soporte, Usuarios, Vacunas.
- **Módulo de Prueba:** _Empresas / Contratos_ -> _Consulta de Solicitudes_ (`/v2/empresas/contratos/consulta`)

---

### 2.6 Perfil: SUPERVISOR

- **Nombre en Interfaz:** `SUPERVISOR`
- **Página Inicial:** `/v2/account/select-platform` -> Acreditación (`/v2/inicio`)
- **Módulos Permitidos (1):**
  1. Consultar Fichas
- **Submódulos:**
  - _Consultar Fichas:_ Consulta Ficha Propios
- **Módulos Restringidos (28):**
  - Todos los demás módulos de la plataforma.
- **Módulo de Prueba:** _Consultar Fichas_ -> _Consulta Ficha Propios_ (`/v2/fichas/ficha-propios`)

---

## 3. Elementos Globales de Navegación y Sesión

- **Elemento de Perfil:** Se visualiza en la barra superior (`.layout-topbar-right b`).
- **Mecanismo de Cierre de Sesión:**
  1. Hacer clic en el avatar del usuario (`.topbar-item.user-profile > a`).
  2. Hacer clic en la opción desplegable `Cerrar Sesión` (`.topbar-item.user-profile a`).
  3. Confirmar en el diálogo modal interactivo presionando el botón `Sí` (`p-dialog` -> botón accesible `Sí`).
  4. Redirección automática y validación de llegada a `/sign-in`.
- **Rutas Restringidas:** Navegaciones directas hacia rutas no autorizadas redirigen de forma segura hacia `/not-found` sin divulgar datos ni permitir acceso.
