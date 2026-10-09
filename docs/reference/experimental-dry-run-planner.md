# Planificador experimental sin ejecución

Esta API interna de CommonJS prepara esquemas deterministas de trabajo para
Desarrollo (Development) e Investigación (Research). No está conectada a la
interfaz de comandos ni al ejecutor. Todos los resultados mantienen
`execution_authorized: false`, `executed: false` y `accepted: false`.

## Probar los ejemplos incluidos

Desde una copia del código fuente:

```bash
node -e "const {planDryRun}=require('./src/create-quiver/lib/planning/dry-run'); const x=require('./examples/planning-dry-run/development.json'); console.log(JSON.stringify(planDryRun(x.task,x.trusted_context),null,2));"
node -e "const {planDryRun}=require('./src/create-quiver/lib/planning/dry-run'); const x=require('./examples/planning-dry-run/research.json'); console.log(JSON.stringify(planDryRun(x.task,x.trusted_context),null,2));"
```

Los ejemplos usan huellas digitales, tamaños, recursos y permisos sintéticos.
No leen los archivos nombrados ni comprueban que esos datos representen su
estado real. El código que llama al planificador carga JSON e imprime la salida;
el planificador no realiza operaciones de entrada o salida de la aplicación.
Los ejemplos y las pruebas están solo en el repositorio; la biblioteca se incluye
en el paquete mediante las reglas de empaquetado existentes. Es una API
experimental, no un nuevo comando disponible en la interfaz de Quiver.

## Contrato de la versión 1

Invocá `planDryRun(task, trustedContext)` con objetos obtenidos al interpretar
JSON. La [especificación experimental](../../specs/quiver-experimental-dry-run-planner/SPEC.md)
define cada campo y qué autoridad tiene. Los campos desconocidos se rechazan,
incluidas las claves propias `__proto__`. Los identificadores de criterios,
entradas y acciones no pueden repetirse dentro de su colección. Cada entrada y
criterio declarados deben ser utilizados por alguna acción.

Los objetos deben ser objetos de datos simples o con prototipo nulo; los arrays
deben ser nativos, con elementos en todas sus posiciones. Se rechazan las
propiedades con funciones de acceso, los prototipos personalizados de arrays,
los proxies (incluidos los revocados), las funciones, los símbolos, los números
no finitos, los ciclos, las referencias compartidas a un mismo objeto y las
funciones de serialización. Antes de pasar objetos de otro contexto de ejecución
o estructuras con referencias compartidas, convertí sus datos a JSON y volvé a
interpretarlos en el contexto del planificador.

La validación previa limita la profundidad a 20 niveles, el recorrido a 20.000
valores por argumento, las cadenas a 8.000 unidades de código UTF-16 y las claves
de objetos a 128 unidades. Los esquemas también limitan cantidades y longitudes
de campos. El contrato completo, en su representación canónica, no puede superar
1 MiB. No se convierten valores arbitrarios a texto para generar errores.

El texto de la tarea y `claimed_risk` no otorgan capacidades ni acceso a recursos.
El contexto de confianza debe llegar por separado, desde un componente
confiable. Identifica exactamente la tarea, la ejecución prevista y la revisión,
además de la política versionada, los recursos permitidos, las capacidades
habilitadas y una instantánea explícita de permisos. Cada destino y entrada
necesita un permiso para esa combinación exacta de capacidad y recurso. No hay
permisos implícitos ni comodines.

Solo están registradas estas cuatro capacidades:

- `development.inspect`: esquema de inspección; riesgo inicial bajo
- `development.propose-change`: esquema de cambio; riesgo inicial intermedio
- `research.compare`: esquema de comparación; riesgo inicial bajo
- `research.propose-report`: esquema de informe; riesgo inicial intermedio

Cada esquema identifica su destino, las fuentes aportadas con sus huellas
digitales y las comprobaciones propuestas para los criterios. Desarrollo pide
evidencia de pruebas; Investigación pide respaldo en fuentes. No contiene un
parche generado, una prueba ejecutada, una afirmación factual de investigación,
una clasificación de alternativas, un comando arbitrario ni un adaptador
invocable. Ambos dominios pasan por el mismo controlador.

