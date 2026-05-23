# Quiver

Quiver es un framework para trabajar con **WDD + SDD asistido por IA** en proyectos de software.
Ayuda a transformar un repositorio en un entorno donde humanos y agentes pueden entender el contexto, planificar por specs, ejecutar slices y revisar cambios con evidencia.
Está pensado para equipos que quieren usar IA de forma ordenada: primero workflow, después specs, después implementación.

## 🚀 Inicio rápido

### Usar Quiver con IA en un proyecto

Ejecutá Quiver desde la raíz del proyecto donde querés instalar el workflow:

```bash
npx create-quiver init --name "Mi Proyecto"
npx create-quiver flow
npx create-quiver prepare --dry-run
npx create-quiver analyze
npx create-quiver doctor
npx create-quiver ai agent set planner --provider codex --model "planner-model"
npx create-quiver ai agent set executor --provider codex --model "executor-model"
npx create-quiver ai prepare-context --dry-run
npx create-quiver ai onboard --dry-run
```

Después de eso, revisá:

- `AGENTS.md`
- `docs/PROJECT_MAP.md`
- `docs/AI_CONTEXT.md`
- `docs/AI_ONBOARDING_PROMPT.md`

La maquinaria interna queda en `.quiver/`. Las specs reales no se crean durante el init: aparecen cuando el plan técnico ya fue revisado y aprobado, usando `spec create`.

El flujo normal con IA continúa así:

```bash
npx create-quiver flow
npx create-quiver ai plan --phase acceptance --input requirements.md --dry-run
npx create-quiver ai revise --phase acceptance --input feedback.md --dry-run
npx create-quiver ai approve --phase acceptance --version <n>
npx create-quiver ai approvals
npx create-quiver ai plan --phase technical-plan --dry-run
npx create-quiver ai review-plan --dry-run
npx create-quiver ai approve --phase technical-plan --version <n>
npx create-quiver spec create --dry-run
npx create-quiver spec start specs/<project-slug>
npx create-quiver next
npx create-quiver ai execute-plan --dry-run --commit --mode manual
npx create-quiver ai execute-plan --dry-run --commit --mode delegated
```

Usá `--dry-run` para validar provider, rol, contexto, paths y olas sin ejecutar el modelo. `--mode manual` imprime prompts para asignar slices a mano; `--mode delegated` prepara la ejecución con workspaces seguros cuando hay paralelismo.

### Compatibilidad: macOS, Linux y Windows

El camino principal de Quiver está pensado para ser portable: usa `npx create-quiver ...`, `npm run quiver:*` y `node ...`. Esos comandos funcionan en macOS, Linux y Windows siempre que tengas Node.js, npm y Git instalados.

Reglas prácticas por sistema:

- macOS y Linux: podés copiar los ejemplos tal como están. Las rutas SSH suelen verse como `~/.ssh/github-work`.
- Windows con PowerShell: usá los mismos comandos `npx`, `npm` y `node`, pero adaptá rutas a formato Windows, por ejemplo `C:\Users\<usuario>\ssh\github-work`.
- Windows con Git Bash o WSL: podés usar rutas tipo Unix, por ejemplo `~/.ssh/github-work`.
- Los wrappers Bash bajo `tools/scripts/` son compatibilidad legacy u opcional. Para trabajo nuevo, preferí el CLI Node y los scripts `quiver:*`.

Cuando uses GitHub o PRs:

- `--ssh-host-alias` recibe el alias del host en tu configuración SSH, por ejemplo `github-work` o `github-personal`.
- `--identity-file` recibe la ruta al archivo de clave, que cambia según el sistema operativo.
- `gh` debe estar instalado y autenticado; Quiver lo valida con `ai doctor` o `ai pr --dry-run`.

### Desarrollar este repositorio

```bash
git clone <repo-url>
cd quiver
npm install
node bin/create-quiver.js --help
node --test tests/**/*.test.js
```

> El remote local detectado usa un alias SSH (`git@github-personal:FabriJuncal/quiver.git`). Si no tenés ese alias configurado, cloná con la URL que use tu equipo.

## 🧠 Workflow principal: WDD + SDD con IA

Quiver asume que la mayoría de los equipos lo van a usar para coordinar trabajo con agentes de IA. Por eso el flujo principal no empieza por código: empieza por contexto, workflow y planificación.

