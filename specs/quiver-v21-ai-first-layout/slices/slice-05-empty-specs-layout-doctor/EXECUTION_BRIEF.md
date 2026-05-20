# EXECUTION BRIEF - slice-05: Empty specs and layout doctor

**Spec:** quiver-v21-ai-first-layout
**Slice:** slice-05-empty-specs-layout-doctor
**Tipo:** feature

## Contexto

Default init ya no debe crear specs falsas. Por eso los comandos que recorren slices deben aceptar que todavia no haya specs.

## Objetivo

Hacer que comandos de planificacion y doctor soporten layout nuevo, legacy e hibrido sin falsos errores.

## Alcance

- `plan`
- `graph`
- `next`
- `doctor`
- Deteccion de layout.
- Tests de no-spec repos.

## Criterios de aceptacion

- `plan`, `graph`, `next` y `doctor` no fallan por ausencia de specs.
- Doctor detecta layout nuevo, legacy, hibrido e incompleto.
- Doctor reporta recomendaciones accionables.
- Proyectos con specs existentes siguen funcionando.

## Plan tecnico resumido

Separar "no specs yet" de errores reales. Agregar detector de layout en doctor y actualizar formatters para comunicar estados vacios.

## Pasos sugeridos de ejecucion

1. Agregar fixtures sin specs.
2. Ajustar colectores de slices para estado vacio.
3. Ajustar salidas human/json.
4. Agregar detector de layout.
5. Agregar tests de legacy/hibrido.

## Restricciones

- No migrar archivos.
- No ocultar errores reales de JSON invalido.
- No cambiar formato JSON existente salvo campos compatibles.

## Riesgos

- Convertir errores reales en estados vacios.
- Romper automatizaciones que esperan exit code no cero.
- Mensajes ambiguos para usuarios nuevos.

## Checklist de finalizacion

- [ ] No-spec tests pasan.
- [ ] Layout doctor testeado.
- [ ] Proyectos con specs siguen pasando.
- [ ] Salidas JSON siguen parseables.