## Decisiones y límites de recursos

- `eligible`: elegibilidad de bajo riesgo, limitada a las instantáneas aportadas
- `prepare-only`: preparación de riesgo intermedio; exige revisión antes de aplicar
- `approval-required`: aplicación de riesgo intermedio, riesgo crítico o riesgo incierto
- `denied`: falta de permisos o recursos, capacidad no admitida, ruta insegura,
  vínculo de tarea o huella digital desactualizado, o límite de planificación excedido

La clasificación confiable del recurso puede elevar el riesgo inicial.
Producción, datos, permisos, credenciales, pagos, borrado, arquitectura central y
compromisos externos se consideran críticos. Un `claimed_risk` superior también
aumenta la cautela; declarar `unknown` siempre exige aprobación. Una declaración
inferior no reduce el riesgo. Las etiquetas no reconocidas son inválidas.
Los requisitos de aprobación son descriptivos y siempre figuran como no
satisfechos: este módulo no consume aprobaciones ni crea permisos.

Se usa el menor límite entre el solicitado y el establecido por el contexto de
confianza. Cada acción cuenta una vez. Los bytes se cuentan por referencia de
entrada y por acción, incluso si dos IDs apuntan al mismo recurso o si se reutiliza
un recurso entre acciones. Si el total del plan supera el límite, se deniegan
todas las acciones. Los límites de enteros seguros y las comparaciones exactas
del total impiden eludirlos mediante desbordamientos numéricos. Son estimaciones
de planificación basadas en los tamaños aportados, no costos reales de lectura
ni de uso de modelos.

## Resultados y vínculo de contenido

`status` puede ser `planned`, `denied` o `invalid`. Un contrato válido devuelve
una copia normalizada de la tarea, el ID del adaptador, las decisiones por acción,
sus motivos, el esquema, los requisitos de aprobación y los vínculos SHA-256 del
plan y de cada acción. Un contrato inválido no devuelve plan ni vínculo: solo
incluye un código de error estable y la ubicación del problema.

El vínculo incluye la tarea normalizada completa, el contexto de confianza, las
revisiones y la semántica del controlador y del adaptador, y las decisiones
resultantes. Reordenar las claves de un objeto no lo cambia; cambiar contenido
protegido o el orden de un array sí. Si cambia la semántica de control, debe
actualizarse `CONTROLLER_REVISION`. Un vínculo no autentica a quien invoca la API
ni autoriza una ejecución futura.

La verificación sigue en `not-performed` y los criterios en `not-verified`.
Las huellas de entrada se comparan únicamente con las huellas confiables
aportadas, nunca con el contenido real del sistema de archivos. Que una prueba
del planificador pase no verifica ni acepta la tarea propuesta.

## Límites y procedencia

Se presupone que el proceso anfitrión y las dependencias instaladas son
confiables. Este módulo no ofrece aislamiento del sistema operativo, un servicio
de aprobaciones, verificación del sistema de archivos ni orquestación. Las rutas
se validan como texto canónico y se filtran con la función pura de seguridad ya
existente en Quiver. Los enlaces simbólicos, los enlaces duros, la actualidad de
los recursos y las condiciones de carrera necesitarían controles sobre el
entorno real, aprobados por separado. Desde este módulo no se puede acceder a
reintentos, persistencia, bloqueos, reconciliación, proveedores, redes,
subprocesos ni ejecutores.