| Etapa | Qué significa | Artefactos principales |
|---|---|---|
| WDD | Workflow-Driven Development: dejar claro cómo se trabaja antes de implementar. | `AGENTS.md`, `docs/WORKFLOW.md`, `docs/AI_CONTEXT.md`, `docs/PROJECT_MAP.md` |
| SDD | Spec-Driven Development: definir el trabajo en specs y slices antes de tocar código. | `specs/<project-slug>/SPEC.md`, `slice.json`, `EXECUTION_BRIEF.md`, `pr.md` |
| IA planner | Agente que lee contexto amplio y propone criterios, plan técnico, spec y slices. | `ai prepare-context`, `ai onboard`, `ai plan` |
| IA executor | Agente que recibe un slice aprobado y trabaja con contexto mínimo. | `ai prompt-slice`, `ai execute-slice`, `check-scope`, `check-slice` |

Flujo recomendado:

```bash
npx create-quiver analyze
npx create-quiver flow
npx create-quiver doctor
npx create-quiver ai prepare-context --dry-run
npx create-quiver ai onboard --dry-run
npx create-quiver ai plan --phase acceptance --input requirements.md --dry-run
npx create-quiver ai revise --phase acceptance --input feedback.md --dry-run
npx create-quiver ai approve --phase acceptance --version <n>
npx create-quiver ai plan --phase technical-plan --dry-run
npx create-quiver ai review-plan --dry-run
npx create-quiver ai approve --phase technical-plan --version <n>
npx create-quiver spec create --dry-run
npx create-quiver spec start specs/<project-slug>
npx create-quiver graph
npx create-quiver next
npx create-quiver ai prompt-slice --slice specs/<project-slug>/slices/slice-01/slice.json --dry-run
npx create-quiver ai execute-slice --slice specs/<project-slug>/slices/slice-01/slice.json --dry-run --commit
npx create-quiver ai execute-plan --dry-run --commit --mode delegated
npx create-quiver ai pr --dry-run --input specs/<project-slug>/pr.md --ssh-host-alias github-work --identity-file ~/.ssh/github-work
```

Regla práctica: el planner no modifica código de producto; el executor solo trabaja sobre un slice aprobado y dentro de los archivos declarados en `slice.json`.

## 🛠️ Empezar a usar Quiver según tu caso

### 1. Proyecto nuevo desde cero

Usá este camino cuando todavía no existe el proyecto o estás arrancando una carpeta nueva y querés que Quiver acompañe el workflow desde el primer commit.

```bash
mkdir mi-proyecto
cd mi-proyecto
npx create-quiver init --name "Mi Proyecto"
npx create-quiver flow
npx create-quiver prepare --dry-run
npx create-quiver analyze
npx create-quiver doctor
npx create-quiver ai prepare-context --dry-run
npx create-quiver ai onboard --dry-run
```

Qué esperar:

- Quiver crea un contrato visible chico: `AGENTS.md`, `docs/`, `.gitignore`, scripts `quiver:*` en `package.json` y configuración interna en `.quiver/`.
- No crea `docs-template/`, `tools/scripts/` ni una spec placeholder en el flujo default.
- `analyze` crea el scan crudo en `.quiver/scans/PROJECT_SCAN.json` y el mapa legible en `docs/PROJECT_MAP.md`.
- `doctor` valida que el contrato inicial esté completo.
- `ai prepare-context --dry-run` muestra borradores y supuestos sin escribir; `ai onboard --dry-run` muestra cómo se incorporaría un agente planner sin ejecutar el provider todavía.

Después del bootstrap, revisá:

```bash
npx create-quiver ai plan --phase acceptance --input requirements.md --dry-run
npx create-quiver ai revise --phase acceptance --input feedback.md --dry-run
npx create-quiver ai approve --phase acceptance --version <n>
npx create-quiver ai plan --phase technical-plan --dry-run
npx create-quiver ai review-plan --dry-run
npx create-quiver ai approve --phase technical-plan --version <n>
npx create-quiver spec create --dry-run
npx create-quiver plan
npx create-quiver graph
npx create-quiver next
```

### 2. Proyecto ya iniciado sin Quiver

