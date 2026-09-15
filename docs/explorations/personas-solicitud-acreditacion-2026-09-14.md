# Exploración de solicitud de acreditación de trabajador — SUCAL QA

Fecha: 2026-09-14. Entrada: CONTRATISTA. Perfil efectivo observado tras autenticación: SUPER ADMINISTRADOR. Herramienta: Playwright directo, en una sesión interactiva.

Estado: exploración parcial en **Datos Contractuales**, para **División Salvador**. La acción de creación y la apertura de nueva pestaña están verificadas. Datos personales ficticios completados. Falta definir un contrato empresarial vigente de QA para continuar; los resultados identificados como prueba o QA figuran CADUCADO. Documentos y revisión final todavía no alcanzados. No se implementó la automatización definitiva.

Este informe sustituye la exploración anterior del usuario con acceso limitado, que solo mostraba Consulta de Solicitudes.

## 1. Pasos ejecutados

1. Leer la configuración QA actualizada y comprobar, sin exponer valores, que el usuario cambió.
2. Validar existencia, extensión y tamaño de los assets locales, sin leer ni mostrar su contenido.
3. Ejecutar auth-setup: la autenticación llegó directamente a /v2/inicio, pero el setup existente exige /v2/account/select-platform y falló. No se debilitó ni modificó esa aserción.
4. Abrir un BrowserContext limpio, sin reutilizar el storageState del usuario anterior. Autenticar mediante los controles existentes y confirmar la llegada directa a /v2/inicio.
5. Abrir el sidebar, Personas y el enlace real Lista de Solicitudes Creadas.
6. Verificar el encabezado de la lista y el botón Crear Solicitud, con nombre accesible Ir a crear solicitud.
7. Abrir Crear Solicitud una sola vez. Inspeccionar el diálogo y la opción preseleccionada Solicitar Acreditación de Personas.
8. Accionar Continuar y capturar la nueva Page mediante el evento page del mismo contexto.
9. Inspeccionar el formulario de búsqueda real y generar un único RUT ficticio con dígito verificador calculado por módulo 11.
10. Ejecutar una sola búsqueda. El resultado mostró únicamente el RUT consultado, sin datos personales cargados ni filas de registros, y habilitó Iniciar Acreditación de Personas. No se abrió ni editó una ficha existente.
11. Iniciar la acreditación y seleccionar exclusivamente División Salvador en Centros de Trabajo.
12. Completar datos personales, países CHILE, nacionalidad Chilena, contactos ficticios y nacimiento adulto. Verificar edad calculada 36, conservación de los contactos y Siguiente habilitado.
13. Accionar Siguiente una sola vez y confirmar la sección activa Datos Contractuales. La aplicación usa un acordeón en la misma URL; los campos personales siguen en el DOM.
14. Inspeccionar campos, catálogos y controles contractuales, sin guardar. Buscar contratos por las palabras prueba, qa, test y demo. Los encontrados con prueba y qa figuran CADUCADO; test y demo no devolvieron opciones.
15. Detener las acciones dependientes de contrato. Queda pendiente el código de un contrato vigente de QA adecuado a División Salvador.

Solo se navegó al módulo Personas. El inicio del superadministrador dispara peticiones de otros módulos en segundo plano; estas se registran como metadatos de red, sin navegar a esas vistas. La exploración usa un navegador local preparado con acceso de red, sin esperas fijas, networkidle, índices de pestaña ni clics forzados.

## 2. URLs de las etapas alcanzadas

| Etapa                                                             | URL                                      |
| ----------------------------------------------------------------- | ---------------------------------------- |
| Autenticación                                                     | `[BASE_URL_QA]/sign-in`                  |
| Inicio                                                            | `[BASE_URL_QA]/v2/inicio`                |
| Lista real de solicitudes creadas y diálogo Crear Solicitud       | `[BASE_URL_QA]/v2/personas/solicitudes`  |
| Nueva pestaña: búsqueda, centro, datos personales y contractuales | `[BASE_URL_QA]/v2/personas/acreditacion` |

La lista habilitada al perfil anterior estaba en /v2/personas/solicitudes/consulta. No debe confundirse con la lista de creación observada ahora. Se omiten query strings, fragmentos e identificadores personales de las URLs registradas.

## 3. Nueva pestaña detectada

**Sí.** Continuar abrió /v2/personas/acreditacion en el mismo origen. Se ejecutó este patrón, usando luego newPage y sin seleccionar pestañas por índice:

