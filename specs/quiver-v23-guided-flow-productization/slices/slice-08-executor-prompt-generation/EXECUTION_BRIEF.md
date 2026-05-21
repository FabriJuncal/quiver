# EXECUTION BRIEF - slice-08: Executor prompt generation

## Objetivo

Generar prompts minimos para agentes ejecutores a partir de artefactos de un slice.

## Alcance

- Leer `slice.json`, `EXECUTION_BRIEF.md`, `CLOSURE_BRIEF.md`.
- Incluir contexto minimo y restricciones.
- Imprimir prompt listo para pegar.

## Criterios de aceptacion

- No incluye el SPEC completo por defecto.
- Incluye archivos permitidos, criterios y validaciones.
- Tiene formato de reporte final.
- Tests pasan.

## Restricciones

- No ejecutar provider.
- No ejecutar el prompt generado contra proveedores dentro de este slice.
- Mantener la implementacion dentro de los archivos declarados en `slice.json`.

## Checklist de finalizacion

- [x] Prompt generado.
- [x] Contexto minimizado.
- [x] Tests pasan.