Usá este camino cuando el repo ya tiene código, pero nunca fue inicializado con Quiver.

Primero revisá el estado actual:

```bash
git status --short
```

Si hay cambios pendientes, conviene guardarlos, commitearlos o crear una rama dedicada para que el diff de onboarding sea fácil de revisar.

Luego inicializá Quiver desde la raíz del proyecto:

```bash
npx create-quiver init --name "Nombre del Proyecto"
npx create-quiver flow
npx create-quiver analyze
npx create-quiver doctor
npx create-quiver ai agent set planner --provider codex --model "planner-model"
npx create-quiver ai agent set executor --provider codex --model "executor-model"
npx create-quiver ai prepare-context --dry-run
npx create-quiver ai onboard --dry-run
git status --short
```

Qué esperar:

- Quiver agrega documentación, scripts `quiver:*` y archivos internos de soporte en `.quiver/`.
- No deberías mezclar este paso con cambios de producto.
- `docs/PROJECT_MAP.md` queda como fuente de verdad para stack, package manager, comandos y rutas importantes.
- Las specs y slices reales se crean después, con `spec create`, cuando ya existen criterios aprobados y un plan técnico revisado y aprobado.
- El primer trabajo de IA debería ser preparar contexto y planificación, no implementar.

Importante: no uses `migrate` para un proyecto que nunca tuvo Quiver. `migrate` es solo para proyectos previamente inicializados.

### 3. Proyecto iniciado con una versión vieja de Quiver

Usá este camino cuando el repo ya tiene señales de Quiver, pero querés actualizarlo al contrato actual.

Señales típicas de una instalación previa:

- `.quiver/state.json`
- `AGENTS.md`
- `docs/AI_CONTEXT.md`
- `docs/PROJECT_MAP.md`
- `docs-template/` como señal legacy u opcional
- `tools/scripts/` como señal legacy u opcional
- scripts `quiver:*` o scripts legacy en `package.json`

Desde la raíz del proyecto:

```bash
npx create-quiver doctor
npx create-quiver migrate
npx create-quiver analyze
npx create-quiver doctor
npx create-quiver ai prepare-context --dry-run
npx create-quiver ai onboard --dry-run
git status --short
```

Si estás en CI, offline o no querés que la migración instale dependencias automáticamente:

```bash
npx create-quiver migrate --skip-install
```

Qué esperar:

- La migración restaura o agrega archivos faltantes de forma aditiva.
- No debería sobrescribir archivos existentes de proyecto sin necesidad.
- Después de migrar, `analyze` actualiza el mapa técnico y `doctor` confirma los próximos pasos.
- `ai prepare-context --dry-run` ayuda a revisar supuestos del contexto migrado; `ai onboard --dry-run` valida que el contexto viejo quedó entendible para un agente planner.

Si `doctor` falla indicando que el proyecto no fue inicializado por Quiver, usá el flujo del caso 2.

## ✨ Qué hace

Quiver instala una estructura de trabajo para que un proyecto pueda usar IA sin improvisar contexto en cada tarea:

- documentación base para humanos y agentes;
- contexto AI-first con roles de planner y executor;
- specs y slices para dividir trabajo en partes revisables;
- comandos para planificar, ejecutar y validar trabajo asistido por IA;
- checks de readiness, PR, handoff y scope;
- plantillas de contribución, soporte, seguridad, changelog y GitHub Actions.

La idea práctica: primero contexto, después plan, después código.

## 🧱 Stack tecnológico

| Área | Tecnología detectada |
|---|---|
| Runtime | Node.js CLI |
| Lenguaje | JavaScript CommonJS |
| Package manager | npm (`package-lock.json`) |
| Binario npm | `create-quiver` y alias `quiver` -> `bin/create-quiver.js` |
| Tests | Node built-in test runner (`node:test`) |
| CI/CD | GitHub Actions |
| Distribución | Paquete npm público `create-quiver` |
| Base de datos | No detectada |
| Docker / Compose | No detectado |
| Prisma / Supabase / migrations / seeders | No detectados |

## 📦 Requisitos