```typescript
const [newPage] = await Promise.all([page.context().waitForEvent('page'), continuarButton.click()]);
```

La nueva Page se verificó por URL y por los controles del formulario. La sesión de este contexto limpio permitió entrar sin un segundo login ni restauración de datos del usuario anterior.

## 4. Campos personales confirmados

Todos los campos siguientes mostraron asterisco tras terminar de cargar los catálogos. No expusieron required ni aria-required en los atributos inspeccionados; la obligatoriedad debe contrastarse con el comportamiento, no deducirse solo de esos atributos.

| Campo                  | Control / ID observado                               | Nombre accesible o atributo                                       | Valor ficticio usado                                        |
| ---------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| Nombres                | input text; idSchema_nombres                         | Ingrese Nombres                                                   | Prueba E2E                                                  |
| Apellido Paterno       | input text; idSchema_apellidoPaterno                 | Ingrese Apellido Paterno                                          | Automatizacion                                              |
| Apellido Materno       | input text; idSchema_apellidoMaterno                 | Ingrese Apellido Materno                                          | Sintetica                                                   |
| Genero                 | p-dropdown; idSchema_fkidPrsGenero                   | Seleccione Genero                                                 | Masculino                                                   |
| Fecha Nacimiento       | p-calendar; idSchema_fechaNacimiento; input readonly | Seleccione fecha Fecha Nacimiento; dateformat dd/mm/yy            | 15/05/1990                                                  |
| Edad                   | input text; idSchema_edad                            | Ingrese Edad                                                      | 36, calculada por la UI                                     |
| Nacionalidad           | p-dropdown; idSchema_nacionalidades                  | Seleccione Nacionalidad                                           | Chilena                                                     |
| Etnia                  | p-dropdown; idSchema_fkidPrsEtnia                    | Seleccione Etnia                                                  | No Aplica                                                   |
| Estado Civil           | p-dropdown; idSchema_fkidPrsEstadoCivil              | Seleccione Estado Civil                                           | Soltero/a                                                   |
| País de Domicilio      | p-dropdown; idSchema_fkidExtPaisDom                  | Seleccione País de Domicilio                                      | CHILE                                                       |
| Región de Domicilio    | p-dropdown; idSchema_fkidExtRegionDom                | Seleccione Región de Domicilio                                    | REGIÓN METROPOLITANA DE SANTIAGO                            |
| Ciudad de Domicilio    | p-dropdown; idSchema_fkidExtCiudadDom                | Seleccione Ciudad de Domicilio                                    | BUIN                                                        |
| Dirección de Domicilio | input text; idSchema_direccionDom                    | Ingrese Dirección de Domicilio                                    | Calle Prueba 123                                            |
| País Origen            | p-dropdown; idSchema_fkidExtPaisLoc                  | Seleccione País Origen                                            | CHILE                                                       |
| Región Origen          | p-dropdown; idSchema_fkidExtRegionLoc                | Seleccione Región Origen                                          | REGIÓN METROPOLITANA DE SANTIAGO                            |
| Ciudad Origen          | p-dropdown; idSchema_fkidExtCiudadLoc                | Seleccione Ciudad Origen                                          | BUIN                                                        |
| Localidad de Origen    | p-dropdown; idSchema_fkidExtLocalidadOrigen          | Seleccione Localidad de Origen                                    | Sin Localidad, única opción observada para Buin             |
| Grupo Sanguíneo        | p-dropdown; idSchema_fkidPrsGrupoSanguineo           | Seleccione Grupo Sanguíneo                                        | O+                                                          |
| Correos                | p-chips; idSchema_correos; input text sin ID         | Ingrese Correos en el host; textbox hijo sin nombre               | Correo único ficticio del apartado 12; confirmado con Enter |
| Teléfonos o Celulares  | p-chips; idSchema_telefonos; input text sin ID       | Ingrese Teléfonos o Celulares en el host; textbox hijo sin nombre | 912345678; confirmado con Enter                             |
| Nivel Educacional      | p-dropdown; idSchema_fkidPrsNivelEstudio             | Seleccione Nivel Educacional                                      | Media Completa                                              |

Opciones de Genero: Masculino, Femenino, Otro. Grupo Sanguíneo: A+, A-, B+, B-, AB+, AB-, Otro, O+, O-. Estado Civil: Conviviente Civil, Otro, Soltero/a, Viudo/a, Divorciado/a, Casado/a. Etnia: Mapuche, Diaguita, Atacameño, No Aplica, Otro, Aymara, Colla, Quechua, Chango-Camanchacos, Rapa Nui, Yagán-Yámana, Kawashkar-Alacalufe.

