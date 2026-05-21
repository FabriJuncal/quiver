# EXECUTION BRIEF - slice-02: Prepare command and setup diagnostics

**Spec:** quiver-v22-guided-ai-workflow
**Slice:** slice-02-prepare-command-diagnostics
**Tipo:** feature

## Contexto

El usuario necesita un primer comando seguro que le diga si el proyecto esta listo para trabajar con IA.

## Objetivo

Agregar un comando de preparacion guiada con diagnosticos claros y modo dry-run.

## Alcance

- Registrar el comando en el CLI.
- Agregar `prepare`.
- Reutilizar checks existentes de doctor, provider preflight y GitHub preflight donde convenga.
- Reportar herramientas faltantes y proximos pasos.

## Criterios de aceptacion

- `prepare --dry-run` no escribe archivos.
- `prepare` informa checks ejecutados y proximos pasos.
- Faltantes de `gh`, auth, provider CLI o SSH se explican con guia para macOS, Linux y Windows.
- No se instalan herramientas ni se modifica SSH sin autorizacion explicita.

## Plan tecnico resumido

Crear un comando fino que orqueste checks existentes y produzca un reporte humano. Mantener escritura deshabilitada en dry-run y evitar automatizaciones destructivas.

## Pasos sugeridos de ejecucion

1. Revisar parser de `src/create-quiver/index.js`.
2. Crear `commands/prepare.js`.
3. Componer checks existentes.
4. Agregar salida clara para success/warn/fail.
5. Cubrir dry-run y faltantes con tests.

## Restricciones

- No refrescar todavia docs de contexto profundas.
- No crear specs.
- No crear commits.

## Riesgos

- Duplicar logica de doctor.
- Hacer que prepare parezca que instala herramientas cuando solo guia.

## Checklist de finalizacion

- [ ] Comando registrado.
- [ ] Dry-run cubierto.
- [ ] Guia cross-platform cubierta.
- [ ] Tests pasan.
