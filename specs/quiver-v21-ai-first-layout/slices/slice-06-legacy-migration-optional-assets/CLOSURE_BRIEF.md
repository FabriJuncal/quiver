# CLOSURE BRIEF - slice-06: Legacy migration and optional assets

## Resumen de lo realizado

Se implemento la transicion no destructiva para migracion y se habilitaron los assets opcionales explicitos.

## Validacion contra criterios de aceptacion

- [x] Migracion no destructiva.
- [x] Legacy scripts opcionales.
- [x] Templates exportados bajo `.quiver/`.
- [x] Full mode validado.

## Cambios relevantes

- `migrate` ahora reporta layout legado detectado y preservado, incluyendo `docs-template/`, `tools/scripts/` y `docs/PROJECT_SCAN.json`.
- `init --legacy-scripts` crea wrappers Bash y scripts npm compatibles.
- `init --include-templates` exporta templates a `.quiver/templates/`.
- `init --full` sigue habilitando el layout amplio de compatibilidad.

## Pendientes

Ninguno para este slice.

## Riesgos remanentes

- La salida de migracion sigue siendo conservadora: detecta y reporta, pero no limpia automaticamente el layout viejo.

## Recomendaciones futuras

- Mantener las smokes de migracion y perfiles opcionales en slices posteriores para evitar regresiones.
