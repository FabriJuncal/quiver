# Implementar Quiver en un proyecto existente y generar spec/slices con IA

Esta guia aplica cuando ya tenes un proyecto avanzado con codigo real,
pero todavia no tiene Quiver inicializado.

Objetivo del flujo:

- agregar el contrato de trabajo de Quiver sin convertirlo en una migracion legacy;
- analizar el proyecto existente con IA;
- generar contexto operativo para futuros agentes;
- convertir requerimientos nuevos en criterios de aceptacion, plan tecnico y spec/slices;
- mantener revision humana antes de escribir cambios importantes.

Ejecuta todos los comandos desde la raiz del proyecto.

## 1. Crear una rama de integracion

```bash
git switch -c chore/init-quiver
```

Que hace:

- crea una rama separada para incorporar Quiver;
- evita mezclar la inicializacion documental con trabajo funcional del producto;
- deja el cambio listo para revisar en un PR o commit separado.

Que esperar:

- Git cambia a la nueva rama;
- no se modifica ningun archivo por este comando;
- cualquier archivo que cree Quiver despues quedara aislado en esta rama.

## 2. Inicializar Quiver en modo minimo

```bash
npx --yes create-quiver@latest --lang es init --name "Nombre del Proyecto" --minimal
```

Que hace:

- descarga y ejecuta la ultima version publicada de `create-quiver`;
- inicializa el contrato minimo de Quiver en el proyecto actual;
- configura la documentacion base para que agentes de IA entiendan como trabajar;
- usa idioma espanol para los documentos generados por Quiver;
- usa el nombre indicado como identidad del proyecto dentro de la documentacion;
- evita crear una estructura amplia o legacy gracias a `--minimal`.

Por que usar `init` y no `migrate`:

- `init` es para proyectos que todavia no tienen Quiver;
- `migrate` es para proyectos que ya tenian una version anterior de Quiver;
- usar `migrate` en un proyecto sin Quiver puede producir un flujo incorrecto.

Archivos que puede crear o actualizar:

- `AGENTS.md`;
- `docs/`;
- `.quiver/`;
- `.gitignore`;
- `package.json`;
- `package-lock.json`.

Que no deberia hacer:

- no deberia modificar codigo de producto;
- no deberia tocar rutas de negocio, pantallas, APIs o base de datos;
- no deberia generar una spec funcional todavia.

## 3. Configurar perfiles de IA

```bash
npx --yes create-quiver@latest ai agent set planner --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai agent set reviewer --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai agent set executor --provider codex --model gpt-5.5
```

Que hace:

- crea perfiles reutilizables para los roles de IA;
- define que proveedor usara cada rol;
- define el modelo por defecto para planificacion, revision y ejecucion;
- guarda configuracion operativa, no credenciales.

Rol `planner`:

- transforma requerimientos en criterios de aceptacion;
- genera planes tecnicos;
- estructura specs y slices.

Rol `reviewer`:

- revisa el plan tecnico con criterio de produccion;
- detecta ambiguedades, riesgos, edge cases y criterios incompletos;
- recomienda aprobar, aprobar con riesgo o pedir revision.

Rol `executor`:

- queda preparado para ejecutar slices en etapas posteriores;
- no implementa nada en este flujo inicial salvo que se lo pidas explicitamente.

Archivos que puede crear o actualizar:

- `.quiver/agents/profiles.json`.

## 4. Analizar el proyecto existente con IA

```bash
npx --yes create-quiver@latest ai analyze-project \
  --deep \
  --review \
  --provider codex \
  --model gpt-5.5
```

Que hace:

- analiza el proyecto desde codigo fuente, documentacion y configuracion;
- detecta stack, rutas fuente, entrypoints, scripts y archivos de configuracion;
- selecciona archivos relevantes sin depender de un framework especifico;
- evita leer secretos, dependencias, caches y outputs generados;
- infiere dominio funcional, entidades, roles, acciones principales y flujos;
- infiere arquitectura tecnica: frontend, backend, auth, persistencia,
  integraciones, data layer, testing y riesgos visibles;