- Node.js 22.x recomendado. La CI usa Node 22, aunque `package.json` todavía no declara `engines`.
- npm.
- Git, especialmente para ramas y worktrees.
- `shellcheck` si querés replicar localmente el job de CI que valida scripts Bash.
- Opcional: `gh` para preflight de PR con GitHub.
- CLI local de `codex`, `claude` o `gemini` si vas a ejecutar comandos de IA sin `--dry-run`.

No se detectaron archivos `.env`; Quiver no requiere variables de entorno para el flujo básico.

## 📁 Estructura del proyecto

| Ruta | Propósito |
|---|---|
| `bin/create-quiver.js` | Entry point ejecutable del CLI. |
| `src/create-quiver/` | Código fuente del CLI y comandos principales. |
| `src/create-quiver/commands/` | Comandos `ai`, `graph`, `next` y `plan`. |
| `src/create-quiver/lib/` | Lógica de análisis, doctor, slices, lifecycle, IA, Git y renderers. |
| `docs/` | Plantillas que Quiver copia a proyectos destino. |
| `specs/` | Specs internas del desarrollo de Quiver y templates usados cuando `spec create` crea una spec real. |
| `scripts/` | Scripts de packaging, release, CI smoke y wrappers legacy. |
| `tests/` | Tests unitarios y fixtures. |
| `examples/` | Ejemplo mínimo de spec/slice. |
| `i18n/es/` | Documentación y plantillas en español. |
| `.github/` | Workflows, templates de issues y PR. |

## ⚙️ Configuración

### Variables opcionales

| Variable | Uso |
|---|---|
| `SLICE_WORKTREES_DIR` | Cambia la carpeta donde `start-slice` crea worktrees. |
| `ALLOW_DRAFT_SLICE=1` | Permite iniciar slices en estado `draft`. Equivale a usar `--allow-draft`. |
| `QUIVER_VERSION` | Usada por scripts legacy de inicialización. |
| `QUIVER_MIGRATE` | Activa modo migración en scripts legacy. |
| `QUIVER_PROJECT_NAME` | Define nombre de proyecto en scripts legacy. |

Para IA sin `--dry-run`, la autenticación depende del proveedor local que uses (`codex`, `claude` o `gemini`). Para PR preflight, Quiver espera que `gh` y tu configuración SSH ya existan; no instala ni modifica credenciales.

## 🧭 Comandos principales

Los comandos reales del CLI se ejecutan con `npx create-quiver ...` o, durante desarrollo local, con `node bin/create-quiver.js ...`.
El paquete también publica el alias binario `quiver`, que apunta al mismo CLI. Usalo cuando el paquete ya esté instalado localmente; para bootstrap remoto, seguí usando `npx create-quiver`.

