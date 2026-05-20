# EXECUTION BRIEF - slice-02: Internal layout and template resolver

**Spec:** quiver-v21-ai-first-layout
**Slice:** slice-02-internal-layout-template-resolver
**Tipo:** feature

## Contexto

El layout nuevo separa maquinaria interna y contrato visible. Para lograrlo, Quiver no debe depender de `docs-template/` visible en proyectos nuevos.

## Objetivo

Agregar contrato `.quiver/` y resolucion de templates empaquetados con fallback legacy.

## Alcance

- `.quiver/state.json`
- `.quiver/config.json`
- `.quiver/.gitignore`
- `.quiver/templates/` solo bajo opt-in futuro.
- Template resolver empaquetado y fallback legacy.

## Criterios de aceptacion

- `.quiver/` contiene metadata versionable y runtime ignorado.
- `cache`, `runs` y `worktrees` quedan ignorados.
- Templates se resuelven sin `docs-template/` visible.
- `docs-template/` legacy sigue funcionando si existe.

## Plan tecnico resumido

Centralizar paths internos en un helper o extender `init-layout`. Agregar `template-resolver.js` para ubicar templates empaquetados, `.quiver/templates/` y legacy `docs-template/` en orden seguro.

## Pasos sugeridos de ejecucion

1. Definir helpers de paths `.quiver`.
2. Crear writer para `.quiver/.gitignore`.
3. Agregar `config.json` minimo.
4. Extraer resolucion de templates.
5. Actualizar usos internos.
6. Agregar tests de resolver y gitignore.

## Restricciones

- No eliminar soporte legacy.
- No copiar templates por default al root.
- No mover scans todavia.

## Riesgos

- Romper `new-handoff` o `migrate`.
- Resolver templates desde el proyecto equivocado.
- Versionar carpetas runtime por accidente.

## Checklist de finalizacion

- [ ] Tests de resolver pasan.
- [ ] `.quiver/.gitignore` cubre runtime.
- [ ] Fallback legacy testeado.
- [ ] No hay dependencia obligatoria de `docs-template/`.
