# Referencia de comandos de Quiver

Usá `npx --yes create-quiver@latest --help` para ver la lista viva de comandos soportados por la versión instalada.

## Configuración inicial

| Comando | Para qué sirve |
|---|---|
| `npx --yes create-quiver@latest --version` | Muestra la versión del CLI. |
| `npx --yes create-quiver@latest --help` | Muestra los comandos soportados. |
| `npx --yes create-quiver@latest init --name "Proyecto"` | Inicializa Quiver en un proyecto. |
| `npx --yes create-quiver@latest init --interactive` | Abre una guía interactiva para elegir modo de proyecto, metodología `wdd-sdd`, perfil inicial y próximos pasos de agentes. |
| `npx --yes create-quiver@latest migrate --dry-run` | Previsualiza migración de un proyecto Quiver anterior. |
| `npx --yes create-quiver@latest migrate` | Aplica la migración. |
| `npx --yes create-quiver@latest analyze` | Genera mapa del proyecto y datos de escaneo. |
| `npx --yes create-quiver@latest doctor` | Valida la salud de Quiver. |
| `npx --yes create-quiver@latest doctor --json` | Emite el mismo diagnóstico de Doctor como JSON parseable para automatización. |
| `npx --yes create-quiver@latest flow` | Muestra el próximo paso seguro. |

## Planificación con IA

| Comando | Para qué sirve |
|---|---|
| `npx --yes create-quiver@latest ai prepare-context --dry-run` | Previsualiza actualizaciones documentales de contexto para IA. |
| `npx --yes create-quiver@latest ai prepare-context` | Escribe actualizaciones documentales de contexto para IA. |
| `npx --yes create-quiver@latest ai prepare-context --with-planner --dry-run` | Previsualiza una propuesta docs-only generada por el planner sin escribir archivos. |
| `npx --yes create-quiver@latest ai prepare-context --with-planner --print-prompt` | Imprime el prompt exacto para ejecutar el planner en otro entorno. |
| `npx --yes create-quiver@latest ai prepare-context --with-planner --review --interactive` | Ejecuta planner, abre revisión humana y pide confirmación antes de escribir docs permitidos. |
| `npx --yes create-quiver@latest ai models list` | Lista proveedores y modelos conocidos por Quiver sin afirmar disponibilidad en la cuenta. |
| `npx --yes create-quiver@latest ai models list --provider codex` | Filtra el catálogo local por proveedor. |
| `npx --yes create-quiver@latest ai models list --json` | Emite el catálogo local en JSON parseable. |
| `npx --yes create-quiver@latest ai agent set <role>` | En TTY, guía la selección de proveedor, modelo conocido por Quiver o modelo custom. |
| `npx --yes create-quiver@latest ai agent set <role> --provider <provider> --model <model-id>` | Guarda un perfil de agente sin secretos en modo script/no-TTY. |
| `npx --yes create-quiver@latest ai agent set planner --provider codex --model gpt-5.5 --dry-run` | Previsualiza la escritura del perfil sin modificar `.quiver/agents/profiles.json`. |
| `npx --yes create-quiver@latest ai agent doctor` | Diagnostica perfiles de agentes, alias visuales, proveedores faltantes y modelos custom no validados. |
| `npx --yes create-quiver@latest ai agent doctor --json` | Emite el diagnóstico de perfiles como JSON parseable. |
| `npx --yes create-quiver@latest ai agent repair --dry-run` | Previsualiza reparaciones seguras de perfiles, como normalizar `model: "GPT 5.5"` a `model: "gpt-5.5"` y `displayName: "GPT 5.5"`. |
| `npx --yes create-quiver@latest ai run create --input <file>` | Inicia una ejecución persistente de IA. |
| `npx --yes create-quiver@latest ai status` | Muestra el estado de la ejecución actual. |
| `npx --yes create-quiver@latest ai plan --phase acceptance --input <file>` | Genera criterios de aceptación. |
| `npx --yes create-quiver@latest ai plan --phase acceptance --review --interactive --input <file>` | Permite revisar y confirmar el borrador del planner antes de guardarlo. |
| `npx --yes create-quiver@latest ai revise --phase acceptance --input <file>` | Crea una nueva versión de criterios. |
| `npx --yes create-quiver@latest ai approve --phase acceptance --version <n>` | Aprueba criterios. |
| `npx --yes create-quiver@latest ai plan --phase technical-plan` | Genera plan técnico. |
| `npx --yes create-quiver@latest ai review-plan` | Revisa el plan técnico. |
| `npx --yes create-quiver@latest ai approve --phase technical-plan --version <n>` | Aprueba el plan técnico revisado. |

## Specs y slices