- genera una propuesta revisable antes de escribir documentacion.

Que significa `--deep`:

- habilita analisis profundo del proyecto;
- intenta construir una vision representativa del sistema;
- no se limita a archivos superficiales como `README.md` o `package.json`.

Que significa `--review`:

- abre una instancia de revision humana antes de escribir cambios;
- permite aprobar, editar o cancelar la propuesta;
- si cancelas, el repo queda intacto respecto a esa escritura.

Que deberia producir si lo aprobas:

- contexto enriquecido del producto;
- propuesta de actualizacion de documentacion;
- evidencia para cada conclusion importante;
- dudas marcadas como `unknown` o `needs_confirmation` cuando no haya
  evidencia suficiente.

Archivos objetivo habituales:

- `docs/CONTEXTO.md`;
- `docs/AI_CONTEXT.md`;
- `docs/ARCHITECTURE.md`;
- `docs/PROJECT_MAP.md`;
- `docs/STATUS.md`;
- `docs/DECISIONS.md`.

Que no deberia hacer:

- no deberia modificar codigo de producto;
- no deberia leer `.env`;
- no deberia enviar dependencias o binarios grandes al proveedor;
- no deberia afirmar conclusiones importantes sin evidencia.

## 5. Preparar contexto operativo para IA

```bash
npx --yes create-quiver@latest ai prepare-context \
  --with-planner \
  --review \
  --interactive \
  --provider codex \
  --model gpt-5.5
```

Que hace:

- genera contexto documental optimizado para futuros agentes;
- usa el planner para proponer mejoras de contexto;
- mantiene foco docs-only;
- permite revision humana antes de escribir;
- registra supuestos, riesgos, contradicciones y rutas omitidas.

Que significa `--with-planner`:

- le pide al planner que proponga el contexto;
- no se limita a plantillas estaticas;
- puede adaptar la documentacion al producto real.

Que significa `--interactive`:

- habilita prompts humanos durante el flujo;
- permite confirmar acciones antes de persistir cambios;
- es recomendable cuando estas inicializando Quiver por primera vez.

Que deberia mejorar:

- `docs/AI_CONTEXT.md`;
- `docs/CONTEXTO.md`;
- `docs/PROJECT_MAP.md`;
- secciones de supuestos, riesgos, decisiones y siguientes pasos.

Que no deberia hacer:

- no deberia implementar features;
- no deberia cambiar codigo fuente;
- no deberia sobreescribir decisiones humanas sin revision.

## 6. Ejecutar onboarding IA del proyecto

```bash
npx --yes create-quiver@latest ai onboard --provider codex --model gpt-5.5
```

Que hace:

- ejecuta el prompt de onboarding para que la IA lea el contexto preparado;
- ayuda a que el agente entienda producto, arquitectura, reglas y flujo de trabajo;
- prepara la conversacion para futuros requerimientos.

Para que sirve:

- reduce explicaciones repetidas en cada tarea;
- hace que el agente arranque con el mapa del proyecto;
- mejora la calidad de specs, slices y planes tecnicos futuros.

Que deberias obtener:

- una respuesta de onboarding del proveedor;
- resumen del contexto entendido;
- posibles preguntas o riesgos si el contexto todavia esta incompleto.

## 7. Guardar la base Quiver

```bash
git add AGENTS.md docs .quiver .gitignore package.json package-lock.json
git commit -m "docs: initialize quiver workflow"
```

Que hace:

- versiona la inicializacion de Quiver;
- deja una base estable antes de crear specs funcionales;
- separa el setup documental del trabajo de producto.

Por que conviene hacerlo antes de seguir:

- el contexto inicial queda revisable;
- cualquier spec futura parte desde una base clara;
- si algo sale mal despues, podes volver a este punto.

Que deberia incluir el commit:

- documentacion base;
- estado interno de Quiver;
- perfiles de agentes;
- cambios necesarios en `package.json` y lockfile.

Que no deberia incluir:

