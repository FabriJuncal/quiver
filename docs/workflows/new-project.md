# Flujo para proyecto nuevo

Usá este flujo cuando el repositorio todavía no existe o la carpeta está vacía.

## 1. Crear la carpeta del proyecto

```bash
mkdir mi-proyecto
cd mi-proyecto
git init
```

Qué hace:

- crea una carpeta para el proyecto;
- inicializa Git para que Quiver pueda razonar sobre cambios y worktrees.

## 2. Inicializar Quiver

```bash
npx --yes create-quiver@latest init --name "Mi Proyecto"
```

Qué hace:

- crea el contrato visible de Quiver;
- crea el estado interno en `.quiver/`;
- agrega scripts `quiver:*` cuando existe o se crea `package.json`.

## 3. Revisar el próximo paso

```bash
npx --yes create-quiver@latest flow
```

Qué hace:

- muestra el estado actual del workflow;
- recomienda el próximo comando seguro.

## 4. Analizar y validar

```bash
npx --yes create-quiver@latest analyze
npx --yes create-quiver@latest doctor
```

Qué hace:

- crea o actualiza `docs/PROJECT_MAP.md`;
- refresca el contexto para IA;
- valida que el contrato de Quiver esté sano.

## 5. Preparar contexto para IA

```bash
npx --yes create-quiver@latest ai prepare-context --dry-run
npx --yes create-quiver@latest ai prepare-context
```

Qué hace:

- previsualiza cambios documentales de onboarding;
- escribe la documentación de contexto después de revisar;
- evita cambios en código de producto.

Siguiente paso:

- [Ejecutar el flujo completo de spec a PR con IA](./full-ai-spec-to-pr.md)
