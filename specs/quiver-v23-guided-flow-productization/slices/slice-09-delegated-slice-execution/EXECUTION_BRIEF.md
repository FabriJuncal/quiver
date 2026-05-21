# EXECUTION BRIEF - slice-09: Delegated slice execution

## Objetivo

Permitir ejecucion delegada de slices con seguridad de scopes, workspaces y commits.

## Alcance

- Modo manual y delegado.
- Uso de perfil executor.
- Workspaces seguros para paralelismo.
- Un commit por slice.
- Reportes de fallo recuperables.

## Criterios de aceptacion

- Dry-run muestra olas.
- Ejecucion real requiere flags explicitos.
- Paralelo solo con scopes seguros.
- Falla sin ocultar cambios.
- Tests pasan.

## Restricciones

- No mergear PR.
- No instalar proveedores.
- No correr providers reales en CI.

## Checklist de finalizacion

- [x] Dry-run validado.
- [x] Ejecucion con mocks validada.
- [x] Fallos recuperables.
- [x] Tests pasan.