Nivel Educacional: Básica Incompleta, Básica Completa, Media Incompleta, Media Completa, Universitaria Incompleta, Universitaria Completa, Magister, Doctorado, Técnico Incompleto, Técnico Completo. Los catálogos de países, nacionalidades y ciudades tienen filtros y listas virtuales: las opciones renderizadas inicialmente no representan el catálogo completo. Los filtros permitieron confirmar CHILE y Chilena.

## 5. Campos contractuales confirmados

Se alcanzó y activó Datos Contractuales, dentro de Solicitud. No se completó ni seleccionó un contrato empresarial.

| Campo                           | Control / ID observado                                        | Nombre accesible o atributo                         | Asterisco observado |
| ------------------------------- | ------------------------------------------------------------- | --------------------------------------------------- | ------------------- |
| Contrato Empresa                | p-dropdown; idSchema_fkidEmpContrato                          | Seleccione Contrato Empresa                         | Sí                  |
| Tipo Contrato Individual        | p-dropdown; idSchema_fkidCntTipoEmpleado                      | Seleccione Tipo Contrato Individual                 | Sí                  |
| Fecha de Vinculación            | p-calendar; idSchema_fechaVinculacion                         | Seleccione fecha Fecha de Vinculación               | Sí                  |
| Fecha Inicio de Contrato        | p-calendar; idSchema_fechaInicio                              | Seleccione fecha Fecha Inicio de Contrato           | Sí                  |
| Fecha Término de Contrato       | p-calendar; idSchema_fechaTermino                             | Seleccione fecha Fecha Término de Contrato          | Sí                  |
| Jornada Laboral                 | p-dropdown; idSchema_fkidEmpContratoJornada                   | Seleccione Jornada Laboral                          | Sí                  |
| Causal del Servicio Transitorio | p-dropdown; idSchema_fkidEmpCausalServicioTransitorio         | Seleccione Causal del Servicio Transitorio          | No                  |
| Áreas de Tránsito/Trabajo       | p-multiselect; idSchema_areas                                 | Seleccione Áreas de Tránsito/Trabajo                | Sí                  |
| Cargo                           | p-dropdown; idSchema_fkidCargo                                | Seleccione Cargo                                    | Sí                  |
| Tipo Examen de Salud            | p-dropdown; idSchema_fkidExtTipoExamenSalud                   | Seleccione Tipo Examen de Salud                     | Sí                  |
| Entidad Examen Salud            | p-dropdown; idSchema_fkidExtEntidadSalud                      | Seleccione Entidad Examen Salud                     | Sí                  |
| Trabajador/a Exclusivo          | p-inputswitch; idSchema_trabajadorExclusivo; hijo role switch | Seleccione opcion de Trabajador/a Exclusivo         | Sí                  |
| Dentro de Faena                 | p-inputswitch; idSchema_dentroFaena; hijo role switch         | Seleccione opcion de Dentro de Faena                | Sí                  |
| Baja Experiencia Laboral - BEL  | p-inputswitch; idSchema_bajaExperiencia; hijo role switch     | Seleccione opcion de Baja Experiencia Laboral - BEL | Sí                  |
| Mantenimiento                   | p-inputswitch; idSchema_mantenimiento; hijo role switch       | Seleccione opcion de Mantenimiento                  | Sí                  |
| Sueldo Base                     | input text; idSchema_sueldoBase                               | Ingrese Sueldo Base                                 | Sí                  |

Los tres calendarios visibles usan dd/mm/yy y entradas readonly. También existen controles de Fecha Inicio del Contrato Comercial, Fecha Termino del Contrato Comercial y Gerencias, actualmente ocultos; no se consideran campos visibles confirmados para completar hasta seleccionar el contrato.

Tipo Contrato Individual: Plazo Fijo, Por obra o faena, Indefinido, Honorarios, Practicante, Transitorio, Memorista, Vendor. Jornada Laboral no mostró opciones sin un contrato empresarial seleccionado; falta verificar su dependencia.

Tipo Examen de Salud: Pre Ocupacional, Ocupacional, No informado. Entidad Examen Salud y Cargo son catálogos con listas virtuales; se confirmó que tienen opciones, sin afirmar que la lista renderizada sea completa. Áreas mostró elementos li con aria-label, sin role option; sus opciones renderizadas incluyeron TELECOMUNICACIONES (TRANSITO), SULFUROS (TRANSITO), SIN INFORMACION (TRANSITO), SIN AREA TRANSITO (TRANSITO), POTRERILLOS (TRANSITO), PLANTA FILTROS LLANTA (TRANSITO) y MINA (TRANSITO). No se eligió ninguna área.

