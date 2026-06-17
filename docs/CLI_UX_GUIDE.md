# Guia de UX del CLI de Quiver

Este documento define el estandar de experiencia para los comandos de Quiver. La meta es que el CLI sea claro para humanos, seguro para automatizacion y consistente para agentes de IA.

## Principios

- Los comandos deben explicar que modo estan usando: deterministico, planner-assisted, dry-run, review, interactive, JSON o CI.
- `--dry-run` debe ser el primer paso recomendado antes de escrituras, proveedores externos, worktrees, PRs o reparaciones.
- La salida humana puede usar jerarquia visual, loaders y color; la salida JSON debe permanecer limpia y parseable.
- Los prompts interactivos son opt-in, salvo confirmaciones de seguridad para comandos destructivos como `migrate`. Ningun comando debe quedar esperando input en CI/no-TTY; debe fallar con guia accionable o aceptar un bypass explicito como `--yes`.
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
| `--methodology <name>` | Selecciona metodologia cuando el comando necesita exponer esa decision. | Hoy solo se acepta `wdd-sdd`; no listar metodologias no soportadas. |
| `--dry-run` | Previsualiza sin escribir ni ejecutar acciones irreversibles. | Debe ser seguro y no requerir credenciales salvo que el comando lo documente. |
| `--print-prompt` | Imprime el prompt exacto sin ejecutar proveedor. | Debe evitar auth/provider execution. |
| `--json` | Emite salida machine-readable. | Incompatible con `--interactive` y `--review`. |
| `--no-color` | Desactiva color ANSI. | Debe respetarse en toda salida humana. |

## Idioma de salida

Quiver soporta salida humana en `en` y `es`. Los comandos deben resolver el idioma con esta precedencia:

1. `--lang en|es`
2. `QUIVER_LANG`
3. `.quiver/config.json`
4. `~/.quiver/config.json`
5. locale del entorno
6. fallback `en`

Reglas:

- `--lang` debe funcionar antes o despues del comando.
- `config language set es` guarda el idioma del proyecto sin exigir flags en cada ejecucion.
- `config language set en --global` guarda el idioma global del usuario.
- Los comandos, flags, rutas, ids, providers, modelos y snippets sugeridos no se traducen.
- `--json` mantiene claves, codigos y estructura estable; no se localizan campos machine-readable.
- Warnings por idioma no soportado se muestran solo en salida humana y no contaminan stdout JSON.
- CI, no-TTY y `--no-color` deben seguir sin prompts, spinners ni ANSI inesperado.

## Templates y docs generados

La salida CLI y los docs generados comparten resolucion de idioma, pero son superficies distintas:

- salida CLI: textos humanos impresos durante un comando;
- docs generados: archivos Markdown creados por comandos como `init`;
- machine artifacts: JSON, JSONL, `package.json`, `slice.json`, ids, comandos, flags, rutas, providers y modelos.

Solo las dos primeras superficies se localizan. Los machine artifacts permanecen estables.

Los templates humanos generados por Quiver usan el mismo idioma resuelto para la salida CLI. El template base sin sufijo es el fallback `en`; las variantes localizadas agregan el idioma antes de `.template`.

Ejemplos:

- `docs/INDEX.md.template` es el fallback estable en ingles.
- `docs/INDEX.md.es.template` es la variante espanola.
- `AGENTS.md.es.template` es la variante espanola de `AGENTS.md.template`.

Reglas:

- Solo se enrutan templates humanos, principalmente Markdown.
- Artefactos machine-readable como `package.template.json` y `slice.json` no se localizan.
- Si falta una variante localizada, Quiver debe hacer fallback explicito a `en` y la cobertura debe poder detectarlo en tests.
- No duplicar templates grandes si una fragmentacion compartida resuelve el caso con menor mantenimiento.

## Matriz de soporte

