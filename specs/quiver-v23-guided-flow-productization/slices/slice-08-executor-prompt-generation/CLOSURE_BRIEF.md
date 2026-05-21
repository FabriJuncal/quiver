# CLOSURE BRIEF - slice-08: Executor prompt generation

## Resumen de lo realizado

Se agrego `npx create-quiver ai prompt-slice` como comando de salida manual para asignar un slice a un agente executor con contexto minimo. El prompt se arma desde `slice.json`, `EXECUTION_BRIEF.md`, `CLOSURE_BRIEF.md` y un extracto breve de `SPEC.md`, sin incluir el spec completo por defecto.

## Validacion contra criterios de aceptacion

- [x] Prompt minimo.
- [x] Sin SPEC completo por defecto.
- [x] Formato final incluido.
- [x] Tests pasan.

## Cambios relevantes

- Nuevo builder `buildManualExecutorPrompt` en `src/create-quiver/lib/ai/executor.js`.
- Nuevo subcomando `ai prompt-slice`, con alias `ai executor-prompt`.
- Nuevo script generado `quiver:ai:prompt-slice`.
- README, `README_FOR_AI.md`, templates y docs generadas actualizadas con el flujo manual.
- Tests de CLI y libreria para contexto minimo, path del slice y faltantes de briefs.

## Pendientes

Sin pendientes del slice.

## Riesgos remanentes

El prompt manual no ejecuta ni valida al proveedor; la calidad final sigue dependiendo del agente executor elegido por el usuario.

## Recomendaciones futuras

En `slice-09`, reutilizar este prompt como base de contexto para ejecucion delegada y mantener la salida manual como fallback de bajo riesgo.