| Comando | Para qué sirve |
|---|---|
| `npx --yes create-quiver@latest spec create --dry-run` | Previsualiza archivos de spec generados. |
| `npx --yes create-quiver@latest spec create` | Genera spec, slices, briefs, plan de ejecución y cuerpo del PR. |
| `npx --yes create-quiver@latest spec create --review --interactive` | Abre una revisión del paquete a generar y pide confirmación antes de escribir. |
| `npx --yes create-quiver@latest spec create --interactive` | Guía la selección de metodología `wdd-sdd`, input aprobado y modo de revisión antes de escribir. |
| `npx --yes create-quiver@latest spec validate specs/<spec> --strict` | Valida el paquete de spec. |
| `npx --yes create-quiver@latest spec start specs/<spec>` | Crea o reutiliza el worktree de una spec. |
| `npx --yes create-quiver@latest plan --spec <spec>` | Muestra el orden de ejecución de slices. |
| `npx --yes create-quiver@latest graph --spec <spec>` | Muestra dependencias entre slices. |
| `npx --yes create-quiver@latest next --all-ready --spec <spec>` | Lista slices listos para ejecutar. |
| `npx --yes create-quiver@latest ai prompt-slice --slice <slice.json> --dry-run` | Imprime un prompt mínimo para el ejecutor. |
| `npx --yes create-quiver@latest ai execute-slice --slice <slice.json> --commit` | Ejecuta un slice y commitea después de validar. |
| `npx --yes create-quiver@latest ai execute-plan --execute --commit --mode delegated` | Ejecuta slices delegados por olas. |

## PR y cierre

| Comando | Para qué sirve |
|---|---|
| `npx --yes create-quiver@latest ai pr --dry-run --input specs/<spec>/pr.md` | Previsualiza creación de PR y readiness de GitHub. |
| `npx --yes create-quiver@latest ai pr --review --dry-run --input specs/<spec>/pr.md` | Abre `pr.md` para revisión y vuelve a armar el plan de PR sin crear el PR. |
| `npx --yes create-quiver@latest ai pr --create --input specs/<spec>/pr.md` | Crea el PR usando `gh`. |
| `npx --yes create-quiver@latest spec close specs/<spec> --dry-run` | Previsualiza limpieza del worktree después del merge. |
| `npx --yes create-quiver@latest spec close specs/<spec>` | Cierra el worktree de la spec mergeada. |

## Opciones útiles

| Opción | Para qué sirve |
|---|---|
| `--dry-run` | Previsualiza sin escribir archivos ni ejecutar proveedores. |
| `--print-prompt` | Imprime el prompt del proveedor sin ejecutarlo. |
| `--with-planner` | Activa comportamiento asistido por planner solo en comandos que lo soportan. |
| `--interactive` | Habilita prompts humanos de confirmación o elección. |
| `--review` | Abre o prepara revisión humana antes de escrituras persistentes. |
| `--methodology wdd-sdd` | Declara la metodología soportada por comandos interactivos o automatizados. |
| `--no-color` | Desactiva colores ANSI en salida humana. |
| `--provider codex\|claude\|gemini` | Selecciona CLI local de proveedor. |
| `--model <model-id>` | Selecciona el identificador técnico del modelo para `ai agent set` o ejecución de proveedor. Quiver normaliza alias conocidos, pero no garantiza acceso en la cuenta del proveedor. |
| `--commit` | Permite que Quiver commitee trabajo validado del slice. |
| `--mode manual` | Imprime prompts para asignación manual de ejecutores. |
| `--mode delegated` | Usa ejecución delegada con worktrees temporales cuando es seguro. |
| `--ssh-host-alias <alias>` | Alias SSH de GitHub para validaciones de PR. |
| `--identity-file <path>` | Ruta de la clave SSH para validaciones de PR. |

## Matriz de flags UX

| Comando | `--with-planner` | `--interactive` | `--review` |
|---|---:|---:|---:|
| `ai prepare-context` | sí | sí | sí |
| `ai plan` | sí | sí | sí |
| `spec create` | sí | sí | sí |
| `ai pr` | no | sí | sí |
| `flow`, `next`, `graph` | no | no | no |
| `ai inspect`, `ai export`, `ai specs list`, `ai slices list`, `ai trace report` | no | no | no |

`--json` no se puede combinar con `--interactive` ni `--review`, porque la salida debe mantenerse legible por máquinas. El estándar completo vive en [docs/CLI_UX_GUIDE.md](../CLI_UX_GUIDE.md).

Nota: `spec create --with-planner` no ejecuta un proveedor nuevo; indica que el comando consume el plan técnico aprobado generado por el planner.
