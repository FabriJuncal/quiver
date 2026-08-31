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
- informa el estado de compatibilidad sin inventar evidencia faltante.

## 4. Aplicar migración

```bash
npx --yes create-quiver@latest migrate
```

Qué hace:

- actualiza documentación y estado interno de Quiver;
- preserva archivos existentes del proyecto;
- mantiene la migración lo más aditiva posible.
- valida los bloqueos antes de la primera escritura;
- ejecuta una verificación posterior antes de informar éxito.

Usá esta variante si no querés instalar dependencias:

```bash
npx --yes create-quiver@latest migrate --skip-install
```

En automatización, confirmá de forma explícita:

```bash
npx --yes create-quiver@latest migrate --yes --skip-install
```

## 5. Verificar la migración

```bash
npx --yes create-quiver@latest doctor --json
```

Qué hace:

- verifica el contrato de forma independiente del apply;
- conserva claves y enums machine-readable sin localizar;
- devuelve exit code 1 ante un error bloqueante.

La configuración verificada vive en `.quiver/config.json`, bajo `governance.compatibility`, con `schema_version: 1`, `writer_mode` y `minimum_writer_version`. El mínimo representa la versión que completó la migración verificada y no debe reducirse.

Si falta evidencia legacy demostrable, Quiver informa `legacy-unverified` y `LEGACY_EVIDENCE_UNVERIFIED`. Los conteos no demostrables son `null`; ese estado no habilita readiness ni avance de fase.

## 6. Comprobar la reaplicación idempotente

Ejecutá nuevamente el mismo apply:

```bash
npx --yes create-quiver@latest migrate --yes --skip-install
```

Cuando el proyecto ya está vigente, el resultado es `already-current` y no escribe archivos. Verificá otra vez con `doctor --json`.

## 7. Reconstruir contexto del proyecto

```bash
npx --yes create-quiver@latest analyze
npx --yes create-quiver@latest doctor
```

Qué hace:

- refresca `docs/PROJECT_MAP.md`;
- confirma que la estructura migrada esté sana.

## 8. Preparar contexto para IA

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

## 9. Activar rollback read-only cuando sea necesario

El rollback de gobernanza no es un downgrade de datos. Cambiá `governance.compatibility.writer_mode` a `read-only` mediante un cambio versionado y revisado en `.quiver/config.json`, sin modificar `minimum_writer_version` ni reescribir findings, conditions o decisions.

Después ejecutá:

```bash
npx --yes create-quiver@latest doctor --json
```

Los readers y gates continúan disponibles y fallan cerrados; los writers v58 devuelven `GOVERNANCE_READ_ONLY` con exit code 1. Un writer o dependencia local anterior al mínimo devuelve `UNSAFE_WRITER_DOWNGRADE`. El guard cubre la ruta soportada de Quiver, no la ejecución deliberada de un binario pre-guard por fuera de ella.

La interpretación y recuperación de los cuatro códigos de compatibilidad está centralizada en [Troubleshooting](../TROUBLESHOOTING.md#gobernanza-v58-migracion-rollback-y-downgrade).

## 10. Commit de migración

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
