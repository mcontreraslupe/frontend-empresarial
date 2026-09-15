# Frontend Empresarial - Framework de Automatización E2E

Framework de pruebas de extremo a extremo (E2E) para aplicaciones empresariales, construido con **Playwright Test** y **TypeScript**, aplicando patrones de diseño mantenibles (Page Objects, Component Objects y Fixtures).

---

## 🚀 Requisitos Previos

- [Node.js](https://nodejs.org/) 22.13 o superior dentro de la rama 22, o versión 24 o superior. CI utiliza Node 22, definido en `.nvmrc`.
- Gestor de paquetes `npm`.

En Windows PowerShell, utiliza `npm.cmd` y `npx.cmd` si `npm` o `npx` fallan al cargar sus scripts `.ps1`. Por ejemplo:

```powershell
npm.cmd ci
npx.cmd playwright install
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
```

Esto permite ejecutar las herramientas sin modificar la instalación global ni la política de ejecución de PowerShell.

---

## ⚙️ Configuración Inicial de Ambientes

Por seguridad, los archivos que contienen credenciales y URLs de los ambientes **no** se encuentran versionados en el repositorio. Para crearlos localmente, utiliza la plantilla `environments/.env.example`:

### En Windows PowerShell:

```powershell
Copy-Item environments/.env.example environments/.env.qa
Copy-Item environments/.env.example environments/.env.uat
```

Una vez creados los archivos, complétalos con las credenciales y URLs reales de tu aplicación:

```env
BASE_URL=https://tu-ambiente-qa.empresa.com
ADMIN_USER=usuario_qa
ADMIN_PASSWORD=password_qa
```

> ⚠️ **IMPORTANTE**: Nunca versiones archivos `.env.qa` ni `.env.uat` en el control de versiones. Están expresamente ignorados en `.gitignore`.

---

## 📁 Estructura del Proyecto

```text
frontend-empresarial/
├── environments/               # Plantillas y variables de entorno por ambiente
│   └── .env.example            # Plantilla con variables vacías (versionada)
├── src/
│   ├── config/                 # Carga tipada de ambientes y validación segura
│   ├── pages/                  # Page Objects (vistas de la aplicación)
│   ├── components/             # Component Objects (elementos reusables)
│   ├── fixtures/               # Fixtures personalizadas (inyección de dependencias)
│   ├── data/                   # Datos de prueba estáticos y dinámicos
│   └── utils/                  # Utilidades y funciones transversales
├── tests/                      # Casos de prueba automatizados agrupados por módulo
├── AGENTS.md                   # Políticas obligatorias para desarrollo y asistentes IA
├── playwright.config.ts         # Configuración central (multi-ambiente, reporters, media)
├── tsconfig.json               # Configuración de TypeScript y path aliases
└── package.json                # Dependencias y scripts de ejecución
```

---

## 🧪 Scripts de Ejecución

### Ejecución de Pruebas

| Comando                      | Descripción                                                                                                   |
| :--------------------------- | :------------------------------------------------------------------------------------------------------------ |
| `npm run test`               | Ejecuta todas las pruebas en modo headless (ambiente QA por defecto).                                         |
| `npm run test:headed`        | Ejecuta las pruebas con el navegador visible.                                                                 |
| `npm run test:qa`            | Ejecuta las pruebas apuntando explícitamente al ambiente **QA**.                                              |
| `npm run test:uat`           | Ejecuta las pruebas en ambiente **UAT** (configurado con `workers: 1` para ejecución segura).                 |
| `npm run test:smoke`         | Ejecuta exclusivamente las pruebas etiquetadas con `@smoke`.                                                  |
| `npm run test:regression`    | Ejecuta exclusivamente las pruebas etiquetadas con `@regression`.                                             |
| `npm run test:critical`      | Ejecuta las pruebas marcadas con `@critical`.                                                                 |
| `npm run test:unit`          | Verifica la validación y separación de sesiones sin abrir navegadores ni requerir credenciales.               |
| `npm run auth:setup`         | Autentica y genera los archivos de sesión del ambiente activo.                                                |
| `npm run test:authenticated` | Genera la sesión y ejecuta las pruebas autenticadas en Chromium.                                              |
| `npm run test:public`        | Ejecuta en Chromium los escenarios que no reutilizan una sesión guardada; incluye el flujo de login completo. |
| `npm run report`             | Abre el reporte HTML interactivo generado por Playwright.                                                     |
| `npm run report:executive`   | Abre el reporte ejecutivo E2E con indicadores, pasos, cobertura, duración y fallos sanitizados.               |

Cada ejecución genera dos vistas complementarias:

- `playwright-report/index.html`: detalle técnico nativo de Playwright.
- `executive-report/index.html`: reporte exclusivo de casos E2E con tasa de aprobación, distribución por proyecto y etiqueta, casos lentos, búsqueda, filtros, pasos de negocio, acciones técnicas anidadas y detalle sanitizado de fallos.

Los proyectos `unit` y `auth-setup` quedan fuera del reporte ejecutivo; una ejecución que contenga únicamente esos proyectos conserva el último reporte E2E generado. El reporte también guarda `executive-report/summary.json` para integraciones posteriores. Tanto el HTML como el JSON omiten credenciales, identificadores personales y adjuntos sensibles, y están excluidos de Git.

### Calidad y Formato de Código

| Comando                | Descripción                                                               |
| :--------------------- | :------------------------------------------------------------------------ |
| `npm run typecheck`    | Comprueba tipos estáticos de TypeScript con `tsc --noEmit`.               |
| `npm run lint`         | Analiza el código con ESLint aplicando reglas de Playwright y TypeScript. |
| `npm run format`       | Aplica formato consistente a todo el código con Prettier.                 |
| `npm run format:check` | Verifica si existen archivos que no cumplan el formato de Prettier.       |

---

## 🏷️ Estrategia de Etiquetas (Tags)

Las pruebas se clasifican mediante etiquetas nativas de Playwright:

```typescript
test('Validar login exitoso', { tag: ['@smoke', '@critical'] }, async ({ page }) => {
  // ...
});
```

- `@smoke`: Pruebas de verificación rápida del estado general de la aplicación.
- `@critical`: Flujos indispensables para la operación del negocio.
- `@regression`: Cobertura exhaustiva de casos borde, validaciones y regresión.

---

## 🔐 Sesiones por Ambiente y CI

Las sesiones se guardan en `playwright/.auth/qa/` o `playwright/.auth/uat/`. Cada ambiente mantiene sus propios archivos de cookies/localStorage y `sessionStorage.perfil`, ignorados por Git y Prettier. Al actualizar desde las rutas anteriores, ejecuta nuevamente `auth:setup`; no se reutilizan automáticamente las sesiones antiguas.

El workflow ejecuta tipos, lint, formato y pruebas unitarias antes de las pruebas E2E. Para habilitar E2E, configura un environment de GitHub llamado `qa` con:

- Variable `BASE_URL`.
- Secretos `ADMIN_USER` y `ADMIN_PASSWORD`.

Las variables también pueden definirse a nivel de repositorio. El workflow informa únicamente los nombres de las variables faltantes. Los pull requests desde forks ejecutan calidad y pruebas unitarias; E2E requiere acceso a los secretos y se ejecuta en pushes y pull requests del mismo repositorio.

## 📸 Privacidad de Evidencias

Screenshots, videos y traces están desactivados porque la aplicación maneja credenciales y datos personales. También se desactiva la captura automática de snapshots ARIA mediante `PLAYWRIGHT_NO_COPY_PROMPT`. Un reporter de privacidad, configurado antes de HTML/list, omite los valores de los pasos `fill` y sus call logs de error. El reporte HTML conserva los resultados y errores de las pruebas; los errores propios de autenticación no incluyen credenciales, contenido de sesión ni URLs de redirección. Conserva este reporter al personalizar la configuración de reportes.

## 🧪 Cobertura Actual

La suite verifica la pantalla de login, campos obligatorios incompletos, acceso de contratista, selección de Acreditación y visibilidad/apertura/cierre de sus ocho módulos. Las pruebas unitarias cubren sesiones malformadas, perfiles inválidos, conservación del perfil válido y separación QA/UAT.

Las operaciones internas de los módulos, permisos, credenciales inválidas y expiración de sesión requieren escenarios de negocio y validación previa de la UI. Los selectores existentes con `getByTitle` en la selección de plataforma quedan pendientes de revisión humana frente a la estrategia de `AGENTS.md`.

---

## ♿ Observaciones de Accesibilidad Conocidas

Durante la inspección técnica de la pantalla de autenticación se identificaron los siguientes hallazgos de accesibilidad y mantenibilidad (no constituyen defectos funcionales de la aplicación):

- **Falta de asociación semántica en label:** El `<label>` con texto `"Contraseña *"` no posee el atributo `for="password"`, ni envuelve al campo de entrada. En consecuencia, el `<input id="password">` se expone en el árbol de accesibilidad como un control anónimo sin nombre accesible.
- **Identificador duplicado en el DOM:** Tanto el componente contenedor de PrimeNG (`<p-password id="password">`) como el elemento nativo interno (`<input id="password">`) comparten de forma idéntica el atributo `id="password"`. Esto vulnera la unicidad de los IDs en el estándar HTML y ocasiona violaciones de modo estricto (_strict mode violation_) en herramientas de automatización cuando se intenta localizar simplemente por `#password`.
- **Recomendación para el equipo frontend:** Se recomienda mantener el atributo `id="password"` exclusivamente en el elemento `<input>` editable (asignando otro identificador o ninguno al componente contenedor `<p-password>`), y vincular explícitamente el `<label for="password">Contraseña *</label>` o utilizar atributos accesibles (`aria-label` / `aria-labelledby`).
- **Estrategia en la automatización:** Mientras esta mejora no sea incorporada en la aplicación, el Page Object utiliza el selector calificado `page.locator('input#password')`, el cual desambigua inequívocamente el control editable sin depender de clases CSS dinámicas ni XPath frágiles.
- **Módulos del menú lateral sin atributo `href` y duplicación por tooltips (Semántica HTML):** Los enlaces de los módulos laterales utilizan elementos `<a>` que carecen del atributo `href` (usan `target="_parent"` y `tabindex="0"` gestionados por eventos de Angular/PrimeNG). Por especificación W3C ARIA, no se exponen con el rol accesible `link` (`role="link"`) en el árbol de accesibilidad. Asimismo, PrimeNG genera dos textos iguales por módulo en el DOM: el texto dentro del elemento interactivo `<a>` y el texto del tooltip utilizado cuando el menú está colapsado (`.layout-menu-tooltip-text`).
- **Estrategia en la automatización:** Por este motivo, la automatización delimita el selector al elemento interactivo `<a>` dentro del contenedor del sidebar y filtra por un elemento descendiente con el texto exacto del módulo (`this.container.locator('a').filter({ has: this.page.getByText(name, { exact: true }) })`).
- **Recomendación para el equipo frontend:** Se recomienda incorporar el atributo `href` cuando los elementos representen rutas de navegación, o utilizar etiquetas `<button>` cuando desencadenen acciones internas, preservando en todo momento el nombre accesible y la navegación mediante teclado. Este hallazgo se documenta como observación de accesibilidad y semántica HTML, no como defecto funcional confirmado.
