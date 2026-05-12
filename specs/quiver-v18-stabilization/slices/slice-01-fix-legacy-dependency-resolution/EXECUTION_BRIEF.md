# EXECUTION BRIEF — slice-01: Fix legacy dependency resolution

**Spec:** quiver-v18-stabilization
**Slice:** slice-01-fix-legacy-dependency-resolution
**Estimated time:** 30 min
**Branch:** `bugfix/QUIVER-01-fix-legacy-dependency-resolution` from `main`

---

## Contexto

`npx create-quiver plan` crashea en el repo de Quiver con:

```
SliceGraphError: Missing dependency reference(s):
quiver-v02-bootstrap-hardening/slice-01-path-remote-safety -> quiver-v02-bootstrap-hardening/quiver-v01
```

**Causa:** `normalizeDependencyRef` en `src/create-quiver/lib/slice-graph.js` (línea ~65) toma el valor bare `"quiver-v01"` del campo legacy `"dependencies"`, no encuentra `/`, y devuelve `"quiver-v02-bootstrap-hardening/quiver-v01"`. Ese ref no existe en el mapa de slices → `buildGraph` tira error.

---

## El único archivo que tocás

```
src/create-quiver/lib/slice-graph.js
```

---

## Cambio exacto

Localizá la función `normalizeDependencyRef`. Actualmente luce así:

```js
function normalizeDependencyRef(slice, dependency) {
  const dep = String(dependency || '').trim();
  if (!dep) {
    return null;
  }

  if (dep.includes('/')) {
    return dep;
  }

  if (!slice || !slice.specSlug) {
    return dep;
  }

  return `${slice.specSlug}/${dep}`;
}
```

Agregá una sola guarda antes del `return` final:

```js
function normalizeDependencyRef(slice, dependency) {
  const dep = String(dependency || '').trim();
  if (!dep) {
    return null;
  }

  if (dep.includes('/')) {
    return dep;
  }

  if (!slice || !slice.specSlug) {
    return dep;
  }

  // Legacy format: bare spec names (no 'slice-' prefix) are spec-level deps already
  // satisfied by definition. Return null so they are filtered and not validated.
  if (!dep.startsWith('slice-')) {
    return null;
  }

  return `${slice.specSlug}/${dep}`;
}
```

Eso es todo el cambio funcional.

---

## Test a agregar

Ubicá `tests/lib/slice-graph.test.js` (o el archivo de test existente para slice-graph). Agregá un caso que cubra:

1. Un slice con `"dependencies": ["quiver-v01"]` (formato legacy bare) no tira error en `buildGraph` y no produce aristas para ese dep.
2. Un slice con `"depends_on": ["other-spec/slice-01-foo"]` sigue produciendo la arista correcta (regresión).

Seguí el estilo de los tests existentes en ese archivo.

---

## Verificación antes de commitear

```bash
# 1. Todos los tests pasan
node --test tests/

# 2. El comando ya no crashea
node bin/create-quiver.js plan

# 3. JSON válido
node bin/create-quiver.js plan --json | node -e \
  "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
   if(!Array.isArray(d.plan)||typeof d.total_hours!=='number') process.exit(1); \
   console.log('ok:', d.plan.length, 'slices')"

# 4. Diff limpio — solo los dos archivos esperados
git diff --stat HEAD
```

---

## Restricciones

- **No** toques `buildGraph`, `inferDependencies`, ni ninguna otra función.
- **No** agregues warnings ni logs para los deps descartados — el drop es silencioso.
- **No** edites ningún `slice.json` de specs antiguas.
- **No** cambies el comportamiento del nuevo formato `"depends_on"` con `spec/slice-id`.
- **Un solo commit.** Mensaje sugerido:

```
bugfix(QUIVER-01): ignore legacy bare spec deps in normalizeDependencyRef

Old slice.json files use "dependencies": ["quiver-vNN"] with bare spec names.
normalizeDependencyRef was expanding them to "spec-slug/quiver-vNN" which
doesn't match any slice, causing buildGraph to throw MISSING_DEPENDENCY.

Guard: values without '/' that don't start with 'slice-' are spec-level refs
already satisfied — return null so they are filtered before graph validation.
```