| Comando | `--with-planner` | `--interactive` | `--review` | Notas |
|---|---:|---:|---:|---|
| `init` | no | si | no | Interactive guia modo de proyecto, metodologia `wdd-sdd`, perfil inicial y proximo paso de perfiles de agentes. |
| `migrate` | no | no | no | En TTY confirma antes de escribir; en CI/no-TTY requiere `--yes`. `--dry-run` no pide confirmacion ni escribe. |
| `ai analyze-project` | no | no | si | `--dry-run` es read-only y no ejecuta proveedor; el comando normal con provider aplica docs validados; `--review` queda como modo avanzado de edicion JSON. |
| `ai prepare-context` | si | si | si | Modo deterministico por defecto; planner opcional con contrato docs-only. |
| `ai plan` | si | si | si | El planner ya es implicito; `--with-planner` se acepta por consistencia. |
| `spec create` | si | si | si | Consume un plan tecnico aprobado del planner; no vuelve a ejecutar proveedor. Review previsualiza el paquete antes de escribir. |
| `ai pr` | no | si | si | Review edita `pr.md`; interactive confirma `gh pr create`. |
| `ai execute-slice` | no | si | no | Interactive puede seleccionar un slice listo y un executor configurado. |
| `ai execute-plan` | no | si | no | Interactive queda reservado para estrategia/seleccion; JSON sigue limpio. |
| `ai agent set` | no | si | no | En TTY puede guiar proveedor/modelo; en CI/no-TTY requiere `--provider` y `--model`. |
| `ai approve` | no | no | no | Si falta `--version` y hay TTY, abre selector de drafts; en CI/no-TTY exige `--version <n>`. |
| `ai agent doctor` | no | no | no | Diagnostica perfiles sin escribir; `--json` usa el mismo modelo de hallazgos. |
| `ai agent repair` | no | no | no | Por ahora solo `--dry-run`; muestra before/after sin escribir. |
| `ai models list` | no | no | no | Lista el catalogo local conocido por Quiver; no valida acceso de cuenta. |
| `doctor` | no | no | no | Renderiza `Quiver Doctor`, `Checks` y `Suggested fixes`; `--json` usa el mismo modelo de hallazgos. |
| `flow`, `dashboard`, `next`, `graph`, `version` | no | no | no | Lectura/inspeccion; `dashboard` puede acotarse con `--details`, `--section` y `--limit`, pero no acepta flags decorativas. |
| `ai inspect`, `ai export`, `ai specs list`, `ai slices list`, `ai trace report` | no | no | no | Superficies read-only o machine-readable. |

## Contratos read-only de plan, graph y next

- `next --auto-start` requiere TTY interactiva; en CI/no-TTY falla antes de iniciar un slice y no emite JSON parcial.
- `plan` mantiene JSON limpio. Las advertencias sobre slices sin `estimated_hours` positivo aparecen solo en salida humana y esos slices cuentan como `0h`.
- `graph --level <n>` mantiene JSON limpio. Si el nivel no existe, la salida humana muestra un estado vacio localizado y `--json` emite `levels: []` / `conflicts: []`.
- `graph --json` tiene precedencia sobre `--format tree|mermaid|dot`; con ambos flags, la salida sigue siendo JSON parseable.

## Flujo recomendado para contexto de IA

Analisis profundo de un proyecto existente:

```bash
npx create-quiver ai analyze-project --deep --dry-run
npx create-quiver ai analyze-project --deep --dry-run --json
npx create-quiver ai analyze-project --deep --provider codex --model gpt-5.5
npx create-quiver ai analyze-project --deep --save-proposal --provider codex --model gpt-5.5
npx create-quiver ai analyze-project apply --run <run-id>
```

`ai analyze-project` debe mantener estas garantias: en `--dry-run` no escribe ni ejecuta proveedor; el modo provider normal genera auditoria, propuesta, snapshot y aplica docs finales validados; con proveedor no lee `.env`, dependencias, caches, binarios ni outputs generados; toda conclusion importante cita evidencia o queda como `unknown`; las escrituras se limitan a docs aprobados, usan bloques gestionados por Quiver y crean snapshot previo.

Opciones de aplicacion:

- `--apply-docs` en TTY muestra opciones explicadas: aplicar, ver diff, guardar propuesta, editar propuesta o cancelar.
- `--apply-docs --yes` aplica en automatizacion despues de validar propuesta, hashes, snapshot y post-write.
- `--save-proposal` guarda `.quiver/runs/<run-id>/proposal/*` sin escribir docs finales.
- `ai analyze-project apply --run <run-id>` aplica una propuesta guardada sin ejecutar proveedor ni requerir `--provider` o `--model`.
- `--review` se mantiene como modo avanzado: abre la propuesta JSON en editor y revalida el JSON editado antes de escribir.

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

Los perfiles de agente son configuracion de DX, no almacenamiento de credenciales. Deben guardar solo rol, proveedor, identificador tecnico de modelo, nombre visible, contexto, profile id y perfil por defecto.

Contrato de datos:

- `model` es el identificador tecnico que Quiver pasa al CLI del proveedor, por ejemplo `gpt-5.5`.
- `displayName` es el nombre humano que Quiver muestra en selectores, loaders y reportes, por ejemplo `GPT 5.5`.
- `ai models list` muestra modelos conocidos por Quiver. Eso no significa que el proveedor o la cuenta del usuario tengan acceso real a todos ellos.
- Un modelo custom esta permitido, pero debe quedar marcado como custom/no validado hasta que una ejecucion real lo pruebe.

