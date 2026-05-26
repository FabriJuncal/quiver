# Configurar Quiver en Windows Git Bash o WSL

Usá esta guía si ejecutás Quiver desde Git Bash o WSL en Windows.

## 1. Revisar herramientas requeridas

```bash
node --version
npm --version
git --version
gh --version
```

Qué hace:

- confirma que Node.js y npm pueden ejecutar Quiver;
- confirma que Git está disponible para ramas y worktrees;
- confirma que GitHub CLI está disponible para crear PRs.

## 2. Instalar herramientas faltantes

Instalá Node.js, Git y GitHub CLI en el entorno que realmente vas a usar.

Importante:

- Git Bash y WSL pueden tener instalaciones distintas;
- si vas a ejecutar Quiver en WSL, instalá `node`, `npm`, `git` y `gh` dentro de WSL.

## 3. Autenticar GitHub CLI

```bash
gh auth login
gh auth status
```

Qué hace:

- inicia sesión en GitHub desde la misma terminal donde vas a usar Quiver.

## 4. Preparar alias SSH

Git Bash y WSL normalmente soportan rutas estilo Unix.

Ejemplo:

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

- confirma que el alias SSH funciona desde la misma terminal que usará Quiver.

## 5. Verificar Quiver

```bash
npx --yes create-quiver@latest --version
npx --yes create-quiver@latest --help
```

Qué hace:

- ejecuta la última versión de Quiver desde npm.

Siguiente paso:

- [Usar Quiver en un proyecto existente](../workflows/existing-project.md)
- [Ejecutar el flujo completo de spec a PR con IA](../workflows/full-ai-spec-to-pr.md)
