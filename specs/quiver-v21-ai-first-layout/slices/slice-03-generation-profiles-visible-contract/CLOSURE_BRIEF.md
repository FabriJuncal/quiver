# CLOSURE BRIEF - slice-03: Generation profiles and visible contract

## Resumen de lo realizado

Se implemento la escritura real por perfiles de init. El perfil default genera un contrato AI-first visible sin `docs-template/`, sin `tools/scripts/` y sin spec placeholder; `--minimal` reduce la salida al contrato esencial de onboarding; `--full` conserva el layout amplio de compatibilidad.

## Validacion contra criterios de aceptacion

- [x] Default limpio.
- [x] Minimal esencial.
- [x] Full compatible.
- [x] Scripts validos por perfil.
- [x] Archivos existentes preservados.

## Cambios relevantes

- `initializeProjectDocs()` ahora recibe `profile`, `legacyScripts` e `includeTemplates`.
- Default y minimal ya no copian templates visibles, scripts Bash legacy ni specs placeholder.
- `--full` mantiene docs amplios, scripts legacy, spec template y `docs-template/`.
- Los scripts de `package.json` se generan segun perfil para evitar comandos que apunten a archivos ausentes.
- Los archivos existentes se preservan por defecto.
- Smokes de init cubren default, minimal y full.

## Pendientes

No quedan pendientes dentro de este slice. La adaptacion de comandos para repos sin specs corresponde a `slice-05`.

## Riesgos remanentes

`smoke-create-quiver.sh` conserva escenarios historicos bajo `--full`; los escenarios default sin specs se cierran completamente en `slice-05` y `slice-08`.

## Recomendaciones futuras

Mantener cualquier asset adicional detras de flags explicitos para que el default siga siendo pequeno y legible.
