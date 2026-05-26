# Configurar Quiver en Windows PowerShell

Usá esta guía para preparar Windows PowerShell antes de usar Quiver.

## 1. Revisar herramientas requeridas

```powershell
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

Instalá:

- Node.js para Windows;
- Git for Windows;
- GitHub CLI para Windows.

Después cerrá y abrí PowerShell de nuevo, y ejecutá:

```powershell
node --version
npm --version
git --version
gh --version
```

## 3. Autenticar GitHub CLI

```powershell
gh auth login
gh auth status
```

Qué hace:

- inicia sesión en GitHub desde `gh`;
- confirma la cuenta activa y los permisos.

## 4. Preparar alias SSH

Tu configuración SSH normalmente está en:

```powershell
$HOME\.ssh\config
```

Ejemplo:

```sshconfig
Host github-personal
  HostName github.com
  User git
  IdentityFile C:\Users\<user>\ssh\github-personal
  IdentitiesOnly yes
```

Verificalo:

```powershell
ssh -T github-personal
```

Qué hace:

- confirma que el alias funciona con tu clave SSH.

## 5. Verificar Quiver

```powershell
npx --yes create-quiver@latest --version
npx --yes create-quiver@latest --help
```

Qué hace:

- ejecuta la última versión publicada de Quiver sin instalarla globalmente.

Nota sobre rutas:

- usá comillas cuando una ruta tenga espacios;
- pasá `--identity-file` con ruta de Windows al crear PRs.

Siguiente paso:

- [Usar Quiver en un proyecto existente](../workflows/existing-project.md)
- [Ejecutar el flujo completo de spec a PR con IA](../workflows/full-ai-spec-to-pr.md)
