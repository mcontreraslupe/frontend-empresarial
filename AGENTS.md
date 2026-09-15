# Directrices y Reglas para Asistentes de IA (AGENTS.md)

Este documento define las políticas operativas, técnicas y éticas obligatorias para cualquier agente o asistente de Inteligencia Artificial que colabore en este repositorio.

---

## 1. Reglas Operativas y de Calidad Obligatorias

1. **Aserciones no negociables**: No eliminar, comentar ni debilitar aserciones para hacer pasar pruebas que están fallando.
2. **Selectores revisados**: No actualizar ni cambiar selectores automáticamente sin revisión y aprobación humana.
3. **Prohibición de esperas fijas**: No usar `waitForTimeout` bajo ninguna circunstancia. Emplear exclusivamente esperas automáticas de Playwright y aserciones web-first (`expect(locator).toBeVisible()`, etc.).
4. **Cero secretos en código**: No almacenar secretos, contraseñas, tokens de API ni credenciales en archivos versionados por Git.
5. **Privacidad estricta en logs**: No registrar passwords, tokens de autenticación ni datos personales (PII) en consola, reportes de prueba ni mensajes de excepción.
6. **Límites de alcance**: No modificar archivos ni ejecutar comandos fuera de los límites de este workspace (`c:\Automatizacion\frontend-empresarial`).
7. **No destructivo**: No realizar operaciones destructivas en bases de datos o sistemas (evitar `DROP`, `TRUNCATE`, eliminación masiva no autorizada). En ambiente UAT está prohibido ejecutar pruebas que destruyan datos o modifiquen estados irreversibles.
8. **Inspección real previa**: Antes de crear una `Page` o `Component`, se debe inspeccionar la interfaz de usuario (UI) real de la aplicación; nunca inventar elementos, textos ni rutas.
9. **Aserciones con valor de negocio**: Cada prueba automatizada debe contener aserciones de negocio verificables que reflejen el comportamiento esperado por el usuario final.
10. **Revisión humana**: La IA genera propuestas y código base; todos los cambios requieren revisión y validación humana antes de ser promovidos a ramas principales.

---

## 2. Estrategia y Prioridad de Selectores

Al inspeccionar e interactuar con la aplicación, se debe respetar estrictamente el siguiente orden de precedencia:

1. `getByTestId`: Localizador por atributo de prueba dedicado (ej. `data-testid`).
2. `getByRole`: Localizadores semánticos y accesibles (ej. `button`, `heading`, `textbox`).
3. `getByLabel`: Etiquetas asociadas a campos de entrada (`label`).
4. `getByPlaceholder`: Textos de ayuda dentro de campos de entrada.
5. `getByText`: Textos visibles cuando sean estables y no varíen por internacionalización o datos dinámicos.
6. `CSS`: Selectores CSS simples solamente como última alternativa cuando no existan opciones semánticas.

### Selectores Prohibidos

- **XPath absoluto** (ej. `/html/body/div[2]/div/form/div[1]/input`).
- **Selectores dependientes de posiciones o índices** (ej. `.nth(3)`, `div:nth-child(4)`).
- **Clases CSS dinámicas, ofuscadas o autogeneradas** (ej. `.css-19z01jx`, `.btn_v2_xyz89`).

---

## 3. Arquitectura y Patrones del Proyecto

- **Page Objects**: Encapsulan vistas y exponen métodos orientados a la intención de negocio. Deben usar directamente instancias de `Locator` de Playwright.
- **Sin wrappers redundantes**: `BasePage` y los componentes no deben duplicar funciones nativas (`click`, `fill`, `locator`, `waitForTimeout`, `expect`).
- **Component Objects**: Para elementos recurrentes en múltiples vistas (barras de navegación, modales, tablas).
- **Fixtures**: Utilizados para la inyección de dependencias y gestión del ciclo de vida de páginas y autenticación.
- **Datos Desacoplados**: Los datos fijos residen en `src/data/static/` y los generadores en `src/data/dynamic/`.
- **Clasificación por Tags**: Cada prueba debe contener sus etiquetas (`@smoke`, `@regression`, `@critical`).