| Comando | Para qué sirve |
|---|---|
| `npx create-quiver init --name "Proyecto"` | Inicializa Quiver en un proyecto nuevo o nunca inicializado. |
| `npx create-quiver --name "Proyecto"` | Alias compatible del flujo de init recomendado. |
| `npx create-quiver --version` | Muestra la versión instalada del CLI. |
| `npx create-quiver --help` | Lista todos los comandos públicos con descripción, opciones principales y ejemplos recomendados. |
| `npx create-quiver help` | Alias legible de la ayuda completa. |
| `quiver --help` | Muestra la misma ayuda cuando Quiver ya está instalado localmente. |
| `npx create-quiver flow` | Muestra el estado inicial del flujo guiado y el próximo comando seguro sin escribir estado ni llamar providers. |
| `npx create-quiver ai agent set <role> --provider <provider> --model <label>` | Guarda perfiles reutilizables para planner, executor, reviewer o doctor sin guardar secretos. |
| `npx create-quiver ai agent list` | Lista los perfiles configurados. |
| `npx create-quiver ai agent show <role>` | Muestra un perfil específico. |
| `npx create-quiver ai run create --input requirements.md` | Crea un run persistente en `.quiver/runs/` para un requerimiento. |
| `npx create-quiver ai status` | Muestra la fase actual del run AI y el próximo comando seguro. |
| `npx create-quiver ai resume` | Reanuda el run AI desde la última fase válida sin depender del historial del chat. |
| `npx create-quiver ai inspect` | Resume specs, slices, runs, agentes, layout y próximos comandos accionables. |
| `npx create-quiver ai export --format json` | Exporta estado de specs, slices, runs, agentes, dependencias y migración para dashboards o agentes. |
| `npx create-quiver ai export --format markdown` | Exporta el mismo estado en Markdown legible para PRs o docs. |
| `npx create-quiver ai specs list` | Lista specs con estado, progreso y cantidad de slices. |
| `npx create-quiver ai slices list` | Lista slices con estado, progreso, dependencias y bloqueos. |
| `npx create-quiver ai trace report` | Muestra runs, olas de ejecución y estado de migración en formato humano. |
| `npx create-quiver ai approvals` | Muestra drafts versionados y aprobados por fase. |
| `npx create-quiver ai approve --phase acceptance --version <n>` | Aprueba una versión concreta de un draft guardado. |
| `npx create-quiver init --minimal` | Crea solo el contrato esencial de onboarding. |
| `npx create-quiver init --full` | Crea el layout amplio de compatibilidad. |
| `npx create-quiver init --legacy-scripts` | Agrega wrappers Bash legacy bajo `tools/scripts/`. |
| `npx create-quiver init --include-templates` | Exporta templates empaquetados bajo `.quiver/templates/`. |
| `npx create-quiver analyze` | Genera `.quiver/scans/PROJECT_SCAN.json` y `docs/PROJECT_MAP.md`. |
| `npx create-quiver doctor` | Valida que el contrato de Quiver esté completo. |
| `npx create-quiver doctor --fix --dry-run` | Muestra reparaciones seguras sin escribir archivos. |
| `npx create-quiver doctor --fix` | Aplica reparaciones no destructivas e idempotentes. |
| `npx create-quiver prepare --dry-run` | Ejecuta diagnóstico guiado de preparación sin escribir archivos. |
| `npx create-quiver prepare` | Refresca contexto y muestra riesgos, supuestos y próximos comandos. |
| `npx create-quiver ai prepare-context --dry-run` | Previsualiza docs de onboarding, diffs, supuestos, riesgos, contradicciones y rutas omitidas sin escribir. |
| `npx create-quiver migrate` | Actualiza proyectos que ya fueron inicializados con Quiver. |
| `npx create-quiver migrate --dry-run` | Muestra qué actualizaría la migración sin escribir archivos. |
| `npx create-quiver plan` | Lista slices pendientes en orden y calcula camino crítico. |
| `npx create-quiver graph` | Muestra el grafo de dependencias (`tree`, `mermaid` o `dot`). |
| `npx create-quiver next` | Sugiere el próximo slice listo para trabajar. |
| `npx create-quiver plan --include-completed` | Muestra slices completados para auditoría o demos. |
| `npx create-quiver graph --include-completed` | Incluye slices completados en el grafo histórico. |
| `npx create-quiver next --include-completed` | Mantiene la recomendación accionable y agrega historial completado. |
| `npx create-quiver spec create` | Crea la spec real desde el plan técnico revisado y aprobado. |
| `npx create-quiver spec start <spec-dir>` | Crea o reutiliza el worktree dedicado de una spec. Usá `--dry-run` para ver qué worktree se crearía sin tocar Git. |
| `npx create-quiver spec status <spec-dir>` | Muestra branch, path, `slice-00` y slices pendientes. |
| `npx create-quiver spec close <spec-dir>` | Cierra un worktree de spec ya mergeado y limpio; en modo normal también intenta traer los cambios del merge al checkout principal. |
| `npx create-quiver start-slice <slice.json>` | Prepara worktree y contexto para ejecutar un slice. |
| `npx create-quiver check-slice <slice.json>` | Valida readiness del slice. |
| `npx create-quiver check-slice --local <slice.json>` | Valida estructura local sin exigir remoto/base. |
| `npx create-quiver check-pr <slice.json>` | Valida estructura esperada para PR. |
| `npx create-quiver check-scope <slice.json>` | Verifica que los archivos modificados estén dentro del alcance declarado. |
| `npx create-quiver cleanup-slice <slice.json>` | Limpia worktree/branch local asociado a un slice. |
| `npx create-quiver refresh-active-slices` | Regenera el tablero local `ACTIVE_SLICES.md`. |
| `npx create-quiver check-handoff <handoff-or-brief.md>` | Valida un `HANDOFF.md` o un brief de slice (`EXECUTION_BRIEF.md` / `CLOSURE_BRIEF.md`). |
| `npx create-quiver new-handoff <spec-slug>` | Crea un handoff para una transferencia excepcional. |
| `npx create-quiver evidence run -- <comando>` | Ejecuta un comando y guarda evidencia local con exit code, duración y salida redactada/truncada. |
| `npx create-quiver demo create spec-viewer --dry-run` | Previsualiza el demo opcional Quiver Spec Viewer sin escribir archivos. |
| `npx create-quiver demo create spec-viewer --dir <target>` | Crea el demo estático con app, spec, slices, handoffs y validación. |