Estados iniciales observados: Trabajador/a Exclusivo false; Dentro de Faena true; BEL false; Mantenimiento false. Se conservaron. La UI advierte que declarar al trabajador exclusivo no permite revertir la condición; no se activó ese control.

Resultados de prueba: SC01-4511223344, denominado Prueba 060224, y SC02-4600000071, denominado Sqa_pruebaintegracion, ambos CADUCADO. El filtro qa mostró cinco resultados, todos CADUCADO. Esto no demuestra que no existan contratos vigentes fuera de esos filtros.

## 6. Centros de trabajo y División Salvador

El diálogo mostró Seleccione Corporación, Multicentro o Centro(s) de Trabajo, con Centros de Trabajo preseleccionado. El segundo dropdown tiene aria-label Lista de centros de trabajo. Se seleccionó únicamente la opción **División Salvador** y se comprobó su conservación en el formulario.

Opciones renderizadas observadas: Auditoría Spot; Campamento Vpzn; Cartera de Proyectos Andina; Cartera Proyectos El Teniente; Casa Matriz; Centro Ejecutivo; División Andina; División Chuquicamata; División El Teniente; División Gabriela Mistral; División Ministro Hales; División Radomiro Tomic; División Salvador; División Ventana; Proyecto Caren; Proyecto Chuqui Subterraneo; Proyecto de Relaves Espesados Talabre; Proyecto Fase 02 Pampa Austral; Proyecto Rajo Inca; Proyecto RT Oxidos Sim; Proyecto RT Sulfuros; Proyecto Sistema Agua Reciclada; Proyecto Suministro Agua Desalada Distrito Norte; Proyecto Tranque Ovejería; Proyecto Tranque Ovejería 5; VP CM.

Selector de la opción confirmado y accionado: getByRole('option', { name: 'División Salvador', exact: true }). No se seleccionó otro centro.

## 7. Documentos obligatorios

Pendientes de inspección. Existe una sección Documentos en el acordeón, pero no se avanzó a ella desde Datos Contractuales ni se cargaron archivos. No se inventan nombres, asteriscos, obligaciones o selectores de carga. No se deben deducir documentos a partir de los endpoints de requisitos.

## 8. Tipos de archivo aceptados

No se inspeccionaron todavía accept ni reglas de tamaño o formato de los controles de carga.

| Variable de ejecución | Ruta relativa al workspace                | Extensión | Tamaño       |
| --------------------- | ----------------------------------------- | --------- | ------------ |
| TEST_PDF_PATH         | test-assets/documents/CentroEjecutivo.pdf | .pdf      | 39685 bytes  |
| TEST_IMAGE_PATH       | test-assets/images/imagenMuestra.jpg      | .jpg      | 488134 bytes |

Las variables no estaban configuradas en QA y se resolvieron solamente en memoria a estos assets existentes. No se modificó .env.qa, no se renombraron extensiones y no se leyó ni mostró el contenido. La continuación deberá usar PDF para controles de PDF e imagen únicamente donde la UI lo requiera, cargando solo documentos marcados obligatorios.

## 9. Fechas solicitadas por documentos

No confirmadas en la UI. El dato ficticio previsto es **2028-09-14**, calculado como fecha de esta ejecución más dos años. Aún no se introdujo en ningún documento; faltan formato, obligatoriedad y validaciones por campo. La futura generación debe usar años de calendario y definir el caso de 29 de febrero.

## 10. Selectores candidatos de la UI alcanzada

Son propuestas observadas para revisión humana; no se modificaron selectores del framework ni se crearon Page Objects. Los data-testid no aparecieron en los controles inspeccionados.

