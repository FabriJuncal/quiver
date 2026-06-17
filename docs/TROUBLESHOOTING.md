# Troubleshooting

Usá esta guía cuando una instalación, primer uso o comando de Quiver no se comporta como esperabas.

## Quiver no aparece en node_modules

### Síntoma

Ejecutaste un comando como:

```bash
npx --yes create-quiver@latest --help
```

El comando funciona, pero no encontrás `create-quiver` en:

```text
node_modules/create-quiver
```

### Explicación

Es esperado. Cuando usás `npx`, npm descarga y ejecuta el paquete desde su caché de ejecución. Eso permite usar Quiver sin modificar el `package.json` ni instalarlo dentro del proyecto.

Quiver funciona como CLI de workflow y bootstrap. No es una dependencia runtime que tu aplicación tenga que importar.

### Qué hacer

Si solo querés usar Quiver, no hace falta hacer nada más:

```bash
npx --yes create-quiver@latest flow
```

Si querés fijar una versión en el proyecto, instalalo como dependencia de desarrollo:

```bash
npm install --save-dev create-quiver
```

Después de eso sí va a aparecer en `node_modules` y podés usarlo desde scripts del proyecto.

### Ver también

- [Instalación y uso con npx](./getting-started/installation.md)
- [Referencia de comandos](./reference/commands.md)

## Quiver ejecuta una versión distinta a la esperada

### Síntoma

`npx create-quiver --version` y `npx --yes create-quiver@latest --version` muestran versiones diferentes.

### Explicación

`npx create-quiver` puede resolver una versión local si existe en el proyecto. En cambio, `npx --yes create-quiver@latest` pide explícitamente la última versión publicada en npm.

### Qué hacer

Para probar la última versión publicada:

```bash
npx --yes create-quiver@latest --version
```

Para usar la versión fijada por el proyecto:

```bash
npx create-quiver --version
```

## `ai analyze-project` falla con JSON inválido del proveedor

### Síntoma

El comando:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --provider codex --model gpt-5.5
```

termina con un error como:

```text
provider analysis JSON does not match the required schema
```

### Explicación

Quiver trata la salida del proveedor como dato no confiable. Primero intenta validar el JSON, luego repara solo drift estructural seguro, como claves `notes` no permitidas, `claim` usado como `name` faltante o `confidence` en paths donde el schema no lo permite. Después reintenta como máximo de forma acotada cuando el error puede corregirse con feedback de schema.

Si el JSON final sigue inválido, Quiver falla sin escribir docs finales. Los detalles quedan bajo `.quiver/runs/run-.../`:

- `context/selected-context.json`: muestra qué contexto se envió y qué se excluyó.
- `raw/`: guarda salida del proveedor redactada, truncada con head/tail y hash para auditoría.
- `repair/analyze-project-repair.json`: registra claves removidas si hubo repair.
- `retry/analyze-project-retry.json`: registra intentos cuando hubo retry.
- `validation/analyze-project-validation.json`: guarda todos los errores de validación.
- `status.json`: resume el estado final del run.

### Qué hacer

Inspeccioná primero el contexto seleccionado:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --dry-run --json
```

Después podés reducir el presupuesto si el provider se desvía por exceso de contexto:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --max-files 40 --max-bytes 150000 --provider codex --model gpt-5.5
```

Si `package-lock.json` aparece como problema, no deberías incluirlo completo. En versiones actuales debe aparecer resumido en `detected.lockfiles` y omitido como `sampling:lockfile-metadata`.

Cuando el análisis sea válido, el comando normal ya escribe documentación final validada:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --provider codex --model gpt-5.5
```

Quiver revalida la propuesta, crea artifacts auditados, snapshot, write manifest y escribe solo docs permitidos. `--apply-docs` queda disponible para scripts o flujos interactivos que necesiten el selector anterior.

Para guardar primero y aplicar después sin volver a ejecutar el proveedor:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --save-proposal --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai analyze-project apply --run <run-id>
```

`--review` sigue disponible como modo avanzado si querés editar la propuesta JSON manualmente antes de escribir.

## `ai analyze-project` no completa `docs/CONTEXTO.md` ni crea `docs/ARCHITECTURE.md`

### Síntoma

Después de ejecutar:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --provider codex --model gpt-5.5
```

los docs finales siguen con placeholders o falta `docs/ARCHITECTURE.md`.

### Explicación

En versiones actuales, ese comando debe escribir documentación final validada. Si los docs siguen con placeholders, el flujo se bloqueó antes de escribir o la propuesta IA no incluyó contenido útil para esos paths.

Quiver clasifica cada doc antes de escribir:

- `scaffold`: reemplaza el contenido visible de template y conserva frontmatter válido.
- `partial_scaffold` o `mixed`: elimina placeholders críticos, conserva contenido humano real y consolida bloques gestionados.
- `human_content`: conserva el contenido humano y agrega/actualiza el bloque `quiver:analyze-project`.

Los bloques antiguos `quiver:context-prep` que todavía contienen placeholders se eliminan durante `analyze-project` para que no compitan con el contexto nuevo. Si hay conflicto de nombres, por ejemplo `NIKA_ERP`, `stockflow` y `StockFlow`, Quiver lo reporta como warning o error en `--strict` en vez de ocultarlo.

### Qué hacer

Revisá el error mostrado y los artifacts del run. Los caminos seguros son:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai analyze-project --deep --save-proposal --provider codex --model gpt-5.5
npx --yes create-quiver@latest ai analyze-project apply --run <run-id>
```

- el comando normal aplica docs después de validar JSON, proposal, snapshot y post-write;
- `--save-proposal` guarda `.quiver/runs/<run-id>/proposal/*` sin tocar docs finales.
- `apply --run <run-id>` aplica una propuesta guardada sin ejecutar proveedor ni pedir `--provider` o `--model`.

Si venís de una versión anterior y tus docs tienen placeholders arriba y un bloque `quiver:analyze-project` útil abajo, volvé a ejecutar el comando normal. La salida debe mostrar `Merge decisions`, el strategy aplicado, si reemplazó scaffold, si preservó contenido humano y si removió `context-prep`.
