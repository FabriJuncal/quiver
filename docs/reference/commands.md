# Referencia de comandos de Quiver

Usá `npx --yes create-quiver@latest --help` para ver la lista viva de comandos soportados por la versión instalada.

## Configuración inicial

| Comando | Para qué sirve |
|---|---|
| `npx --yes create-quiver@latest --version` | Muestra la versión del CLI. |
| `npx --yes create-quiver@latest --help` | Muestra los comandos soportados. |
| `npx --yes create-quiver@latest init --name "Proyecto"` | Inicializa Quiver en un proyecto. |
| `npx --yes create-quiver@latest migrate --dry-run` | Previsualiza migración de un proyecto Quiver anterior. |
| `npx --yes create-quiver@latest migrate` | Aplica la migración. |
| `npx --yes create-quiver@latest analyze` | Genera mapa del proyecto y datos de escaneo. |
| `npx --yes create-quiver@latest doctor` | Valida la salud de Quiver. |
| `npx --yes create-quiver@latest flow` | Muestra el próximo paso seguro. |

## Planificación con IA

| Comando | Para qué sirve |
|---|---|
| `npx --yes create-quiver@latest ai prepare-context --dry-run` | Previsualiza actualizaciones documentales de contexto para IA. |
| `npx --yes create-quiver@latest ai prepare-context` | Escribe actualizaciones documentales de contexto para IA. |
| `npx --yes create-quiver@latest ai agent set <role> --provider <provider> --model "<label>"` | Guarda un perfil de agente sin secretos. |
| `npx --yes create-quiver@latest ai run create --input <file>` | Inicia una ejecución persistente de IA. |
| `npx --yes create-quiver@latest ai status` | Muestra el estado de la ejecución actual. |
| `npx --yes create-quiver@latest ai plan --phase acceptance --input <file>` | Genera criterios de aceptación. |
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
| `npx --yes create-quiver@latest ai pr --create --input specs/<spec>/pr.md` | Crea el PR usando `gh`. |
| `npx --yes create-quiver@latest spec close specs/<spec> --dry-run` | Previsualiza limpieza del worktree después del merge. |
| `npx --yes create-quiver@latest spec close specs/<spec>` | Cierra el worktree de la spec mergeada. |

## Opciones útiles

| Opción | Para qué sirve |
|---|---|
| `--dry-run` | Previsualiza sin escribir archivos ni ejecutar proveedores. |
| `--print-prompt` | Imprime el prompt del proveedor sin ejecutarlo. |
| `--provider codex\|claude\|gemini` | Selecciona CLI local de proveedor. |
| `--commit` | Permite que Quiver commitee trabajo validado del slice. |
| `--mode manual` | Imprime prompts para asignación manual de ejecutores. |
| `--mode delegated` | Usa ejecución delegada con worktrees temporales cuando es seguro. |
| `--ssh-host-alias <alias>` | Alias SSH de GitHub para validaciones de PR. |
| `--identity-file <path>` | Ruta de la clave SSH para validaciones de PR. |