### Comandos de IA para WDD + SDD

```bash
npx create-quiver ai prepare-context --dry-run
npx create-quiver ai onboard --dry-run
npx create-quiver ai onboard --print-prompt
npx create-quiver ai agent set planner --provider codex --model "planner-model"
npx create-quiver ai agent set executor --provider codex --model "executor-model"
npx create-quiver ai agent set doctor --provider codex --model "diagnostic-model"
npx create-quiver ai agent list
npx create-quiver ai plan --phase acceptance --input requirements.md --dry-run
npx create-quiver ai plan --phase acceptance --input requirements.md --print-prompt
npx create-quiver ai revise --phase acceptance --input feedback.md --dry-run
npx create-quiver ai approve --phase acceptance --version <n>
npx create-quiver ai plan --phase technical-plan --dry-run
npx create-quiver ai review-plan --dry-run
npx create-quiver ai review-plan --print-prompt
npx create-quiver ai approve --phase technical-plan --version <n>
npx create-quiver spec create --dry-run
npx create-quiver ai prompt-slice --slice specs/<project-slug>/slices/slice-01/slice.json --dry-run
npx create-quiver ai execute-slice --slice specs/<project-slug>/slices/slice-01/slice.json --dry-run --commit
npx create-quiver ai execute-plan --dry-run --commit --mode manual
npx create-quiver ai execute-plan --dry-run --commit --mode delegated
npx create-quiver ai doctor --dry-run --ssh-host-alias github-work --identity-file ~/.ssh/github-work
npx create-quiver ai pr --dry-run --input specs/<project-slug>/pr.md --ssh-host-alias github-work --identity-file ~/.ssh/github-work
```

Providers soportados: `codex`, `claude` y `gemini`, siempre vía CLI local.
Usá `--dry-run` primero para revisar provider, rol, context pack y paths sin ejecutar el modelo. Usá `--print-prompt` cuando quieras ver el prompt exacto que se enviaría, sin depender de autenticación del provider.

Orden recomendado:

1. `ai prepare-context --dry-run`: revisa borradores de contexto, diffs, supuestos, riesgos y contradicciones antes de escribir docs. En modo escritura, Quiver guarda snapshots bajo `.quiver/runs/<run-id>/snapshots/`.
2. `ai onboard`: el planner entiende el repo y el workflow.
3. `ai plan --phase acceptance`: convierte requerimientos en criterios de aceptación.
4. `ai plan --phase technical-plan`: propone el plan técnico.
5. `ai review-plan`: revisa el plan como si fuera a producción, sin tocar código ni cuestionar el alcance aprobado.
6. `ai approve`: guarda criterios o la versión revisada del plan técnico.
7. `spec create`: genera spec, slices, handoffs y PR body desde el plan revisado y aprobado.
8. `spec start`: prepara un worktree por spec.
9. `ai prompt-slice`: imprime el prompt mínimo para asignar un slice manualmente.
10. `ai execute-slice` / `ai execute-plan`: ejecuta slices aprobados, con commit opt-in. `ai execute-slice` exige worktree/rama correctos, bloquea cambios fuera del alcance declarado, redacta logs sensibles y actualiza `CLOSURE_BRIEF.md`, `EVIDENCE_REPORT.md`, `COMMAND_LOG.md`, `STATUS.md` y `slice.json` cuando la ejecución pasa. Usá `--mode manual` para prompts y `--mode delegated` para worktrees temporales en olas paralelas.
11. `ai inspect` / `ai export`: exponen estado accionable y formatos JSON/Markdown para humanos, agentes o dashboards.
12. `ai doctor` / `ai pr`: valida GitHub y crea el PR solo con `--create`.
13. `spec close`: cierra el worktree después del merge.

