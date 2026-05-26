# Configurar Quiver en Linux

Usá esta guía para preparar una máquina Linux antes de usar Quiver en un proyecto.

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

Instalá Node.js y npm con el package manager de tu distribución o con un version manager.

Instalá GitHub CLI con el paquete oficial para tu distribución.

Después de instalar:

```bash
gh --version
```

Qué hace:

- confirma que el ejecutable `gh` está disponible.

## 3. Autenticar GitHub CLI

```bash
gh auth login
gh auth status
```

Qué hace:

- inicia sesión en GitHub;
- confirma cuenta, permisos y host.

## 4. Preparar alias SSH

Ejemplo de configuración SSH:

```sshconfig
Host github-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/github-personal
  IdentitiesOnly yes
```

Verificalo:

```bash
ssh -T github-personal
```

Qué hace:

- confirma que Git puede autenticarse con el alias que Quiver va a validar.

## 5. Verificar Quiver

```bash
npx --yes create-quiver@latest --version
npx --yes create-quiver@latest doctor --help
```

Qué hace:

- confirma que la última versión publicada de Quiver puede ejecutarse.

Siguiente paso:

- [Usar Quiver en un proyecto existente](../workflows/existing-project.md)
- [Ejecutar el flujo completo de spec a PR con IA](../workflows/full-ai-spec-to-pr.md)