| Elemento                        | Candidato                                                                                                                 | Evidencia                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Sidebar                         | page.locator('.menu-wrapper'); page.locator('.el-toggle-sidebar-open')                                                    | Selectores existentes, accionados                                                                 |
| Personas                        | sidebar.locator('a').filter({ has: page.getByText('Personas', { exact: true }) })                                         | Selector existente; enlace único                                                                  |
| Lista de creación               | sidebar.locator('a').filter({ has: page.getByText('Lista de Solicitudes Creadas', { exact: true }) })                     | Texto real, clic y URL verificados                                                                |
| Encabezado de lista             | page.getByRole('heading', { name: 'Lista de Solicitudes Creadas', exact: true })                                          | Visible                                                                                           |
| Crear Solicitud                 | page.getByRole('button', { name: 'Ir a crear solicitud', exact: true })                                                   | aria-label real; abierto una sola vez                                                             |
| Diálogo de tipo                 | page.getByRole('dialog')                                                                                                  | Único diálogo visible                                                                             |
| Continuar del diálogo           | dialog.getByRole('button', { name: 'Continuar', exact: true })                                                            | Abrió la nueva Page; ID btn-submit no se necesita                                                 |
| Identificación                  | newPage.getByRole('textbox', { name: 'Ingrese un Identificación', exact: true })                                          | input identificacion, maxlength 50; se completó mediante su aria-label                            |
| Buscar                          | newPage.getByRole('button', { name: 'Buscar Persona', exact: true })                                                      | Texto Buscar; aria-label Buscar Persona; una búsqueda                                             |
| Iniciar                         | newPage.getByRole('button', { name: 'Iniciar Acreditación', exact: true })                                                | Texto Iniciar Acreditación de Personas; accionado                                                 |
| Dropdown de centro              | newPage.getByLabel('Lista de centros de trabajo', { exact: true })                                                        | aria-label en host p-dropdown                                                                     |
| Salvador                        | newPage.getByRole('option', { name: 'División Salvador', exact: true })                                                   | Opción real y selección verificada                                                                |
| Nombre y apellidos              | newPage.getByRole('textbox', { name: 'Ingrese Nombres', exact: true }); equivalentes de los apellidos del apartado 4      | aria-label y valores ficticios verificados                                                        |
| Dropdown personal / contractual | newPage.getByLabel(nombreDelApartado4o5, { exact: true }).getByRole('button', { name: 'dropdown trigger', exact: true })  | Trigger semántico, delimitado al host con aria-label propio; accionado en catálogos contractuales |
| Filtro del dropdown             | dropdown.getByRole('textbox')                                                                                             | Filtro sin nombre; el otro input tiene role combobox y es readonly                                |
| Opción del catálogo             | dropdown.getByRole('option', { name: textoReal, exact: true })                                                            | Opciones de dropdown observadas; evitar índices en listas virtuales                               |
| Calendario de nacimiento        | newPage.getByLabel('Seleccione fecha Fecha Nacimiento', { exact: true })                                                  | Host real con input readonly y formato dd/mm/yy                                                   |
| Verificar fecha seleccionada    | calendario.getByRole('textbox')                                                                                           | Se verificó 15/05/1990                                                                            |
| Navegar décadas                 | newPage.locator('.p-datepicker-prev')                                                                                     | Botón sin nombre accesible; clase estable de PrimeNG, usada como última alternativa               |
| Seleccionar año / mes / día     | getByText('1990', { exact: true }); getByText('May', { exact: true }); calendarioAbierto.getByText('15', { exact: true }) | Textos reales del calendario, accionados; delimitar al calendario abierto                         |
| Correo / teléfono               | newPage.getByLabel('Ingrese Correos', { exact: true }).getByRole('textbox'); equivalente de Teléfonos o Celulares         | Hosts p-chips etiquetados; Enter confirmó los datos                                               |
| Sección contractual             | newPage.getByRole('region', { name: 'Datos Contractuales', exact: true })                                                 | role region con aria-labelledby al encabezado real                                                |
| Siguiente contractual           | regionContractual.getByRole('button', { name: 'Siguiente', exact: true })                                                 | Candidato delimitado; todavía no accionado                                                        |
| Switch contractual              | newPage.getByLabel(nombreDelApartado5, { exact: true }).getByRole('switch')                                               | Input checkbox con role switch; estados inspeccionados, sin cambios                               |

Los IDs p-accordiontab-_, pr_id__ y clases ng-tns-* son generados y no se proponen como selectores. No se usaron XPath ni nth(). Los hosts de dropdown abarcan también su panel: sus clics centrados pueden afectar el estado del desplegable; para la implementación conviene el trigger semántico delimitado. Las áreas no tienen role option, por lo que su selector definitivo requiere revisión específica de aria-label y del checkbox asociado.

## 11. Mensajes de validación y comportamiento observados

