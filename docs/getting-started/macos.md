# Configurar Quiver en macOS

Usá esta guía para preparar una Mac antes de usar Quiver en un proyecto.

## 1. Revisar herramientas requeridas

```bash
node --version
npm --version
git --version
gh --version
```

Qué hace:

- confirma que Node.js y npm pueden ejecutar el CLI de Quiver;
- confirma que Git está disponible para ramas y worktrees;
- confirma que GitHub CLI está disponible para crear PRs.

## 2. Instalar herramientas faltantes

Si falta Node.js o npm, instalá Node.js desde el instalador oficial o con tu version manager preferido.

Si falta GitHub CLI y usás Homebrew:

```bash
brew install gh
```

Qué hace:

- instala el comando `gh`, que Quiver usa para validar y crear PRs.

## 3. Autenticar GitHub CLI

```bash
gh auth login
gh auth status
```

Qué hace:

- inicia sesión en GitHub desde `gh`;
- confirma la cuenta activa y los permisos.

## 4. Preparar alias SSH

Quiver recibe el alias SSH y el archivo de identidad como valores separados.

Ejemplo de configuración SSH:

```sshconfig
Host github-personal
  HostName github.com
  User git
  IdentityFile ~/ssh/github-personal
  IdentitiesOnly yes
```

Verificalo:

```bash
ssh -T github-personal
```

Qué hace:

- confirma que `github-personal` resuelve a GitHub usando la clave esperada.

## 5. Verificar Quiver

```bash
npx --yes create-quiver@latest --version
npx --yes create-quiver@latest --help
```

Qué hace:

- descarga y ejecuta la última versión publicada de Quiver;
- confirma que los comandos principales están disponibles.

Siguiente paso:

- [Usar Quiver en un proyecto existente](../workflows/existing-project.md)
- [Ejecutar el flujo completo de spec a PR con IA](../workflows/full-ai-spec-to-pr.md)
