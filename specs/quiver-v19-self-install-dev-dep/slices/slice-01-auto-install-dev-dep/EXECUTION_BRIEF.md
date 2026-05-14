# EXECUTION BRIEF — slice-01: Auto-install create-quiver as dev dependency

**Spec:** quiver-v19-self-install-dev-dep
**Slice:** slice-01-auto-install-dev-dep
**Branch:** `feature/QUIVER-01-auto-install-dev-dep` from `main`
**Estimated time:** 1.5h

---

## Contexto

`npx create-quiver` no instala el paquete en `node_modules` del proyecto destino. Después del init, comandos como `quiver:plan` fallan o usan la versión cacheada globalmente. La solución es correr el package manager del proyecto destino para instalar `create-quiver` como dev dependency inmediatamente después del init/migrate.

---

## Archivos a modificar

1. `src/create-quiver/lib/init-docs.js` — agregar `detectPackageManager` e `installSelfAsDevDep`
2. `src/create-quiver/index.js` — agregar `--skip-install` al parser, llamar a `installSelfAsDevDep` en init y migrate
3. `tests/lib/init-docs.test.js` — nuevo archivo de tests

No toques ningún otro archivo.

---

## Parte A — `src/create-quiver/lib/init-docs.js`

### Paso 1: Agregar import de `execSync`

Al inicio del archivo, después de los requires existentes (`fs`, `path`, `writeState`), agregar:

```js
const { execSync } = require('child_process');
```

### Paso 2: Agregar las dos funciones nuevas

Agregar antes del `module.exports` al final del archivo:

```js
function detectPackageManager(projectRoot) {
  if (fs.existsSync(path.join(projectRoot, 'bun.lockb'))) return 'bun';
  if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

function installSelfAsDevDep(projectRoot, version) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return 'skipped-no-package-json';
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (pkg.devDependencies && pkg.devDependencies['create-quiver']) {
    return 'skipped-already-present';
  }

  const pm = detectPackageManager(projectRoot);
  const commands = {
    npm: `npm install -D create-quiver@${version}`,
    yarn: `yarn add -D create-quiver@${version}`,
    pnpm: `pnpm add -D create-quiver@${version}`,
    bun: `bun add -d create-quiver@${version}`,
  };

  try {
    execSync(commands[pm], { cwd: projectRoot, stdio: 'inherit' });
    return 'installed';
  } catch {
    return 'failed';
  }
}
```

### Paso 3: Exportar las funciones nuevas

Encontrá el `module.exports` actual y agregá las dos funciones nuevas:

```js
module.exports = {
  // ... exports existentes ...
  detectPackageManager,
  installSelfAsDevDep,
};
```

---

## Parte B — `src/create-quiver/index.js`

### Paso 1: Importar `installSelfAsDevDep`

En la línea 10 donde se importa `runInitDocs`, extender el destructuring para incluir la función nueva:

```js
// Antes (aproximado):
const { runInitDocs } = require('./lib/init-docs');

// Después:
const { runInitDocs, installSelfAsDevDep } = require('./lib/init-docs');
```

### Paso 2: Agregar `--skip-install` al parser de args

Dentro de la función `parseArgs`, en el bloque donde se manejan los flags (el loop que analiza `arg`), agregar el caso nuevo junto a los otros flags booleanos (`--yes`, etc.):

```js
if (arg === '--skip-install') {
  result.skipInstall = true;
  continue;
}
```

### Paso 3: Llamar a `installSelfAsDevDep` en el flujo de init

El flujo init en index.js (cerca de la línea 1416) actualmente es:

```js
runInitDocs(targetDir, projectName);
console.log(`Installed Quiver into ${targetDir}`);
printInitNextSteps(targetDir, projectName);
```

Reemplazarlo por:

```js
runInitDocs(targetDir, projectName);

if (!args.skipInstall) {
  const installResult = installSelfAsDevDep(targetDir, CLI_VERSION);
  if (installResult === 'installed') {
    console.log(`Added create-quiver@${CLI_VERSION} as dev dependency`);
  } else if (installResult === 'failed') {
    console.warn(`Warning: could not install create-quiver automatically. Run: npm install -D create-quiver@${CLI_VERSION}`);
  }
}

console.log(`Installed Quiver into ${targetDir}`);
printInitNextSteps(targetDir, projectName);
```