- Búsqueda: Máximo 50 carácteres; Buscar Persona deshabilitado con identificación vacía y habilitado después de introducir el RUT.
- Datos personales: Largo permitido: 0 a 100 carácteres para nombres y apellidos; Valor permitido: 0 a 100 para edad; Largo permitido: 0 a 200 carácteres para dirección. Los contactos muestran Presione "ENTER" para ingresar datos.
- Edad calculada por la UI: 36. No se sobrescribió manualmente.
- Etnia, Estado Civil y los campos de origen aparecieron al terminar de cargar catálogos. Siguiente estaba habilitado antes de completarlos; se completaron por tener asterisco. Falta verificar esa discrepancia de obligatoriedad en una prueba independiente aprobada.
- Calendarios readonly: se eligió la fecha mediante año, mes y día; no se retiró readonly ni se alteró el DOM para introducir valores.
- La aserción exploratoria de que Nombres dejaría de ser visible después de Siguiente falló: el acordeón mantiene controles en el DOM. La sección Datos Contractuales sí se activó. No se eliminaron ni cambiaron aserciones del proyecto para ocultar ese resultado.
- Algunas comprobaciones exploratorias por texto visible no encontraron el control porque aria-label da otro nombre accesible: Buscar Persona e Iniciar Acreditación. Se registraron los atributos reales sin crear o actualizar código definitivo.
- El multiselect de áreas interceptó un intento de clic fuera de su panel; no se forzó el clic ni se seleccionó un área accidentalmente. Se cerró con Escape.
- No se ejecutaron validaciones negativas adicionales, búsquedas con otro RUT ni pruebas de envío.

## 12. Datos sintéticos generados

Número de RUT generados: **1**. Número de búsquedas de ese RUT: **1**. No se probaron RUT alternativos.

