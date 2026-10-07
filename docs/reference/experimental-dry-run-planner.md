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
