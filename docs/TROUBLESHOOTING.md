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