El RUT se generó aleatoriamente para la prueba; no se afirma que pertenezca a un rango reservado ni que esté libre de colisiones fuera de esta UI. El SII documenta el uso del dígito verificador mediante módulo 11: [documentación técnica del SII](https://www.sii.cl/ccp/formato_envio_cp_electronico_052022.pdf). La validez matemática no prueba identidad ni existencia registral.

```json
{
  "rut": "40759093-7",
  "firstName": "Prueba",
  "middleName": "E2E",
  "paternalSurname": "Automatizacion",
  "maternalSurname": "Sintetica",
  "birthDate": "1990-05-15",
  "email": "qa.acreditacion.0aaa8d3d-e199-4deb-bdf5-f2dbeaaea75e@example.com",
  "phone": "912345678",
  "nationality": "Chilena",
  "residenceCountry": "Chile",
  "address": "Calle Prueba 123",
  "contractStartDate": "2026-09-14",
  "contractEndDate": "2027-09-14",
  "documentExpirationDate": "2028-09-14",
  "gender": "Masculino",
  "residenceRegion": "REGIÓN METROPOLITANA DE SANTIAGO",
  "residenceCity": "BUIN",
  "originCountry": "CHILE",
  "bloodGroup": "O+",
  "education": "Media Completa",
  "ethnicity": "No Aplica",
  "maritalStatus": "Soltero/a",
  "originRegion": "REGIÓN METROPOLITANA DE SANTIAGO",
  "originCity": "BUIN",
  "originLocality": "Sin Localidad"
}
```

Se reutilizó un único objeto en memoria. Los nombres, domicilio, correo y teléfono son datos ficticios. Las fechas contractuales son valores previstos y aún no usados; deberán quedar dentro de la vigencia del contrato de QA elegido. DocumentExpirationDate tampoco se aplicó todavía.

No se incorporan al informe credenciales, tokens, cookies, valores de sesión ni datos de personas existentes. Los endpoints con identificadores se sanean y las opciones de contratos se documentan solo por códigos necesarios para definir el fixture.

## 13. APIs observadas

Se capturaron únicamente URL saneada, método y HTTP; sin headers, request bodies, response bodies ni valores de query strings. Assets y duplicados se excluyen. Las rutas de la tabla pertenecen al origen configurado como **API_BASE_URL_QA** salvo las de Cognito, que se muestran completas.

| Ruta saneada                                                                          | Método | HTTP |
| ------------------------------------------------------------------------------------- | ------ | ---- |
| /v1/acreditacion-administracion/app/check-maintenance-mode                            | GET    | 200  |
| /v1/acreditacion-usuarios/login/auth                                                  | POST   | 200  |
| /v1/acreditacion-administracion/flujos-validaciones/list-modulo-flujos-no-habilitados | GET    | 200  |
| https://cognito-idp.us-east-1.amazonaws.com/                                          | POST   | 200  |
| https://cognito-idp.us-east-1.amazonaws.com/                                          | POST   | 400  |
| /v1/acreditacion-integraciones/pgt/validate-company                                   | POST   | 200  |
| /v1/acreditacion-usuarios/login/auth/validar                                          | GET    | 200  |
| /v1/acreditacion-administracion/perfiles/public/listar-perfiles-by-categoria/EECC     | GET    | 200  |
| /v1/acreditacion-credencializacion/reimpresion-vehiculos-validador                    | GET    | 200  |
| /v1/acreditacion-visitas/validador-veh                                                | GET    | 404  |
| /v1/acreditacion-visitas/validador-veh                                                | GET    | 200  |
| /v1/acreditacion-empresas/validador                                                   | GET    | 200  |
| /v1/acreditacion-usuarios/validador                                                   | GET    | 200  |
| /v1/acreditacion-credencializacion/reimpresion-personas-validador                     | GET    | 200  |
| /v1/acreditacion-visitas/validador                                                    | GET    | 200  |
| /v1/acreditacion-credencializacion/reimpresion-lic-conducir-validador                 | GET    | 200  |
| /v1/acreditacion-vehiculos/validador/total-pendientes                                 | POST   | 200  |
| /v1/acreditacion-personas/validador                                                   | GET    | 200  |
| /v1/acreditacion-usuarios/usuarios/list-cross                                         | GET    | 200  |
| /v1/acreditacion-lic-conducir/validador                                               | GET    | 200  |
| /v1/acreditacion-personas/solicitudes/tabla                                           | GET    | 200  |
| /v1/acreditacion-integraciones/registro-civil/info-personal                           | GET    | 200  |
| /v1/acreditacion-personas/empleados/verificar-estado-trabajador/[identificador]/RUT   | GET    | 200  |
| /v1/acreditacion-personas/extras/listar-generos                                       | GET    | 200  |
| /v1/acreditacion-personas/extras/listar-estado-civil                                  | GET    | 200  |
| /v1/acreditacion-administracion/centros-trabajo/3                                     | GET    | 200  |
| /v1/acreditacion-administracion/flujos-esquemas/configuracion                         | POST   | 200  |
| /v1/acreditacion-comunes/extras/paises                                                | GET    | 200  |
| /v1/acreditacion-comunes/extras/listar-nacionalidades                                 | GET    | 200  |
| /v1/acreditacion-comunes/extras/listar-entidades-salud/45                             | GET    | 200  |
| /v1/acreditacion-comunes/extras/listar-tipos-examenes-salud/45                        | GET    | 200  |
| /v1/acreditacion-empresas/empresas/listar-causales-servicios-transitorios/45          | GET    | 200  |
| /v1/acreditacion-personas/extras/listar-grupos-sanguineos                             | GET    | 200  |
| /v1/acreditacion-personas/extras/listar-etnias/45                                     | GET    | 200  |
| /v1/acreditacion-personas/extras/lista-bateria-examen-salud                           | GET    | 200  |
| /v1/acreditacion-personas/extras/listar-motivos-bel                                   | GET    | 200  |
| /v1/acreditacion-personas/extras/requisitos-by-centro-trabajo/3                       | GET    | 200  |
| /v1/acreditacion-personas/extras/listar-niveles-estudio/45                            | GET    | 200  |
| /v1/acreditacion-personas/empleados/listar-modalidad-contrato/45                      | GET    | 200  |
| /v1/acreditacion-administracion/cargos                                                | GET    | 200  |
| /v1/acreditacion-empresas/contratos/contratos-con-filtros-eecc                        | POST   | 200  |
| /v1/acreditacion-administracion/areas-trabajo/listar-by-centros                       | POST   | 200  |
| /v1/acreditacion-personas/extras/listar-tipos-empleados-individuales/45               | GET    | 200  |
| /v1/acreditacion-personas/bel/motivos-acreditar-bel-usuario                           | POST   | 200  |
| /v1/acreditacion-comunes/extras/regiones-by-pais/45                                   | GET    | 200  |
| /v1/acreditacion-comunes/extras/ciudades-by-region/782                                | GET    | 200  |
| /v1/acreditacion-comunes/extras/localidades-by-ciudad/[identificador]                 | GET    | 200  |

Los 400 de Cognito y 404 de una petición inicial se observaron sin inspeccionar sus cuerpos; no se atribuye una causa. Se llegó al flujo de Personas con la sesión operativa. Los POST de configuración, filtros y catálogos no demuestran creación de solicitud. No se observó una llamada de guardar borrador o envío final dentro de las acciones ejecutadas.

## 14. Pantalla exacta de detención

**Solicitud → Datos Contractuales**, con División Salvador y el RUT ficticio 40759093-7, en /v2/personas/acreditacion. El encabezado general es Solicitar Acreditación de Personas; la sección contractual está activa y Contrato Empresa conserva su placeholder.

Contrato Empresa: sin seleccionar. Siguiente contractual: no accionado. Documentos: no alcanzados. Cargas: **0**. Guardar Borrador: no accionado. Guardar y enviar: no accionado. Confirmación Sí: no accionada. No se hizo registro definitivo ni se modificó una ficha existente.

La continuidad requiere un contrato vigente apropiado de QA. Se conserva temporalmente la sesión de exploración en esta etapa para continuar sin repetir la búsqueda de RUT.

## 15. Propuesta de Page Objects y datos

Propuesta para revisar, sin archivos fuente creados:

- CreatedRequestsPage: lista, apertura de Crear Solicitud, diálogo de tipo y captura de nueva Page.
- WorkerAccreditationPage: vista /v2/personas/acreditacion, búsqueda, centro y coordinación del flujo. No conviene modelar cada sección como si tuviera una URL distinta.
- PersonalDataSection: sección Datos Personales, dropdowns, contactos y comprobación de edad y datos ficticios.
- ContractualDataSection: sección Datos Contractuales, fixture de contrato empresarial, tipo individual, fechas, jornada, áreas, cargo, salud y switches.
- DocumentsSection y RequestReviewSection: provisionales; métodos, controles y selectores pendientes de observación real.
- Componentes de catálogo filtrable y calendario: evaluar cuando la inspección esté completa; evitar wrappers que dupliquen click, fill o expect de Playwright.

WorkerAccreditationData debe conservar rut, firstName, middleName?, paternalSurname, maternalSurname, birthDate, email, phone, nationality, residenceCountry, address, contractStartDate, contractEndDate y documentExpirationDate. La UI real requiere además gender, ethnicity, maritalStatus, residenceRegion, residenceCity, originCountry, originRegion, originCity, originLocality, bloodGroup y education. Los Nombres se componen de firstName y middleName; la nacionalidad usa Chilena y los países CHILE.

Los datos contractuales adicionales deberán tiparse tras confirmar el fixture: companyContractCode, individualContractType, linkageDate, workSchedule, workAreas, job, healthExamType, healthEntity, exclusiveWorker, insideWorksite, lowExperience, maintenance y baseSalary. Los booleanos deben ser explícitos para mantener coherencia entre campos y documentos dependientes.

No se crearon la factoría, helpers de RUT/fechas/archivos, Pages, Components ni la prueba E2E definitiva. Su implementación queda sujeta a la aprobación solicitada en el prompt original tras completar la exploración.

## 16. Riesgos y definiciones pendientes

- Definir el código de un contrato empresarial vigente de QA habilitado para División Salvador y su período de vigencia. No seleccionar por índice ni usar un contrato caducado sin una definición expresa del caso de negocio.
- Completar datos contractuales y comprobar dependencias de Jornada Laboral, áreas, salud, BEL y documentación.
- Alcanzar Documentos mediante Siguiente contractual y confirmar asteriscos, formatos accept, tamaños, mensajes y fechas. Cargar solo documentos obligatorios con los assets del apartado 8.
- Alcanzar la revisión y detenerse antes de Guardar y enviar y cualquier confirmación final. Esta ejecución aún no llegó a la revisión.
- El setup de autenticación actual no admite la llegada directa a inicio del superadministrador. Una corrección futura debería verificar explícitamente ambas ramas de acceso, conservando las aserciones correspondientes y sin asumir que todo usuario pasa por selección de plataforma. No se cambió el setup en esta exploración.
- Confirmar el perfil requerido para la futura suite: la cobertura del superadministrador no demuestra permisos equivalentes para un contratista operativo.
- Revisar humanamente los selectores candidatos y los estados del acordeón antes de crear la automatización. Usar regiones y componentes etiquetados; evitar los IDs generados y selectores globales ambiguos de Siguiente.
- Si una búsqueda devuelve una persona existente, detenerse sin editarla ni probar otro RUT en la misma iteración. Mantener un fixture controlado para futuras ejecuciones repetibles.
- Configurar TEST_PDF_PATH y TEST_IMAGE_PATH explícitamente para la suite definitiva, sin secretos versionados.
- Aprobar la implementación definitiva después de completar y revisar este informe.
