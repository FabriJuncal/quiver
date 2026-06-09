# CLOSURE_BRIEF - 07-slice

## Resultado

Completado como contrato de docs, tests y evidencia, consolidado con el gate real usado durante `06-slice`.

## Evidencia

Checklist de evidencia por tipo de cambio futuro:

| Tipo de cambio | Evidencia minima |
|---|---|
| Parser/dispatch | `node --check` de entrypoints afectados; help global; comando desconocido; version human/json; matriz de comandos afectados |
| Comando existente | Antes/despues; flags; aliases; stdout/stderr; JSON si aplica; exit codes; side effects; rollback |
| Comando nuevo | No colisiona con namespace existente; registry actualizado; help actualizado; tests o evidencia manual; rollback |
| Docs de comandos | `npm run docs:commands:write` cuando cambie help o registry; `npm run docs:commands:check` como gate obligatorio |
| Tests reemplazados | Mapeo explicito de cobertura anterior -> nueva cobertura equivalente antes de borrar o debilitar tests |
| JSON contract | Ejemplo JSON parseable; campos estables; `schema_version` cuando exista contrato de versionado |
| Write-capable command | `--dry-run` o sandbox; rutas generadas; side effects esperados; rollback; evidencia de no tocar rutas fuera de alcance |

Gate CLI/docs:

- Docs de comandos no pueden cerrarse si contradicen `--help`.
- Docs generadas deben indicar fuente y comando/generador usado.
- Validaciones pendientes se registran como pendientes, no como exitos.
- Todo cambio que altere el command surface debe actualizar `docs/reference/commands.md` con `npm run docs:commands:write`.
- Todo PR que altere comandos debe pasar `npm run docs:commands:check`.
- Todo PR que altere `CHANGELOG.md` o comandos relacionados con changelog debe pasar `npm run changelog:check`.

Gate minimo por PR de CLI:

| Gate | Cuando aplica | Evidencia esperada |
|---|---|---|
| Sintaxis | Siempre que cambie JS ejecutable o tests JS | `node --check <archivos afectados>` |
| Contrato CLI | Parser, registry, dispatch, help, comandos publicos | `node --test tests/commands/parser-contract.test.js tests/commands/cli-contract.test.js` o suite equivalente justificada |
| Docs generadas | Cambios en help, registry o comandos documentados | `npm run docs:commands:check` |
| Changelog | Cambios en changelog o wrapper de changelog | `npm run changelog:check` |
| Comando manual | Comando nuevo o comportamiento modificado | Ejecucion humana y `--json` si aplica, con exit code esperado |

Regla de cobertura equivalente:

- No borrar tests existentes sin listar que comportamiento cubrian.
- No reemplazar tests por snapshots mas amplios si se pierde verificacion de campos, exit codes o stderr.
- Si una cobertura vieja no puede mantenerse, registrar riesgo residual y aprobacion requerida.
- Tests nuevos no sustituyen evidencia manual cuando el cambio afecta UX humana, help o side effects.

Formato obligatorio de cierre:

- Cambios de comportamiento: que hacia antes, que hace ahora, por que mejora.
- Evidencia ejecutada: comando exacto y resultado.
- Evidencia pendiente: comando no ejecutado, motivo y riesgo.
- Riesgos residuales: impacto posible y rollback.
- Decision sobre ramas: conservar, cerrar o revisar, sin ejecutar limpieza automatica.

## Cambios de comportamiento

Ninguno. Solo contrato de evidencia.

## Regresiones detectadas

Ninguna.

## Riesgos residuales

- No se ejecutaron tests en este slice porque no hubo implementacion runtime.
- El contrato depende de que cada slice tecnico declare sus archivos afectados y no oculte cambios de comportamiento.
- Si aparece una suite nueva de comandos, debe mapearse contra esta matriz antes de reemplazar la existente.

## Decision sobre ramas

No cerrar ramas fuente hasta completar evidencia de extraccion o decision de descarte.