Nota: `CLI_VERSION` ya existe en `index.js` — no lo reimportes.

### Paso 4: Llamar a `installSelfAsDevDep` en el flujo de migrate

Buscá el flujo de migrate en index.js (buscar `runInitDocs` con `migrateMode: true` o similar). Aplicar el mismo patrón después del call de init/migrate.

---

## Parte C — `tests/lib/init-docs.test.js` (archivo nuevo)

Crear este archivo con el patrón del repo (`node:test`, `node:assert/strict`):

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { detectPackageManager, installSelfAsDevDep } = require('../../src/create-quiver/lib/init-docs');

function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiver-init-test-'));
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

test('detectPackageManager returns npm when no lockfile exists', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    assert.equal(detectPackageManager(dir), 'npm');
  } finally {
    cleanup();
  }
});

test('detectPackageManager returns yarn when yarn.lock exists', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'yarn.lock'), '');
    assert.equal(detectPackageManager(dir), 'yarn');
  } finally {
    cleanup();
  }
});

test('detectPackageManager returns pnpm when pnpm-lock.yaml exists', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'pnpm-lock.yaml'), '');
    assert.equal(detectPackageManager(dir), 'pnpm');
  } finally {
    cleanup();
  }
});

test('detectPackageManager returns bun when bun.lockb exists', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'bun.lockb'), '');
    assert.equal(detectPackageManager(dir), 'bun');
  } finally {
    cleanup();
  }
});

test('installSelfAsDevDep returns skipped-no-package-json when no package.json', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    const result = installSelfAsDevDep(dir, '0.8.0');
    assert.equal(result, 'skipped-no-package-json');
  } finally {
    cleanup();
  }
});

test('installSelfAsDevDep returns skipped-already-present when create-quiver in devDeps', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      name: 'test',
      devDependencies: { 'create-quiver': '^0.7.0' },
    }));
    const result = installSelfAsDevDep(dir, '0.8.0');
    assert.equal(result, 'skipped-already-present');
  } finally {
    cleanup();
  }
});

test('installSelfAsDevDep returns failed when install command fails', () => {
  const { dir, cleanup } = makeTmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'test' }));
    // Force failure: set PATH to empty so no package manager can be found
    const original = process.env.PATH;
    process.env.PATH = '';
    const result = installSelfAsDevDep(dir, '0.8.0');
    process.env.PATH = original;
    assert.equal(result, 'failed');
  } finally {
    cleanup();
  }
});
```

---

## Verificaciones

```bash
# Tests
node --test tests/**/*.test.js

# Smoke: --skip-install no instala
mkdir -p /tmp/quiver-skip-test && echo '{"name":"test","scripts":{}}' > /tmp/quiver-skip-test/package.json
node bin/create-quiver.js --skip-install --name test --dir /tmp/quiver-skip-test
ls /tmp/quiver-skip-test/node_modules/create-quiver 2>/dev/null && echo "FAIL: se instaló igual" || echo "OK: no instaló"

# Smoke: sin --skip-install sí instala (requiere red)
mkdir -p /tmp/quiver-install-test && echo '{"name":"test","scripts":{}}' > /tmp/quiver-install-test/package.json
node bin/create-quiver.js --name test --dir /tmp/quiver-install-test
ls /tmp/quiver-install-test/node_modules/create-quiver && echo "OK: instalado" || echo "FAIL"
```

---

## Restricciones

- No toques `mergePackageJson` — la lógica de install va en `installSelfAsDevDep`, no en el merge de package.json
- No hagas `npm install` general — solo `npm install -D create-quiver@VERSION`
- No elimines ni renombres ningún export existente de `init-docs.js`
- No agregues dependencias externas — solo `child_process` (built-in de Node)
- Un solo commit con los tres archivos

## Mensaje de commit sugerido

```
feat(QUIVER-01): auto-install create-quiver as dev dependency after init

After init or migrate, detect the target project's package manager
(yarn/pnpm/bun/npm) and install create-quiver as a dev dependency.
Skippable with --skip-install for CI environments.
Resolves the npx cache issue: subsequent quiver commands in the project
resolve to the local version without requiring @version suffix.
```