## 🧪 Cómo probar que funciona

Validación rápida del repo:

```bash
node bin/create-quiver.js --help
node --test tests/**/*.test.js
npm run package:quiver
npm pack --dry-run
```

Validaciones adicionales disponibles:

```bash
npm run smoke:create-quiver
npm run smoke:doctor-fixtures
npm run smoke:guided-workflow
npm run smoke:tiered-pack
```

Para dejar evidencia resumida de una validación sin pegar logs completos:

```bash
npx create-quiver evidence run -- npm test
```

Por defecto la evidencia queda en `.quiver/evidence/`. También podés elegir destino con `--output <archivo>` y limitar stdout/stderr con `--max-output <n>`.

Para probar Quiver sin inventar una app desde cero:

```bash
npx create-quiver demo create spec-viewer --dry-run
npx create-quiver demo create spec-viewer --dir ./quiver-spec-viewer
```

El demo genera una app estática pequeña, specs/slices de ejemplo y scripts de validación. No forma parte de `init`; se crea solo cuando lo pedís.

Notas reales del estado actual:

- No hay script `npm test`; el comando verificado para tests es `node --test tests/**/*.test.js`.
- `npm run package:quiver` valida el contenido del paquete npm generado.
- `npm run smoke:guided-workflow` cubre el flujo guiado con IA sin llamadas reales pagas a providers.
- `npm run smoke:doctor-fixtures` valida la matriz de estados de proyecto que deben seguir cubiertos por doctor/preflight.

## 📜 Scripts npm

| Script | Uso |
|---|---|
| `npm run quiver:analyze` | Ejecuta `npx create-quiver analyze`. |
| `npm run quiver:flow` | Ejecuta `npx create-quiver flow`. |
| `npm run quiver:plan` | Ejecuta `npx create-quiver plan`. |
| `npm run quiver:prepare` | Ejecuta preparación guiada y diagnósticos. |
| `npm run quiver:graph` | Ejecuta `npx create-quiver graph`. |
| `npm run quiver:next` | Ejecuta `npx create-quiver next`. |
| `npm run quiver:doctor` | Ejecuta `npx create-quiver doctor`. |
| `npm run quiver:evidence` | Ejecuta `npx create-quiver evidence`; usalo como `npm run quiver:evidence -- run -- <comando>`. |
| `npm run quiver:ai:agent` | Ejecuta `npx create-quiver ai agent`. |
| `npm run quiver:ai:inspect` | Ejecuta `npx create-quiver ai inspect`. |
| `npm run quiver:ai:export` | Ejecuta `npx create-quiver ai export`. |
| `npm run quiver:ai:specs` | Ejecuta `npx create-quiver ai specs list`. |
| `npm run quiver:ai:slices` | Ejecuta `npx create-quiver ai slices list`. |
| `npm run quiver:ai:trace` | Ejecuta `npx create-quiver ai trace report`. |
| `npm run quiver:ai:onboard` | Ejecuta onboarding de IA. |
| `npm run quiver:ai:prepare-context` | Prepara docs de contexto IA solo en documentación; usalo primero con `-- --dry-run` para revisar diffs y contradicciones. |
| `npm run quiver:ai:plan` | Ejecuta planificación IA por fases. |
| `npm run quiver:ai:review-plan` | Revisa el plan técnico antes de aprobarlo y crear la spec. |
| `npm run quiver:ai:approve` | Guarda criterios o planes aprobados. |
| `npm run quiver:ai:prompt-slice` | Imprime un prompt mínimo para asignar un slice a un executor. |
| `npm run quiver:ai:execute-slice` | Ejecuta un slice con rol executor. |
| `npm run quiver:ai:execute-plan` | Imprime o ejecuta olas de slices; soporta `--mode manual` y `--mode delegated`. |
| `npm run quiver:ai:doctor` | Ejecuta preflight IA/GitHub. |
| `npm run quiver:ai:pr` | Ejecuta preflight de PR y crea PR con `--create`. |
| `npm run quiver:spec:create` | Ejecuta `npx create-quiver spec create`. |
| `npm run quiver:spec:start` | Ejecuta `npx create-quiver spec start`. |
| `npm run quiver:spec:status` | Ejecuta `npx create-quiver spec status`. |
| `npm run quiver:spec:close` | Ejecuta `npx create-quiver spec close`. |
| `npm run package:quiver` | Empaqueta y valida el tarball npm. |
| `npm run smoke:create-quiver` | Smoke del instalador `create-quiver`. |
| `npm run smoke:doctor-fixtures` | Smoke de la matriz de fixtures para validación, doctor y errores accionables. |
| `npm run smoke:guided-workflow` | Smoke del flujo guiado con IA, PR, cleanup y package safety. |
| `npm run smoke:tiered-pack` | Smoke de context packs y lifecycle. |
| `npm run release:quiver` | Release dry-run o publish, según flags. |

