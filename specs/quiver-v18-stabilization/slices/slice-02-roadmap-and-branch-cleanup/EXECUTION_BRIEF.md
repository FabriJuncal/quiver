# EXECUTION BRIEF — slice-02: ROADMAP v0.6 y limpieza de branches

**Spec:** quiver-v18-stabilization
**Slice:** slice-02-roadmap-and-branch-cleanup
**Estimated time:** 20 min
**Branch:** `docs/QUIVER-02-close-v06-roadmap` from `main`

---

## Contexto

Dos fuentes de ruido a eliminar:

1. `ROADMAP.md` tiene `## v0.6 (unreleased)` aunque su scope (Node-native runtime, `quiver:*` scripts) fue absorbido y publicado en v0.7. Es una entrada engañosa.
2. El repo tiene ~35 branches locales que son backup artifacts o branches de PRs ya mergeados a main. No bloquean nada, pero añaden ruido a `git branch`.

**La limpieza de branches es local y no produce commit.** El único artefacto que va al PR es el cambio en `ROADMAP.md`.

---

## Parte A — Limpieza de branches (local, sin commit)

### Paso 1: Listar branches ya merged a main

```bash
git branch --merged main
```

Deberías ver una lista larga. Anotá mentalmente las excepciones que NO debes borrar:
- `main`
- `develop`
- `drafts/v19-v22-orchestration-followups`

Todo lo demás en esa lista es candidato a eliminar.

### Paso 2: Verificar que no hay trabajo no mergeado en esas branches

```bash
git branch --no-merged main
```

Si aparece algo inesperado que no sean las tres excepciones de arriba, revisalo antes de borrar. Si hay dudas, no borrés esa branch.

### Paso 3: Borrar branches mergeadas (una por una o en lote)

```bash
# Borra todas las merged excepto main/develop/drafts de un golpe:
git branch --merged main \
  | grep -vE "^\*|^  main$|^  develop$|^  drafts/" \
  | xargs git branch -d
```

### Paso 4: Borrar las dos branches de backup explícitamente

```bash
git branch -d backup/main-before-reconcile-20260512-094512
git branch -d backup/main-before-reconcile-20260512-094712
```

### Paso 5: Verificar

```bash
git branch | wc -l   # debería ser significativamente menor que 35
git branch | grep backup   # debe retornar vacío
```

---

## Parte B — ROADMAP.md (sí va al PR)

### El único cambio

En `ROADMAP.md`, localizá la sección:

```markdown
## v0.6 (unreleased)

- Cross-platform CI matrix (macOS, Linux, Windows) for Node-native runtime
- Node-native generated project npm scripts (`quiver:*`)
- Additive migration support for existing projects
```

Reemplazá el encabezado y agregá la nota:

```markdown
## v0.6 (shipped)

> Scope absorbed into v0.7. Node-native runtime and `quiver:*` npm scripts
> landed together with the token-efficient context pack work.

- Cross-platform CI matrix (macOS, Linux, Windows) for Node-native runtime
- Node-native generated project npm scripts (`quiver:*`)
- Additive migration support for existing projects
```

Nada más. No toques ninguna otra sección.

---

## Commit y PR

```bash
git add ROADMAP.md
git commit -m "docs(QUIVER-02): close v0.6 as shipped in ROADMAP"
git push origin docs/QUIVER-02-close-v06-roadmap
```

Abrí el PR con `gh pr create` apuntando a `main`. El body del PR documenta ambas partes (aunque la limpieza de branches no tiene diff, mencionala en el Summary para trazabilidad).

---

## Restricciones

- **No** toques ninguna otra sección de ROADMAP.md.
- **No** borres branches en origin — solo local.
- **No** borres `drafts/v19-v22-orchestration-followups` ni `develop` ni `main`.
- **No** agregues nada a CHANGELOG.md — este cambio no es una feature.
- El diff del PR debe mostrar solo `ROADMAP.md`.
