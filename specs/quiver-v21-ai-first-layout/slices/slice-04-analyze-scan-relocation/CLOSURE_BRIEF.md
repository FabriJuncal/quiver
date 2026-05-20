# CLOSURE BRIEF - slice-04: Analyze scan relocation

## Resumen de lo realizado

Se movio la salida cruda de `analyze` a `.quiver/scans/PROJECT_SCAN.json` y se mantuvo `docs/PROJECT_MAP.md` como artefacto visible para humanos y agentes. Se agrego un helper central para rutas de scan con lectura preferente del path nuevo y fallback legacy a `docs/PROJECT_SCAN.json`.

## Validacion contra criterios de aceptacion

- [x] Scan nuevo creado.
- [x] Project map visible creado.
- [x] Fallback legacy cubierto.
- [x] Preferencia nuevo sobre legacy testeada.

## Cambios relevantes

- `analyze` escribe el JSON crudo en `.quiver/scans/PROJECT_SCAN.json`.
- `docs/PROJECT_MAP.md` se sigue escribiendo y queda visible.
- `doctor` considera valido el scan nuevo o legacy mientras exista el project map.
- Los metadatos de context pack reportan el scan usado cuando reciben `repoRoot`.
- Smokes actualizados para validar el path nuevo.

## Pendientes

No quedan pendientes dentro de este slice. La alineacion textual de templates que todavia nombran `docs/PROJECT_SCAN.json` queda para `slice-07`.

## Riesgos remanentes

Durante la transicion pueden coexistir `.quiver/scans/PROJECT_SCAN.json` y `docs/PROJECT_SCAN.json`; el helper prefiere el path nuevo para evitar ambiguedad.

## Recomendaciones futuras

Actualizar las guias visibles para presentar `docs/PROJECT_MAP.md` como lectura principal y el JSON crudo como artefacto interno de herramientas.
