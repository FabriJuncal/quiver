# CLOSURE BRIEF - slice-01: Init profiles and dry-run planner

## Resumen de lo realizado

Se agrego el comando explicito `init`, flags de perfil para inicializacion, un planner puro de layout y el flujo `init --dry-run` sin escrituras. El comando historico `npx create-quiver --name` sigue funcionando como alias compatible.

## Validacion contra criterios de aceptacion

- [x] `init --dry-run` no escribe archivos.
- [x] Alias `--name` preservado.
- [x] Flags invalidos fallan antes de escribir.
- [x] Planner testeado como funcion pura.

## Cambios relevantes

- `src/create-quiver/lib/init-layout.js` agrega planning puro y formatter de dry-run.
- `src/create-quiver/index.js` parsea `init`, `--minimal`, `--full`, `--legacy-scripts`, `--include-templates` y conecta `--dry-run`.
- Tests nuevos cubren planner, perfiles, alias compatible y que init real conserva el layout historico en este slice.

## Pendientes

- `slice-02` debe mover la infraestructura interna y template resolver real.
- `slice-03` debe cambiar la escritura efectiva por perfiles.

## Riesgos remanentes

- En esta slice los perfiles solo impactan el plan dry-run; la escritura real sigue usando el layout historico por diseno del corte.

## Recomendaciones futuras

- Usar `init-layout.js` como contrato unico para los slices siguientes y evitar duplicar listas de archivos.
