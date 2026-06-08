# 06-slice - Extraccion de comandos y wrappers

## 1. Nombre del slice

Extraccion de comandos y wrappers.

## 2. Objetivo del slice

Planificar extracciones futuras de comandos/wrappers sin perder comportamiento existente.

## 3. Problema puntual que resuelve

Evita incorporar wrappers desde ramas viejas sin explicar que comando cambian y por que mejora.

## 4. Valor observable que entrega

Plan por comando con matriz antes/despues, archivos candidatos, exclusiones y validaciones.

## 5. Alcance especifico

Planificacion de comandos como `status`, `changelog`, `doctor`, `handoff`, `slice`, `init` y otros candidatos.

## 6. Que incluye

- Lista de comandos candidatos.
- Estado actual de cada comando.
- Cambio propuesto.
- Motivo y mejora verificable.
- Validacion por comando.
- Rollback por comando.

## 7. Que no incluye

- Implementar comandos.
- Eliminar aliases.
- Cambiar parser global sin `05-slice`.
- Modificar package/version.

## 8. Actores involucrados

Tech Lead, usuarios CLI, reviewer e implementador futuro.

## 9. Precondiciones

Baseline, contrato y matriz de extraccion aprobados.

## 10. Entradas necesarias

Matriz de extraccion, baseline de comandos y diffs de ramas fuente.

## 11. Flujo operativo paso a paso

1. Seleccionar un comando candidato.
2. Registrar comportamiento actual.
3. Describir cambio propuesto y mejora.
4. Definir archivos candidatos y excluidos.
5. Definir validaciones.
6. Definir rollback.
7. Repetir por comando sin mezclar responsabilidades.

## 12. Salidas esperadas

Backlog de comandos con planes implementables independientes.

## 13. Reglas de negocio aplicables

- Un comando no puede cambiar sin antes/despues.
- Mejoras deben ser verificables.
- Si cambia JSON, exit code o side effect, requiere aprobacion explicita.
- No se eliminan aliases ni flags sin aprobacion.

## 14. Validaciones

- Cada comando tiene matriz completa.
- Cada cambio tiene motivo y mejora.
- Cada comando tiene rollback.
- No hay scope creep entre comandos.

## 15. Manejo de errores o edge cases

- Si el comando no existe hoy, documentar como nuevo y validar que no colisiona.
- Si ya existe con otro comportamiento, requerir compatibilidad o aprobacion.
- Si depende de parser, bloquear hasta `05-slice`.

## 16. Criterios de aceptacion

- Cada comando candidato tiene plan individual.
- Ningun comportamiento existente desaparece sin aprobacion.
- Cambios de salida estan justificados y validados.
- Package/version fuera del alcance.
- Rollback por comando definido.

## 17. Dependencias tecnicas, funcionales o externas

Baseline y matriz de extraccion.

## 18. Depende de slices

`04-slice`; puede depender de `05-slice` si el comando requiere parser nuevo.

## 19. Riesgos / decisiones abiertas

Algunos wrappers pueden duplicar comandos existentes o cambiar UX.

## 20. Pendientes / preguntas abiertas

Definir orden exacto de comandos segun valor y riesgo.
