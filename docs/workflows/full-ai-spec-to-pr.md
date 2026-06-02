# Flujo completo de IA: de requerimiento a PR

Esta guía cubre el flujo completo de Quiver desde un requerimiento hasta un pull request abierto.

Ejecutá los comandos desde la raíz del proyecto.

## 1. Confirmar estado del proyecto

```bash
git status -sb
npx --yes create-quiver@latest flow
npx --yes create-quiver@latest doctor
```

Qué hace:

- revisa el estado local de Git;
- le pide a Quiver el próximo paso seguro;
- valida el contrato del proyecto.

## 2. Crear un archivo de requerimiento

```bash
mkdir -p requirements
$EDITOR requirements/mi-requerimiento.md
```

Qué hace:

- crea una entrada durable para el planner;
- evita perder el requerimiento en el historial del chat.

## 3. Crear una ejecución de IA

```bash
npx --yes create-quiver@latest ai run create --input requirements/mi-requerimiento.md
npx --yes create-quiver@latest ai status
```

Qué hace:

- crea estado persistente en `.quiver/runs/`;
- muestra la fase actual y el próximo comando seguro.

## 4. Generar criterios de aceptación

```bash
npx --yes create-quiver@latest ai plan --phase acceptance --input requirements/mi-requerimiento.md --dry-run
npx --yes create-quiver@latest ai plan --phase acceptance --input requirements/mi-requerimiento.md
```

Si querés revisar y confirmar el borrador antes de guardarlo:

```bash
npx --yes create-quiver@latest ai plan --phase acceptance --input requirements/mi-requerimiento.md --review --interactive
```

Qué hace:

- previsualiza la invocación al proveedor;
- le pide al planner un borrador de criterios de aceptación.

Revisar borradores:

```bash
npx --yes create-quiver@latest ai approvals
```

Aprobar una versión:

```bash
npx --yes create-quiver@latest ai approve --phase acceptance --version <n>
```

Qué hace:

- guarda los criterios aprobados como entrada para el plan técnico.

## 5. Iterar criterios cuando haga falta

```bash
npx --yes create-quiver@latest ai revise --phase acceptance --input feedback.md --dry-run
npx --yes create-quiver@latest ai revise --phase acceptance --input feedback.md
```

Qué hace:

- crea un nuevo borrador sin aprobarlo automáticamente;
- mantiene explícita la compuerta de aprobación humana.

## 6. Generar el plan técnico

```bash
npx --yes create-quiver@latest ai plan --phase technical-plan --dry-run
npx --yes create-quiver@latest ai plan --phase technical-plan
```

Si querés editar el borrador antes de guardarlo:

```bash
npx --yes create-quiver@latest ai plan --phase technical-plan --review --interactive
```

Qué hace:

- genera un plan técnico desde los criterios aprobados;
- exige información estructurada de slices para poder crear specs después.

## 7. Revisar el plan técnico

```bash
npx --yes create-quiver@latest ai review-plan --dry-run
npx --yes create-quiver@latest ai review-plan
```

Qué hace:

- revisa el plan como si fuera a implementarse y probarse en producción;
- guarda metadata de revisión con recomendación `approve`, `approve-with-risk` o `revise`;
- bloquea la aprobación cuando hay fixes requeridos.

Aprobar un plan revisado:

```bash
npx --yes create-quiver@latest ai approve --phase technical-plan --version <n>
```

## 8. Crear el paquete de spec

```bash
npx --yes create-quiver@latest spec create --dry-run
npx --yes create-quiver@latest spec create
```

Si querés revisar el paquete antes de escribirlo:

```bash
npx --yes create-quiver@latest spec create --review --interactive
```

Qué hace:

- crea `SPEC.md`;
- crea el `slice-00` obligatorio;
- crea slices de implementación;
- crea `EXECUTION_BRIEF.md` y `CLOSURE_BRIEF.md`;
- crea el plan de ejecución y `pr.md`.

Validarlo:

```bash
npx --yes create-quiver@latest spec validate specs/<spec-slug> --strict
```

## 9. Crear o reutilizar el worktree de la spec

```bash
npx --yes create-quiver@latest spec start specs/<spec-slug> --dry-run
npx --yes create-quiver@latest spec start specs/<spec-slug>
```

Qué hace:

- prepara la rama y el worktree dedicados a esta spec;
- mantiene una spec aislada de otros trabajos.

## 10. Inspeccionar el orden de slices

```bash
npx --yes create-quiver@latest plan --spec <spec-slug>
npx --yes create-quiver@latest graph --spec <spec-slug>
npx --yes create-quiver@latest next --all-ready --spec <spec-slug>
```

Qué hace:

- muestra el orden de ejecución;
- muestra dependencias;
- lista slices listos para ejecutar.

## 11. Ejecutar slices manualmente

Generá un prompt para un agente ejecutor de menor costo:

```bash
npx --yes create-quiver@latest ai prompt-slice --slice specs/<spec-slug>/slices/<slice-id>/slice.json --dry-run
```

Qué hace:

- imprime el contexto mínimo que necesita el ejecutor;
- evita enviar la spec completa salvo que sea necesario.