Reglas:

- En TTY, `ai agent set <role>` puede abrir selectores de proveedor y modelo cuando faltan flags.
- En no-TTY/CI, `ai agent set <role>` debe exigir `--provider` y `--model`; no debe quedarse esperando input.
- `ai agent doctor` debe identificar perfiles heredados con alias visuales guardados en `model`.
- `ai agent repair --dry-run` debe mostrar cambios before/after y no escribir archivos.
- Si un comando usa un perfil con modelo, el dry-run debe mostrar proveedor, modelo, comando y si el adapter puede aplicar ese modelo.
- En ejecucion real, Quiver debe pasar el modelo al CLI del proveedor cuando el adapter lo soporta.
- Si un adapter no puede aplicar el modelo seleccionado, la ejecucion real debe bloquearse con un proximo paso claro.
- `--print-prompt` y `--dry-run` no deben exigir autenticacion del proveedor.
- Si no hay modelo seleccionado, los comandos existentes deben conservar su comportamiento anterior.

## Init y spec create interactivos

`init --interactive` debe ser un wrapper opt-in sobre flags existentes:

- modo de proyecto: proyecto existente, proyecto nuevo o solo validar estructura;
- metodologia: solo `WDD + SDD`;
- perfil inicial: default, minimal o full compatibility;
- guia opcional de comandos `ai agent set` sin guardar credenciales ni ejecutar proveedores;
- resumen antes de escribir.

`spec create --interactive` debe:

- seleccionar la metodologia real soportada: `WDD + SDD`;
- mostrar el input aprobado que se usara para generar la spec, la version aprobada y el resumen de review;
- permitir elegir confirmacion directa o `--review`;
- mostrar resumen antes de escribir;
- bloquearse en no-TTY/CI/JSON con mensaje accionable en lugar de abrir prompts.

## Aprobaciones planner

`ai approve` conserva el modo script con `--version <n>`, pero en una terminal humana puede guiar la eleccion cuando falta `--version`:

- `ai approve --phase acceptance` lista drafts versionados y recomienda el current/latest elegible.
- `ai approve --phase technical-plan` agrega estado de `plan-review`, recomendacion, fixes requeridos, hardening opcional y riesgos.
- CI/no-TTY nunca espera input; falla temprano con el comando explicito `--version <n>`.
- Las versiones historicas pueden mostrarse como contexto, pero solo el draft current/latest es aprobable.
- Los snippets o previews de candidatos deben estar truncados y redactados.
- `ai approvals`, `flow`, `ai status`, `ai resume` y `spec create --interactive` deben usar el mismo modelo de candidatos para no contradecir el proximo paso.

## Loaders y prompts

Usar loaders solo cuando aportan claridad:

```text
◇ Ejecutando onboarding con GPT 5.5
✓ Leyendo docs base
✓ Detectando estructura
✓ Preparando prompt
⠋ Ejecutando agente...
```

Usar prompts interactivos cuando hay una decision humana real:

```text
? Aplicar 3 actualizaciones docs-only de contexto?
? Crear spec "quiver-demo"?
? Crear PR "Implementar dashboard"?
```

No usar prompts para informacion que ya se pueda expresar con flags.

Los comandos provider-backed `ai plan`, `ai revise`, `ai review-plan` y `ai repair-plan` deben seguir el mismo patron de progreso en TTY: checks de preparacion reales y spinner solo durante ejecucion del proveedor. `--dry-run`, `--print-prompt`, CI, no-TTY y JSON no deben mostrar loaders falsos.

## Salida de Doctor

`doctor` debe mostrar una jerarquia estable para humanos:

```text
◆ Quiver Doctor

Checks
  ✓ Layout: new
  ✓ Specs: none yet
  ! Warning: project analysis artifacts not found; run analyze when you need the visible project map

Suggested fixes
  • Analyze the project first: npx create-quiver analyze
  • Check the next ready slice: npx create-quiver next
```

Reglas:

- La salida humana debe incluir siempre `Quiver Doctor`, `Checks` y `Suggested fixes`.
- `doctor --json` debe emitir solo JSON parseable, sin colores, prompts ni texto humano.
- La salida humana y JSON deben salir del mismo modelo de checks, warnings, errors y suggested fixes.
- Warnings no deben romper automatizacion; errores bloqueantes deben usar `exit_code: 1` y `process.exitCode = 1`.

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
