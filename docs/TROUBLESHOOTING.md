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

Cuando el análisis sea válido y quieras escribir documentación:

```bash
npx --yes create-quiver@latest ai analyze-project --deep --review --provider codex --model gpt-5.5
```

`--review` abre una propuesta editable, revalida el JSON editado, muestra diff final, pide confirmación, crea snapshot y recién después escribe docs permitidos.