`package.json` también contiene scripts legacy como `check:slice`, `check:pr`, `start:slice`, `cleanup:slice` y `migrate` que apuntan a `tools/scripts/*`. En proyectos generados esos wrappers aparecen solo cuando se pide compatibilidad con `--legacy-scripts` o el perfil amplio `--full`; en este repo fuente requieren revisión antes de usarse directamente.

## 🔁 Flujo recomendado

1. Inicializá Quiver o migrá si el proyecto ya lo tenía.
2. Corré `analyze` para generar el mapa técnico.
3. Corré `doctor` para validar el contrato.
4. Prepará contexto IA con `ai prepare-context --dry-run` y revisá los supuestos antes de escribir.
5. Incorporá al planner con `ai onboard --dry-run`.
6. Convertí requerimientos en criterios, plan técnico y spec con `ai plan`; revisá el plan con `ai review-plan` antes de aprobarlo.
7. Creá la spec real con `spec create` y prepará su worktree con `spec start`.
8. Revisá dependencias con `graph`, `next` o `ai execute-plan --dry-run --mode manual`.
9. Para ejecución manual, generá el prompt con `ai prompt-slice --slice <slice.json> --dry-run`.
10. Ejecutá slices con `ai execute-slice --commit` o `ai execute-plan --execute --commit --mode delegated`.
11. Abrí el PR con `ai pr --create` después de revisar el dry-run.
12. Después del merge, cerrá el worktree con `spec close`.

## 🤝 Contribuir

1. Abrí un issue describiendo el problema o propuesta.
2. Acordá el alcance antes de implementar si hace falta.
3. Trabajá en un slice pequeño y revisable.
4. Incluí evidencia de validación en el PR.
5. Mantené una relación clara: un slice, un commit; una spec, un PR.

## 🚢 Release

Release dry-run:

```bash
npm run release:quiver
```

Publicar la versión actual:

```bash
bash scripts/release-quiver.sh --publish-current
```

Publicar con bump:

```bash
bash scripts/release-quiver.sh patch --publish
```

Antes de publicar, verificá autenticación y estado del paquete:

```bash
npm whoami
npm view create-quiver version
```

Checklist de release:

1. `node --test tests/**/*.test.js`
2. `npm run smoke:create-quiver`
3. `npm run smoke:doctor-fixtures`
4. `npm run smoke:guided-workflow`
4. `npm run smoke:tiered-pack`
5. `npm pack --dry-run`
6. Confirmar que el PR esta aprobado antes de publicar.

## 📚 Documentación útil

- [README para agentes de IA](./README_FOR_AI.md)
- [Changelog](./CHANGELOG.md)
- [Roadmap](./ROADMAP.md)
- [Backlog](./BACKLOG.md)
- [Guía de templates](./TEMPLATE.md)
- [Contribución](./CONTRIBUTING.md)
- [Seguridad](./SECURITY.md)

## Información confirmada y pendiente

- `package.json` está en `0.10.0` y `CHANGELOG.md` reconoce `0.10.0`.
- `package.json` no declara `engines`; la versión mínima real de Node queda pendiente. La CI usa Node 22.
- Si aparece alguna referencia vieja a `0.9.0`, hay que actualizarla al contrato actual antes de seguir.
- Los scripts legacy de `package.json` que apuntan a `tools/scripts/*` deben confirmarse para este repo fuente o separarse de los scripts pensados para proyectos generados con `--legacy-scripts` o `--full`.

## Licencia

MIT