- cambios funcionales no relacionados;
- archivos temporales;
- secretos;
- outputs de build;
- caches.

## 8. Crear el archivo del requerimiento

```bash
mkdir -p requirements
```

Luego crea este archivo:

```text
requirements/feature-001.md
```

Que poner adentro:

```markdown
# Feature 001

Describe aca el requerimiento funcional.

Inclui:

- problema a resolver;
- usuarios afectados;
- comportamiento esperado;
- restricciones conocidas;
- ejemplos si existen;
- dudas o decisiones pendientes.
```

Que hace este paso:

- convierte el requerimiento en un artefacto durable;
- evita depender solo del historial del chat;
- permite que Quiver use siempre la misma entrada para planner, reviewer y spec.

## 9. Crear una ejecucion de IA para el requerimiento

```bash
npx --yes create-quiver@latest ai run create --input requirements/feature-001.md
```

Que hace:

- crea una ejecucion persistente en `.quiver/runs/`;
- asocia el requerimiento con el flujo de IA;
- permite que las fases siguientes compartan estado;
- prepara el camino para criterios, plan tecnico, review y spec.

Que deberia quedar registrado:

- archivo de entrada usado;
- metadata de la ejecucion;
- estado inicial de la corrida.

## 10. Generar criterios de aceptacion

```bash
npx --yes create-quiver@latest ai plan \
  --phase acceptance \
  --input requirements/feature-001.md \
  --review \
  --interactive \
  --provider codex \
  --model gpt-5.5
```

Que hace:

- transforma el requerimiento en criterios de aceptacion verificables;
- fuerza una primera compuerta funcional antes del plan tecnico;
- permite revisar y editar el borrador antes de guardarlo.

Que deberian cubrir los criterios:

- comportamiento esperado;
- casos principales;
- edge cases;
- restricciones;
- errores esperados;
- condiciones de no regresion;
- definicion clara de terminado.

Despues de revisar el borrador, aprobar:

```bash
npx --yes create-quiver@latest ai approve --phase acceptance
```

Que hace la aprobacion:

- marca una version de criterios como aceptada;
- habilita la generacion del plan tecnico;
- evita que el plan tecnico se base en un borrador no aprobado.

## 11. Generar plan tecnico

```bash
npx --yes create-quiver@latest ai plan \
  --phase technical-plan \
  --review \
  --interactive \
  --provider codex \
  --model gpt-5.5
```

Que hace:

- convierte los criterios aprobados en un plan tecnico;
- propone slices de implementacion;
- identifica dependencias entre slices;
- define entregables, riesgos y validaciones;
- prepara la estructura que luego consumira `spec create`.

Que deberia incluir el plan:

- alcance tecnico;
- archivos o modulos probables;
- orden de ejecucion;
- slices secuenciales y paralelizables;
- estrategia de pruebas;
- riesgos;
- rollback;
- criterios de cierre.

Que no deberia hacer:

- no deberia escribir la spec todavia;
- no deberia implementar codigo;
- no deberia saltarse la revision humana.

## 12. Revisar el plan tecnico con mentalidad de produccion

```bash
npx --yes create-quiver@latest ai review-plan --provider codex --model gpt-5.5
```

Que hace:

- revisa el plan como si fuera a implementarse en produccion;
- busca supuestos fragiles;
- detecta ambiguedades;
- identifica edge cases;
- marca riesgos tecnicos y funcionales;
- puede recomendar aprobar, aprobar con riesgo o revisar.

Cuando el plan este aceptable, aprobar:

```bash
npx --yes create-quiver@latest ai approve --phase technical-plan
```

Que hace la aprobacion:

- marca el plan tecnico como fuente aprobada;
- habilita la generacion del paquete de spec/slices;
- evita crear specs desde planes no revisados.

## 13. Crear spec y slices

```bash
npx --yes create-quiver@latest spec create --review --interactive
```

Que hace:

