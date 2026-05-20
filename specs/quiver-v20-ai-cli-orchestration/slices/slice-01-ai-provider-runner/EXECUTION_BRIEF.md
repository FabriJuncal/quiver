# EXECUTION BRIEF - slice-01: AI provider runner

**Spec:** quiver-v20-ai-cli-orchestration
**Slice:** slice-01-ai-provider-runner
**Tipo:** feature

## Contexto

Quiver necesita ejecutar prompts mediante CLIs locales de IA sin depender de comandos shell fragiles. Esta slice crea la base reutilizable para Codex, Claude y Gemini.

## Objetivo

Implementar un provider runner mockeable, cross-platform y seguro para prompts largos.

## Alcance

- Agregar providers `codex`, `claude`, `gemini`.
- Validar CLI instalado.
- Soportar `--dry-run`.
- Transportar prompts largos por stdin o archivo temporal segun adapter.
- Devolver resultados estructurados.

## Criterios de aceptacion

- Proveedor no soportado falla con lista de proveedores validos.
- Dry-run no ejecuta procesos.
- No se concatenan strings shell para ejecutar providers.
- Los tests no requieren CLIs reales.
- Paths con espacios estan cubiertos.

## Plan tecnico resumido

Crear modulos `providers.js`, `prompt-transport.js` y `preflight.js` bajo `src/create-quiver/lib/ai/`. Usar `spawn`/`execFile` con arrays de argumentos. Permitir inyeccion de runner falso para tests.

## Pasos sugeridos de ejecucion

1. Crear `src/create-quiver/lib/ai/`.
2. Implementar registry de providers.
3. Implementar transporte seguro de prompt.
4. Implementar preflight de CLI.
5. Agregar tests unitarios.
6. Validar sintaxis y diff.

## Restricciones

- No agregar comandos publicos `quiver ai` todavia.
- No invocar providers reales en tests.
- No requerir auth real de Codex/Claude/Gemini.

## Riesgos

- Diferencias entre CLIs reales.
- Quoting roto en Windows si se usa shell implicito.
- Prompts largos que exceden limites de argumentos.

## Checklist de finalizacion

- [ ] Tests unitarios pasan.
- [ ] Dry-run cubierto.
- [ ] Unsupported provider cubierto.
- [ ] Missing CLI cubierto.
- [ ] No hay shell concatenation.