La [procedencia registrada en la especificación](../../specs/quiver-experimental-dry-run-planner/SPEC.md#reuse-and-provenance)
identifica las invariantes seleccionadas de Quiver y V2. Deliberadamente no se
importan las funciones de aprobación o gobierno que mantienen estado. No se
afirma compatibilidad con el entorno de ejecución ni con los esquemas de V2.
Un ejecutor futuro necesita autorización y medidas de protección propias.

## Ejecutar las validaciones

```bash
node --test tests/lib/planning-dry-run.test.js
npm run test:ci
npm run docs:check
npm run package:quiver
node bin/create-quiver.js spec validate specs/quiver-experimental-dry-run-planner --strict
```

## Guía breve para probarlo sin tocar tus proyectos

Versión: contrato experimental `schema_version: 1`, controlador
`dry-run-controller-v1`. Rama exacta: `feature/QUIVER-EXP-00-planning-contract`.
El PR #149 se integró en esta rama del PR #148; eso no equivale a integrarlo en
`main`. La rama funcional anterior se eliminó. Todavía no es una nueva versión
publicada en npm: instalar `create-quiver@latest` no selecciona este incremento.

Prerrequisitos: Git, Node.js 20.12 o posterior, npm y acceso al repositorio. Usá
una carpeta nueva dedicada a esta prueba, fuera de tus proyectos. La preparación
crea esa copia, sus dependencias y la caché de npm; no es una operación de cero
escrituras. El planificador solo recibe datos y devuelve un objeto en memoria.

```bash
git clone --branch feature/QUIVER-EXP-00-planning-contract --single-branch https://github.com/FabriJuncal/quiver.git quiver-planner-demo
cd quiver-planner-demo
git branch --show-current
git rev-parse HEAD
npm ci --ignore-scripts
node --test tests/lib/planning-dry-run.test.js
```

Resultado esperado: la rama indicada y 138 pruebas aprobadas, sin fallos. El SHA
mostrado debe coincidir con el último commit del PR que estés revisando. Las
pruebas enfocadas usan datos sintéticos y no leen ni modifican los archivos
nombrados por ellos. No ejecutes la preparación dentro de otro proyecto ni
cambies sus configuraciones.

### Cinco casos, un único comando

El siguiente comando funciona como una prueba manual de lectura: carga los dos
JSON incluidos, cambia copias en memoria e imprime cinco resultados. No genera
archivos ni llama a modelos, proveedores, redes o ejecutores.

```bash
node -e '
const {planDryRun} = require("./src/create-quiver/lib/planning/dry-run");
const fixtures = {
  development: require("./examples/planning-dry-run/development.json"),
  research: require("./examples/planning-dry-run/research.json")
};
const cases = [
  ["development", "development", "base"],
  ["research", "research", "base"],
  ["intermediate", "development", "shared"],
  ["unknown", "research", "unknown"],
  ["permission-missing", "development", "deny"]
];
for (const [name, domain, change] of cases) {
  const x = structuredClone(fixtures[domain]);
  if (change === "shared") x.trusted_context.resources[0].classification = "shared";
  if (change === "unknown") x.task.actions[0].claimed_risk = "unknown";
  if (change === "deny") x.trusted_context.permissions.grants = [];
  const r = planDryRun(x.task, x.trusted_context);
  const a = r.actions[0];
  console.log(JSON.stringify({
    case: name, status: r.status, decision: a.decision,
    risk: a.effective_risk, approval_required: a.approval_requirement.required,
    execution_authorized: r.execution_authorized,
    executed: r.executed, accepted: r.accepted
  }));
}
'
```

Salidas esperadas, en ese orden. Las claves y los valores de la API se conservan
exactamente; su significado se explica debajo:

```json
{"case":"development","status":"planned","decision":"eligible","risk":"low","approval_required":false,"execution_authorized":false,"executed":false,"accepted":false}
{"case":"research","status":"planned","decision":"eligible","risk":"low","approval_required":false,"execution_authorized":false,"executed":false,"accepted":false}
{"case":"intermediate","status":"planned","decision":"prepare-only","risk":"intermediate","approval_required":true,"execution_authorized":false,"executed":false,"accepted":false}
{"case":"unknown","status":"planned","decision":"approval-required","risk":"unknown","approval_required":true,"execution_authorized":false,"executed":false,"accepted":false}
{"case":"permission-missing","status":"denied","decision":"denied","risk":"low","approval_required":false,"execution_authorized":false,"executed":false,"accepted":false}
```

- Desarrollo identifica un archivo y la evidencia de pruebas que haría falta;
  no escribe un parche ni ejecuta esas pruebas propuestas
- Investigación planifica qué fuentes y criterios usar para comparar; no realiza
  la comparación, consulta fuentes, confirma afirmaciones ni ordena alternativas
- Riesgo intermedio permite describir preparación, con revisión antes de aplicar
- Riesgo incierto (`unknown`) exige aprobación aunque la clasificación del recurso
  parezca baja
- Sin permiso se deniega: una aprobación no crea el permiso que falta

Las 138 pruebas comprueban el comportamiento del planificador. La revisión humana
consiste en leer sus límites, decisiones, criterios y fuentes propuestos; no la
sustituyen esas pruebas. Ningún resultado acepta la tarea ni autoriza ejecutarla.

## Glosario de claves y términos

- `case`: nombre del caso de prueba en la salida resumida
- `task`: tarea que se quiere planificar; contiene objetivo, criterios y acciones
- `trustedContext`: contexto confiable separado de la tarea; aporta política,
  recursos, permisos y límites
- `claimed_risk`: riesgo declarado por quien solicita el plan; puede elevar la
  cautela, pero no reducirla ni conceder permisos
- `status`: estado general; `planned` significa planificado, `denied` denegado e
  `invalid` contrato inválido
- `decision`: decisión por acción; su significado está en «Decisiones y límites
  de recursos»
- `risk`: riesgo de la salida resumida; `low` es bajo, `intermediate` intermedio,
  `critical` crítico y `unknown` incierto
- `approval_required`: indica si hace falta aprobación; `true` no significa que
  esa aprobación ya se haya obtenido
- `execution_authorized`, `executed`, `accepted`: ejecución autorizada, acción
  ejecutada y tarea aceptada; siempre son `false` en esta versión
- `not-performed` y `not-verified`: verificación no realizada y criterio no verificado
- Huella digital o hash: resumen criptográfico del contenido; aquí se usa SHA-256
- Vínculo de contenido o binding: huella que asocia los datos protegidos con el
  plan; no es una identidad autenticada ni un permiso
- Instantánea o snapshot: representación aportada de un estado; el planificador
  no comprueba si sigue vigente
- Prueba sin ejecución o dry-run: preparación de un plan sin realizar sus acciones
- PR: solicitud de integración de cambios; un PR abierto o una aprobación local
  no equivalen a integrar cambios en `main`

## Preparar una propuesta Development revisable

La API adicional `prepareDevelopmentProposal(task, trustedContext, proposalInput)`
convierte un parche aportado por quien llama en un objeto listo para revisar.
No genera el parche con un modelo ni lo aplica. `planDryRun` conserva su salida,
su revisión y sus vínculos anteriores. La nueva semántica se identifica como
`development-proposal-v1` mediante `proposal_revision`.

Antes de llamar, obtené el `binding` de `planDryRun` para esos mismos argumentos.
Pasalo como `expected_plan_binding` dentro de `proposalInput`. La nueva función
vuelve a calcular el plan; un objeto de plan externo, un hash o un texto de
aprobación no sustituyen al contexto confiable ni otorgan permisos.

El esquema cerrado de `proposalInput` contiene:

- `schema_version`: `1`
- `expected_plan_binding`: vínculo del plan que se espera revisar
- `patches`: de uno a diez objetos con `action_id` y `unified_diff`
- `proposed_tests`: de una a cien entradas con `test_id`, `action_id`,
  `criterion_ids` y `description`; son descripciones, nunca comandos ejecutables
- `evidence_references`: hasta cien entradas con `evidence_id`, `input_id` y
  `criterion_ids`; puede ser un array vacío y no incluye resultados de pruebas

Solo se admiten tareas Development compuestas exclusivamente por acciones
`development.propose-change`, en fase `prepare`, con decisión recalculada
`prepare-only`. La revisión sigue siendo necesaria antes de aplicar. Cualquier
acción denegada, de otro dominio o capacidad, en fase `apply`, crítica o incierta
impide preparar toda la propuesta.

### Alcance y relación con las fuentes

Hay exactamente un parche y un archivo por acción, de uno a diez archivos en
total. No puede faltar una acción ni sobrar un parche. El recurso de destino
debe aparecer también entre las entradas de su propia acción con la misma huella
confiable. Se rechazan los recursos repetidos y las rutas repetidas, incluso si
solo difieren por mayúsculas y minúsculas.

Cada criterio de cada acción necesita al menos una prueba propuesta asociada a
esa acción. Una prueba no puede usar los criterios de otra acción. Una referencia
de evidencia solo puede asociar una entrada y criterios que compartan una acción;
no se abre ni se verifica el recurso indicado. Los identificadores de pruebas y
evidencias son únicos dentro de cada colección, y los criterios no se repiten
dentro de una entrada.

### Subconjunto de diff admitido

Se aceptan modificaciones de archivos existentes. El formato tiene cabeceras
`--- a/ruta` y `+++ b/ruta` para la misma ruta exacta, con una cabecera opcional
`diff --git a/ruta b/ruta`. No se admite `index` ni metadatos adicionales de Git.
No es un reemplazo general de `git apply`.

Las rutas solo usan letras ASCII, números, punto, guion, guion bajo y `/`, además
de respetar las exclusiones de seguridad anteriores. No se admiten espacios,
comillas, escapes ni rutas no canónicas. El contenido puede incluir Unicode
válido; se rechazan sustitutos UTF-16 aislados. Los saltos son LF y debe existir
un LF final; CR y NUL se rechazan, sin normalizarlos.

Cada hunk usa `@@ -inicio[,cantidad] +inicio[,cantidad] @@`, sin texto final.
Omitir una cantidad significa una línea. Una cantidad cero representa una
inserción o eliminación sin líneas en ese lado; ambas cantidades no pueden ser
cero. Las posiciones y sumas deben ser enteros seguros. Ambos lados avanzan sin
solapamientos ni posiciones iniciales repetidas. Los tramos sin cambios entre
hunks deben tener igual longitud en ambos lados, incluido el tramo inicial.
El cuerpo debe consumir exactamente las cantidades declaradas y contener al
menos una adición o eliminación en el conjunto del parche.

Las líneas de contenido comienzan por espacio, `-` o `+`. Una cabecera aparente
que tenga ese prefijo sigue siendo contenido del hunk. Todo el texto debe
consumirse: no se permiten hunks truncados, líneas sobrantes o basura final.
Se rechazan `/dev/null`, creación, borrado, renombrado, copias, modos, binarios,
diffs combinados y el marcador `\ No newline at end of file`.

Se mantienen las cadenas de hasta 8.000 unidades UTF-16, el preflight JSON
endurecido y sus límites de profundidad y recorrido. El total de los parches
no puede superar 64 KiB UTF-8, y los tres argumentos juntos no pueden superar
1 MiB en JSON canónico. Estos límites son independientes de los presupuestos
de acciones y bytes de entrada que ya aplica el controlador. El rechazo de
referencias compartidas se aplica dentro de cada argumento JSON. Compartir un
objeto entre argumentos no se rechaza por sí solo; la salida contiene copias
y no conserva esas referencias.

### Qué devuelve y qué falta verificar

`status` vale `prepared`, `denied` o `invalid`. Un rechazo devuelve todos los
arrays vacíos, alcance y vínculos nulos, y un código estable en `issues`; no se
entrega una propuesta parcial.

Una propuesta preparada contiene:

- `task`: identificadores de tarea y ejecución, y revisión
- `plan_binding`: vínculo del plan recalculado
- `files`: acción y su binding, recurso, ruta, `before_sha256`, `patch_sha256`,
  parche original y referencias de entrada con ruta y hash
- `scope`: IDs exactos de acciones y recursos, y rutas afectadas
- `proposed_tests`: pruebas propuestas con `status: not-performed`
- `evidence_references`: referencias con `status: not-verified`
- `proposal_binding`: huella de la propuesta completa, incluida la revisión
  semántica, el plan, alcance, parches, pruebas y referencias

`patch_sha256` resume los bytes UTF-8 del parche; no es una huella del archivo
resultante. Sin los bytes base, el módulo no comprueba que las líneas eliminadas
existan ni que el parche pueda aplicarse: `patch_applicability` siempre vale
`not-checked`. No devuelve `after_sha256`. Las rutas y snapshots tampoco prueban
que el archivo real exista, sea regular o siga igual.

`review` siempre exige revisión `before-apply` y mantiene `satisfied: false`.
`execution_authorized`, `executed` y `accepted` permanecen en `false`, incluso en
rechazos. La verificación permanece `not-performed`, con criterios
`not-verified`. El vínculo de contenido cambia al cambiar datos protegidos o el
orden de arrays, pero no por reordenar claves. No autentica ni autoriza.

### Probar una propuesta y tres rechazos

Este incremento vive en la rama
`feature/QUIVER-EXP-02-development-proposals`, dependiente de la rama del PR #148
mientras siga abierto. No está publicado en npm. Para probarlo, cloná esa rama
en una carpeta nueva, con Git, Node.js 20.12 o posterior, npm y acceso al repo:

```bash
git clone --branch feature/QUIVER-EXP-02-development-proposals --single-branch https://github.com/FabriJuncal/quiver.git quiver-proposal-demo
cd quiver-proposal-demo
git rev-parse HEAD
npm ci --ignore-scripts
node --test tests/lib/planning-dry-run.test.js tests/lib/planning-development-proposal.test.js
```

El SHA debe coincidir con el PR revisado. La preparación escribe esa copia,
dependencias y caché de npm. El comando siguiente solo carga el ejemplo sintético,
modifica copias en memoria e imprime resultados; no aplica los parches ni corre
las pruebas propuestas:

```bash
node -e '
const {prepareDevelopmentProposal} = require("./src/create-quiver/lib/planning/dry-run");
const example = require("./examples/planning-dry-run/development-proposal.json");
for (const name of ["prepared", "stale-binding", "extra-path", "missing-permission"]) {
  const x = structuredClone(example);
  if (name === "stale-binding") x.proposal_input.expected_plan_binding = "sha256:" + "f".repeat(64);
  if (name === "extra-path") x.proposal_input.patches[0].unified_diff =
    x.proposal_input.patches[0].unified_diff.replace("+++ b/src/example.js", "+++ b/src/other.js");
  if (name === "missing-permission") x.trusted_context.permissions.grants = [];
  const r = prepareDevelopmentProposal(x.task, x.trusted_context, x.proposal_input);
  console.log(JSON.stringify({
    case: name, status: r.status, files: r.files.length,
    issue: r.issues[0]?.code || null, patch_applicability: r.patch_applicability,
    verification: r.verification.status, execution_authorized: r.execution_authorized,
    executed: r.executed, accepted: r.accepted
  }));
}
'
```

Salida esperada:

```json
{"case":"prepared","status":"prepared","files":1,"issue":null,"patch_applicability":"not-checked","verification":"not-performed","execution_authorized":false,"executed":false,"accepted":false}
{"case":"stale-binding","status":"denied","files":0,"issue":"PLAN_BINDING_MISMATCH","patch_applicability":"not-checked","verification":"not-performed","execution_authorized":false,"executed":false,"accepted":false}
{"case":"extra-path","status":"invalid","files":0,"issue":"UNIFIED_DIFF_INVALID","patch_applicability":"not-checked","verification":"not-performed","execution_authorized":false,"executed":false,"accepted":false}
{"case":"missing-permission","status":"denied","files":0,"issue":"PLAN_DENIED","patch_applicability":"not-checked","verification":"not-performed","execution_authorized":false,"executed":false,"accepted":false}
```

El caso preparado deja un cambio concreto para leer junto a sus fuentes y
criterios. La prueba descrita en el ejemplo todavía debe ejecutarse mediante
un flujo autorizado aparte. Esta API no instala un ejecutor, no resuelve
aprobaciones y no modifica el comportamiento del CLI ni de Research.