- genera el paquete formal de especificacion;
- crea `SPEC.md`;
- crea `EXECUTION_PLAN.md`;
- crea slices con `slice.json`;
- crea `EXECUTION_BRIEF.md` para cada slice;
- crea `CLOSURE_BRIEF.md` para cada slice;
- prepara el cuerpo de PR cuando corresponde;
- permite revisar antes de escribir.

Que significa `--review`:

- muestra el paquete que se va a generar;
- permite inspeccionar paths, contenido y estructura antes de persistir.

Que significa `--interactive`:

- pide confirmacion humana;
- evita escrituras sorpresivas.

Resultado esperado:

```text
specs/<spec-slug>/SPEC.md
specs/<spec-slug>/EXECUTION_PLAN.md
specs/<spec-slug>/pr.md
specs/<spec-slug>/slices/<slice-slug>/slice.json
specs/<spec-slug>/slices/<slice-slug>/EXECUTION_BRIEF.md
specs/<spec-slug>/slices/<slice-slug>/CLOSURE_BRIEF.md
```

## 14. Empezar a trabajar sobre la spec

```bash
npx --yes create-quiver@latest spec start specs/<spec-slug>
```

Que hace:

- prepara la rama o worktree de la spec;
- aisla el trabajo de implementacion;
- deja el proyecto listo para ejecutar slices.

Luego, para ver el orden de ejecucion:

```bash
npx --yes create-quiver@latest plan --spec <spec-slug>
```

Que hace:

- muestra los slices en orden;
- indica dependencias;
- ayuda a decidir que se ejecuta primero.

Para listar slices listos:

```bash
npx --yes create-quiver@latest next --all-ready --spec <spec-slug>
```

Que hace:

- muestra los slices que no tienen bloqueos pendientes;
- permite elegir el siguiente slice sin revisar manualmente todo el arbol.

## Flujo resumido

```bash
git switch -c chore/init-quiver
npx --yes create-quiver@latest --lang es init --name "Nombre del Proyecto" --minimal
npx --yes create-quiver@latest ai agent set planner --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai agent set reviewer --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai agent set executor --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai analyze-project \
  --deep \
  --review \
  --provider codex \
  --model gpt-5.5
npx --yes create-quiver@latest ai prepare-context \
  --with-planner \
  --review \
  --interactive \
  --provider codex \
  --model gpt-5.5
npx --yes create-quiver@latest ai onboard --provider codex --model gpt-5.5
git add AGENTS.md docs .quiver .gitignore package.json package-lock.json
git commit -m "docs: initialize quiver workflow"
mkdir -p requirements
npx --yes create-quiver@latest ai run create --input requirements/feature-001.md
npx --yes create-quiver@latest ai plan \
  --phase acceptance \
  --input requirements/feature-001.md \
  --review \
  --interactive \
  --provider codex \
  --model gpt-5.5
npx --yes create-quiver@latest ai approve --phase acceptance
npx --yes create-quiver@latest ai plan \
  --phase technical-plan \
  --review \
  --interactive \
  --provider codex \
  --model gpt-5.5
npx --yes create-quiver@latest ai review-plan --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai approve --phase technical-plan
npx --yes create-quiver@latest spec create --review --interactive
npx --yes create-quiver@latest spec start specs/<spec-slug>
npx --yes create-quiver@latest plan --spec <spec-slug>
npx --yes create-quiver@latest next --all-ready --spec <spec-slug>
```

## Notas importantes

- Reemplaza `"Nombre del Proyecto"` por el nombre real.
- Reemplaza `requirements/feature-001.md` por el archivo de requerimiento real.
- Reemplaza `<spec-slug>` por el slug generado por `spec create`.
- Usa `--provider codex --model gpt-5.5` si tu entorno tiene Codex
  disponible con ese modelo.
- Si el proveedor o modelo cambia, actualiza los comandos de perfiles y de
  ejecucion IA.
- No uses este flujo para proyectos que ya tienen Quiver viejo; en ese caso
  corresponde `migrate`.
- No incluyas `.env`, secretos, dumps, builds o caches en los commits.
