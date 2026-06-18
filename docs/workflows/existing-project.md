# Flujo para proyecto existente

Usá este flujo cuando el proyecto ya tiene código, pero todavía no usa Quiver.

## 1. Entrar al proyecto

```bash
cd /ruta/al/proyecto
git status -sb
```

Qué hace:

- entra a la raíz del proyecto;
- muestra si hay cambios pendientes.

Recomendado:

- empezar desde una rama limpia;
- no mezclar el onboarding de Quiver con trabajo de producto no relacionado.

## 2. Verificar la versión publicada de Quiver

```bash
npx --yes create-quiver@latest --version
npx --yes create-quiver@latest --help
```

Qué hace:

- confirma que npm puede resolver Quiver;
- muestra los comandos disponibles.

## 3. Inicializar Quiver

```bash
npx --yes create-quiver@latest init --name "Nombre del Proyecto"
```

Qué hace:

- agrega documentación de Quiver y estado interno;
- todavía no crea una spec;
- preserva archivos existentes.

## 4. Inspeccionar el estado del workflow

```bash
npx --yes create-quiver@latest flow
```

Qué hace:

- informa qué ve Quiver;
- recomienda el próximo comando seguro.

## 5. Analizar el proyecto existente

```bash
npx --yes create-quiver@latest analyze --dry-run
npx --yes create-quiver@latest analyze
```

Qué hace:

- previsualiza actualizaciones del mapa del proyecto;
- escribe `docs/PROJECT_MAP.md`;
- guarda el escaneo crudo en `.quiver/scans/`.

## 6. Validar el contrato

```bash
npx --yes create-quiver@latest doctor
```

Qué hace:

- revisa documentación requerida;
- revisa salud de la estructura;
- reporta herramientas faltantes o estados riesgosos.

## 7. Preparar contexto de onboarding para IA

Si querés que Quiver infiera producto, arquitectura, funcionalidades y riesgos desde una muestra segura del código, ejecutá primero el análisis profundo:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --dry-run
npx --yes create-quiver@latest ai analyze-project --deep --provider codex --model gpt-5.5
```

Qué hace:

- `--dry-run` muestra qué leería y qué excluiría, sin proveedor ni escrituras;
- el modo con proveedor guarda auditoría en `.quiver/runs`, valida JSON con evidencia y aplica docs finales validados por defecto;
- antes de escribir crea propuesta, snapshot, write manifest y validación post-write;
- resume lockfiles como metadata para no consumir el presupuesto principal con `package-lock.json`, `pnpm-lock.yaml` o equivalentes;
- prioriza entrypoints, componentes, contexts/state, lib/data layer, auth, DB/integraciones y documentación humana del producto por encima de docs generados por Quiver;
- muestra loader en TTY y progreso lineal en no-TTY;
- si hay drift seguro de schema, como `notes` extra, `claim` usado como `name` faltante o `confidence` donde no está permitido, lo repara de forma auditada;
- si el error es retryable, hace un retry acotado con feedback compacto;
- si el provider cita evidencia fuera de la muestra, clasifica esas rutas y muestra una solución recomendada con `--include-tests`, `--include-db`, `--max-files` o `--max-bytes` solo cuando sea seguro;
- si la propuesta final no es válida, falla sin escribir docs finales.

Si preferís separar generación y aplicación:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --save-proposal --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai analyze-project apply --run <run-id>
```

Si necesitás conservar compatibilidad con scripts que ya usaban el flujo explícito:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --apply-docs --yes --provider codex --model gpt-5.5
```

`--review` sigue disponible como modo avanzado: abre la propuesta JSON en editor y revalida el JSON editado antes de escribir docs permitidos.

No envía `.env`, `.git`, `.quiver`, dependencias, caches, binarios ni outputs generados. Si no puede probar una conclusión, debe quedar como `unknown` o `needs_confirmation`.

```bash
npx --yes create-quiver@latest ai prepare-context --dry-run
npx --yes create-quiver@latest ai prepare-context
```

Modo asistido por planner, recomendado cuando querés que una IA complete el contexto inicial:

```bash
npx --yes create-quiver@latest ai prepare-context --with-planner --dry-run
npx --yes create-quiver@latest ai prepare-context --with-planner --review --interactive
```

Qué hace:

- previsualiza actualizaciones documentales;
- escribe contexto para IA después de revisar;
- registra supuestos, riesgos y rutas omitidas.

## 8. Configurar agentes

```bash
npx --yes create-quiver@latest ai agent set planner --provider codex --model "planner-model" --dry-run
npx --yes create-quiver@latest ai agent set planner --provider codex --model "planner-model"
npx --yes create-quiver@latest ai agent set executor --provider codex --model "executor-model"
```

Qué hace:

- guarda perfiles reutilizables por rol;
- no guarda credenciales ni API keys.

## 9. Commit de documentación inicial

```bash
git status -sb
git add AGENTS.md docs .quiver .gitignore package.json package-lock.json
git commit -m "docs: initialize quiver workflow"
```

Qué hace:

- crea una base limpia antes de empezar a planificar features.

Ajustá los paths de `git add` según los archivos que Quiver haya creado realmente.

Siguiente paso:

- [Ejecutar el flujo completo de spec a PR con IA](./full-ai-spec-to-pr.md)
