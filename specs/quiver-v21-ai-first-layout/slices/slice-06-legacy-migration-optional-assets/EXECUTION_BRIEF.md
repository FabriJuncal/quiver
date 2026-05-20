# EXECUTION BRIEF - slice-06: Legacy migration and optional assets

**Spec:** quiver-v21-ai-first-layout
**Slice:** slice-06-legacy-migration-optional-assets
**Tipo:** feature

## Contexto

Cambiar el default no alcanza: proyectos existentes pueden tener layout viejo y algunos usuarios siguen necesitando scripts o templates visibles.

## Objetivo

Agregar transicion no destructiva y flags explicitos para assets opcionales.

## Alcance

- `migrate` legacy detection.
- `--legacy-scripts`.
- `--include-templates`.
- `--full` broad optional assets.
- Smokes de migracion y perfiles opcionales.

## Criterios de aceptacion

- `migrate` no borra ni mueve archivos legacy.
- Layout legacy se detecta y reporta.
- `--legacy-scripts` crea wrappers y scripts validos.
- `--include-templates` exporta a `.quiver/templates/`.
- `--full` mantiene assets amplios de forma explicita.

## Plan tecnico resumido

Extender perfiles y migracion para distinguir cleanup sugerido de acciones destructivas. Mantener compatibilidad por lectura y generar opcionales solo cuando el usuario lo pide.

## Pasos sugeridos de ejecucion

1. Agregar deteccion legacy en migrate.
2. Implementar generacion legacy scripts bajo flag.
3. Implementar export de templates bajo `.quiver/templates/`.
4. Definir set full.
5. Actualizar package scripts segun flags.
6. Agregar smokes de migracion.

## Restricciones

- No borrar archivos legacy.
- No crear root `docs-template/` en layout nuevo.
- No mezclar scripts legacy en default.

## Riesgos

- Flags combinados generen scripts inconsistentes.
- Migracion demasiado silenciosa.
- Full mode arrastre demasiada deuda sin documentar.

## Checklist de finalizacion

- [ ] Migrate preserva legacy.
- [ ] Legacy scripts validos.
- [ ] Include templates validado.
- [ ] Full mode validado.
- [ ] Recomendaciones de migracion claras.