## 12. Ejecutar un slice con Quiver

```bash
npx --yes create-quiver@latest ai execute-slice --slice specs/<spec-slug>/slices/<slice-id>/slice.json --commit --dry-run
npx --yes create-quiver@latest ai execute-slice --slice specs/<spec-slug>/slices/<slice-id>/slice.json --commit
```

Qué hace:

- ejecuta el slice con el ejecutor configurado;
- valida rama y worktree;
- valida archivos modificados contra el alcance del slice;
- corre comandos de validación declarados;
- actualiza cierre, evidencia, estado y `slice.json`;
- crea un commit para el slice.

## 13. Ejecutar slices por olas

Modo manual:

```bash
npx --yes create-quiver@latest ai execute-plan --dry-run --commit --mode manual
```

Qué hace:

- imprime prompts de slices en orden de ejecución;
- no llama proveedores.

Modo delegado:

```bash
npx --yes create-quiver@latest ai execute-plan --dry-run --commit --mode delegated
npx --yes create-quiver@latest ai execute-plan --execute --commit --mode delegated
```

Qué hace:

- previsualiza o ejecuta slices delegados;
- usa worktrees temporales para slices paralelizables;
- vuelve a ejecución secuencial cuando el alcance no es seguro.

## 14. Validar antes del PR

```bash
npx --yes create-quiver@latest check-pr specs/<spec-slug>/slices/<slice-id>/slice.json
npx --yes create-quiver@latest spec validate specs/<spec-slug> --strict
npx --yes create-quiver@latest next --all-ready --spec <spec-slug>
git diff --check
```

Qué hace:

- valida que el slice tenga cuerpo de PR y secciones requeridas;
- confirma que el paquete de spec esté completo;
- confirma el estado de los slices de la spec;
- revisa whitespace.

También corré validaciones propias del proyecto:

```bash
npm test
npm run build
npm run lint
```

Usá solo los scripts que existan en el proyecto.

## 15. Preparar el PR

Regla de política:

- un slice equivale a un PR por defecto;
- un PR agrupado sólo aplica a 2-3 slices docs-only, research-only o limpieza mecánica de bajo riesgo;
- no agrupes cambios de comportamiento, UI, backend, refactor, performance, Supabase, Edge Functions, auth, storage, preview, tests o CI que afecten gates.

Para PR individual de slice, usá el `pr.md` del slice como cuerpo del PR y mantené evidencia separada:

```bash
gh pr create \
  --draft \
  --title "<slice title>" \
  --body-file specs/<spec-slug>/slices/<slice-id>/pr.md \
  --base <base-branch> \
  --head <current-branch>
```

Para PRs agrupados permitidos o PRs documentales que usan el cuerpo generado de spec, primero previsualizá con Quiver:

```bash
npx --yes create-quiver@latest ai pr \
  --review \
  --dry-run \
  --input specs/<spec-slug>/pr.md \
  --ssh-host-alias github-personal \
  --identity-file ~/.ssh/github-personal
```

Qué hace:

- valida `gh`;
- valida autenticación de GitHub;
- valida alias SSH y archivo de identidad;
- verifica que exista el cuerpo del PR;
- no crea el PR.

Adaptá `--identity-file` a la ruta real de tu máquina, por ejemplo `~/ssh/github-personal`, `~/.ssh/github-personal` o una ruta de Windows.

## 16. Crear el pull request

Para PR individual de slice, crealo con `gh` usando el cuerpo del slice:

```bash
gh pr create \
  --title "<slice title>" \
  --body-file specs/<spec-slug>/slices/<slice-id>/pr.md \
  --base <base-branch> \
  --head <current-branch>
```

Para PRs agrupados permitidos o documentales que usan `specs/<spec-slug>/pr.md`, podés usar Quiver:

```bash
npx --yes create-quiver@latest ai pr \
  --create \
  --interactive \
  --input specs/<spec-slug>/pr.md \
  --ssh-host-alias github-personal \
  --identity-file ~/.ssh/github-personal
```

Qué hace:

- abre el PR usando `gh`;
- usa el cuerpo generado en `pr.md`;
- aplica preflight antes de crear el PR.

Merge:

- el merge humano es el default;
- el agente puede crear el PR, corregir CI, monitorear checks y marcarlo como listo;
- no uses auto-merge asistido salvo autorización explícita para ese PR o para una categoría documentada;
- el auto-merge asistido sólo aplica a docs-only o chore-only de bajo riesgo, sin runtime, sin configuración productiva, con checks verdes y sin comentarios pendientes;
- el auto-merge asistido está prohibido para UI, Supabase, Edge Functions, auth, storage, preview, performance, refactors y cambios con rollback dudoso.

## 17. Después del merge

Usá este cierre sólo después de que el último PR de la spec haya sido mergeado.

```bash
npx --yes create-quiver@latest spec close specs/<spec-slug> --dry-run
npx --yes create-quiver@latest spec close specs/<spec-slug>
git switch main
git pull --ff-only origin main
```

Qué hace:

- previsualiza y luego cierra el worktree de la spec;
- vuelve al checkout principal;
- trae localmente el resultado mergeado.
