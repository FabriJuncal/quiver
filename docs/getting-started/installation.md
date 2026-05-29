# Instalación y uso con npx

Esta guía explica por qué Quiver normalmente se ejecuta con `npx`, cuándo aparece en `node_modules` y cuándo conviene instalarlo como dependencia del proyecto.

## Uso recomendado

Para usar la última versión publicada de Quiver, ejecutá:

```bash
npx --yes create-quiver@latest --help
```

Qué hace:

- descarga o reutiliza `create-quiver` desde la caché de npm;
- ejecuta el CLI sin agregarlo al `package.json`;
- evita instalar una dependencia que la aplicación no necesita para correr.

Este es el modo recomendado para inicializar, analizar, diagnosticar, preparar contexto, crear specs, ejecutar slices y abrir PRs.

## Por qué no aparece en node_modules

Si ejecutás Quiver con:

```bash
npx --yes create-quiver@latest ...
```

el paquete no se instala dentro del proyecto. npm lo ejecuta desde su caché temporal o global de ejecución. Por eso no vas a encontrarlo en:

```text
node_modules/create-quiver
```

Esto es normal para CLIs de bootstrap como `create-quiver`. Quiver organiza el workflow del proyecto, pero no es una librería que tu app importe en runtime.

## Cuándo instalarlo como devDependency

Instalalo localmente solo si el equipo quiere una versión fijada en el proyecto o scripts reproducibles sin depender de `@latest`:

```bash
npm install --save-dev create-quiver
```

Después podés usar:

```bash
npx create-quiver --help
```

O agregar scripts al `package.json`, por ejemplo:

```json
{
  "scripts": {
    "quiver:doctor": "create-quiver doctor",
    "quiver:flow": "create-quiver flow"
  }
}
```

Qué cambia:

- `create-quiver` aparece en `devDependencies`;
- npm lo instala dentro de `node_modules`;
- los scripts del proyecto usan la versión fijada por `package-lock.json`.

## Qué opción elegir

| Necesidad | Recomendación |
|---|---|
| Probar Quiver rápidamente | `npx --yes create-quiver@latest` |
| Inicializar un proyecto nuevo | `npx --yes create-quiver@latest init --name "Mi Proyecto"` |
| Inicializar docs en espanol | `npx --yes create-quiver@latest --lang es init --name "Mi Proyecto"` |
| Usar siempre la última versión publicada | `npx --yes create-quiver@latest` |
| Fijar una versión para el equipo | `npm install --save-dev create-quiver` |
| Evitar dependencia local de workflow | Usar `npx` |

## Idioma del proyecto

Quiver puede generar documentacion humana inicial en `en` o `es`.

Para una ejecucion puntual:

```bash
npx --yes create-quiver@latest --lang es init --name "Mi Proyecto"
```

Para guardar el idioma del proyecto y no repetir flags:

```bash
npx --yes create-quiver@latest config language set es
```

El idioma configurado afecta la salida humana y los docs humanos generados. No traduce JSON, JSONL, `package.json`, `slice.json`, comandos, flags, rutas, providers, modelos ni otros artefactos machine-readable.

## Qué no hace Quiver

Quiver no se instala globalmente por defecto, no modifica credenciales de npm y no agrega una dependencia runtime a tu app salvo que lo pidas explícitamente con npm.

## Siguiente paso

- [Proyecto nuevo desde cero](../workflows/new-project.md)
- [Proyecto existente sin Quiver](../workflows/existing-project.md)
- [Referencia de comandos](../reference/commands.md)
