# Guia de UX del CLI de Quiver

Este documento define el estandar de experiencia para los comandos de Quiver. La meta es que el CLI sea claro para humanos, seguro para automatizacion y consistente para agentes de IA.

## Principios

- Los comandos deben explicar que modo estan usando: deterministico, planner-assisted, dry-run, review, interactive, JSON o CI.
- `--dry-run` debe ser el primer paso recomendado antes de escrituras, proveedores externos, worktrees, PRs o reparaciones.
- La salida humana puede usar jerarquia visual, loaders y color; la salida JSON debe permanecer limpia y parseable.
- Los prompts interactivos son opt-in. Ningun comando debe bloquear automatizaciones si `--interactive` no fue pedido.
- Las revisiones humanas ocurren antes de escrituras persistentes siempre que el comando soporte `--review`.
- Las credenciales viven en los CLIs de proveedor, `gh`, Git o el sistema operativo. Quiver no debe guardarlas.

## Colores de Quiver

Usar esta paleta en loaders, estados, etiquetas y enfasis visual:

| Token | Hex | Uso sugerido |
|---|---:|---|
| `sky` | `#86C8F2` | informacion, rutas, contexto |
| `blue` | `#6BADEB` | acciones primarias, progreso |
| `periwinkle` | `#7F9EE8` | modo planner, prompts |
| `violet` | `#9B82E6` | revision, decisiones humanas |
| `magenta` | `#D56AB0` | advertencias suaves, approval gates |

Reglas:

- Respetar `--no-color`, `NO_COLOR`, CI y terminales sin TTY.
- No depender solo del color para comunicar estado.
- Mantener fallback ASCII cuando Unicode no sea seguro.

## Banderas UX

| Flag | Definicion | Regla |
|---|---|---|
| `--with-planner` | Activa comportamiento asistido por planner cuando el comando lo soporta. | No debe ser decorativo. Si no cambia el comportamiento o contrato del comando, debe rechazarse. |
| `--interactive` | Habilita prompts humanos de confirmacion o eleccion. | Nunca se activa por defecto. Debe tener alternativa no interactiva. |
| `--review` | Abre o prepara revision humana antes de escrituras persistentes. | Debe usar `$VISUAL`, `$EDITOR` o dejar un artefacto revisable cuando no haya TTY. |
| `--dry-run` | Previsualiza sin escribir ni ejecutar acciones irreversibles. | Debe ser seguro y no requerir credenciales salvo que el comando lo documente. |
| `--print-prompt` | Imprime el prompt exacto sin ejecutar proveedor. | Debe evitar auth/provider execution. |
| `--json` | Emite salida machine-readable. | Incompatible con `--interactive` y `--review`. |
| `--no-color` | Desactiva color ANSI. | Debe respetarse en toda salida humana. |

## Matriz de soporte

| Comando | `--with-planner` | `--interactive` | `--review` | Notas |
|---|---:|---:|---:|---|
| `ai prepare-context` | si | si | si | Modo deterministico por defecto; planner opcional con contrato docs-only. |
| `ai plan` | si | si | si | El planner ya es implicito; `--with-planner` se acepta por consistencia. |
| `spec create` | si | si | si | Consume un plan tecnico aprobado del planner; no vuelve a ejecutar proveedor. Review previsualiza el paquete antes de escribir. |
| `ai pr` | no | si | si | Review edita `pr.md`; interactive confirma `gh pr create`. |
| `flow`, `next`, `graph` | no | no | no | Lectura/inspeccion; no deben exponer flags decorativas. |
| `ai inspect`, `ai export`, `ai specs list`, `ai slices list`, `ai trace report` | no | no | no | Superficies read-only o machine-readable. |

## Flujo recomendado para contexto de IA

Modo deterministico:

```bash
npx create-quiver ai prepare-context --dry-run
npx create-quiver ai prepare-context
```

Modo asistido por planner:

```bash
npx create-quiver ai prepare-context --with-planner --dry-run
npx create-quiver ai prepare-context --with-planner --print-prompt
npx create-quiver ai prepare-context --with-planner --review --interactive
```

El planner debe devolver una propuesta validable. Quiver solo acepta cambios en documentación/contexto permitida y rechaza rutas de producto, dependencias, build, runtime, lockfiles, salidas generadas, rutas absolutas y traversal.

## Seleccion de agentes, proveedores y modelos

Los perfiles de agente son configuracion de DX, no almacenamiento de credenciales. Deben guardar solo rol, proveedor, etiqueta de modelo, contexto, nombre visible y perfil por defecto.

Reglas:

- Si un comando usa un perfil con modelo, el dry-run debe mostrar proveedor, modelo, comando y si el adapter puede aplicar ese modelo.
- En ejecucion real, Quiver debe pasar el modelo al CLI del proveedor cuando el adapter lo soporta.
- Si un adapter no puede aplicar el modelo seleccionado, la ejecucion real debe bloquearse con un proximo paso claro.
- `--print-prompt` y `--dry-run` no deben exigir autenticacion del proveedor.
- Si no hay modelo seleccionado, los comandos existentes deben conservar su comportamiento anterior.

## Loaders y prompts

Usar loaders solo cuando aportan claridad:

```text
Analizando estructura del proyecto...
Leyendo contexto base...
Preparando prompt para planner...
Ejecutando agente...
```

Usar prompts interactivos cuando hay una decision humana real:

```text
? Aplicar 3 actualizaciones docs-only de contexto?
? Crear spec "quiver-demo"?
? Crear PR "Implementar dashboard"?
```

No usar prompts para informacion que ya se pueda expresar con flags.

## Revision con editor

Los comandos con `--review` deben:

1. Crear o abrir un artefacto revisable.
2. Respetar `$VISUAL` antes que `$EDITOR`.
3. No usar shell interpolation para abrir editores.
4. Bloquear escrituras si la revision se cancela.
5. Revalidar la propuesta editada cuando el contenido tiene contrato estructurado.
6. Reportar la ruta del artefacto si no se puede abrir un editor.

## Testing minimo

Cada comando que adopte estas reglas debe cubrir:

- modo `--dry-run`;
- salida sin TTY/CI;
- `--json` limpio o rechazo temprano si corresponde;
- `--interactive` aceptado y cancelado;
- `--review` aceptado, cancelado y editado;
- `--no-color`;
- rechazo de flags no soportadas con mensaje accionable.

## Checklist para nuevos comandos

- [ ] El comando define si es lectura, escritura, proveedor, worktree, PR o validacion.
- [ ] `--dry-run` existe si hay escrituras o efectos externos.
- [ ] `--with-planner`, `--interactive` y `--review` solo se aceptan si agregan valor real.
- [ ] La salida JSON no se mezcla con prompts, colores, loaders ni texto humano.
- [ ] Los mensajes de error incluyen proximo paso seguro.
- [ ] La documentacion publica y `README_FOR_AI.md` quedan sincronizados.
