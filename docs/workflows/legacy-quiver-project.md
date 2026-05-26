# Flujo para proyecto con Quiver anterior

Usá este flujo cuando el proyecto ya tiene archivos de Quiver creados por una versión anterior.

## 1. Entrar al proyecto

```bash
cd /ruta/al/proyecto
git status -sb
```

Qué hace:

- revisa la rama actual y los cambios pendientes.

## 2. Ejecutar doctor

```bash
npx --yes create-quiver@latest doctor
```

Qué hace:

- detecta si el proyecto está inicializado, incompleto, legacy, híbrido o sano.

## 3. Previsualizar migración

```bash
npx --yes create-quiver@latest migrate --dry-run
```

Qué hace:

- muestra qué actualizaría Quiver;
- evita escribir archivos.

## 4. Aplicar migración

```bash
npx --yes create-quiver@latest migrate
```

Qué hace:

- actualiza documentación y estado interno de Quiver;
- preserva archivos existentes del proyecto;
- mantiene la migración lo más aditiva posible.

Usá esta variante si no querés instalar dependencias:

```bash
npx --yes create-quiver@latest migrate --skip-install
```

## 5. Reconstruir contexto del proyecto

```bash
npx --yes create-quiver@latest analyze
npx --yes create-quiver@latest doctor
```

Qué hace:

- refresca `docs/PROJECT_MAP.md`;
- confirma que la estructura migrada esté sana.

## 6. Preparar contexto para IA

```bash
npx --yes create-quiver@latest ai prepare-context --dry-run
npx --yes create-quiver@latest ai prepare-context
```

Modo asistido por planner, útil cuando el contexto anterior quedó desactualizado:

```bash
npx --yes create-quiver@latest ai prepare-context --with-planner --dry-run
npx --yes create-quiver@latest ai prepare-context --with-planner --review --interactive
```

Qué hace:

- actualiza contexto de onboarding de forma segura;
- reporta supuestos y contradicciones.

## 7. Commit de migración

```bash
git status -sb
git add AGENTS.md docs .quiver .gitignore package.json package-lock.json
git commit -m "docs: migrate quiver workflow"
```

Qué hace:

- crea una base estable antes de empezar specs nuevas.

Ajustá los paths según lo que haya informado la migración.

Siguiente paso:

- [Ejecutar el flujo completo de spec a PR con IA](./full-ai-spec-to-pr.md)
