# EXECUTION BRIEF - slice-03: Generation profiles and visible contract

**Spec:** quiver-v21-ai-first-layout
**Slice:** slice-03-generation-profiles-visible-contract
**Tipo:** feature

## Contexto

El valor visible del cambio aparece cuando el init default deja de generar archivos que parecen ruido para onboarding.

## Objetivo

Implementar la escritura real de los perfiles default, minimal y full.

## Alcance

- Init writer.
- Perfiles de archivos visibles.
- Package scripts generados por perfil.
- Smokes iniciales por perfil.

## Criterios de aceptacion

- Default no crea `docs-template/`, `tools/scripts/` ni spec placeholder.
- Minimal crea solo el contrato esencial.
- Full conserva salida amplia de compatibilidad.
- Scripts npm no apuntan a archivos ausentes.
- Archivos existentes no se sobrescriben.

## Plan tecnico resumido

Usar el layout planner para ejecutar operaciones por perfil. Separar sets de archivos en esenciales, full, legacy y templates. Mantener `--full` como escape hatch del comportamiento amplio.

## Pasos sugeridos de ejecucion

1. Definir file sets por perfil.
2. Conectar writer a operaciones planeadas.
3. Ajustar merge de package scripts por perfil.
4. Evitar spec placeholder en default/minimal.
5. Agregar smokes de default, minimal y full.
6. Actualizar evidence/status del slice.

## Restricciones

- No mover analyze scan output.
- No eliminar compatibilidad full.
- No generar scripts que dependan de `tools/scripts/` sin `--legacy-scripts`.

## Riesgos

- Reducir demasiado el default y dejar docs necesarias afuera.
- Romper proyectos que esperaban spec placeholder.
- Mantener tests viejos que asumen layout anterior.

## Checklist de finalizacion

- [ ] Default smoke actualizado.
- [ ] Minimal smoke agregado.
- [ ] Full smoke agregado.
- [ ] Scripts por perfil validados.
- [ ] No hay overwrite accidental.
