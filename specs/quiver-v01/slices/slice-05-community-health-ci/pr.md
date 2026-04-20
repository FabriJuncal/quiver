# PR - QUIVER-05 - Community Health + CI

## Titulo

chore: add community health files and GitHub Actions CI

## Resumen

Agrega los archivos mínimos de salud comunitaria OSS (CONTRIBUTING, CoC, SECURITY, CHANGELOG, ROADMAP) y un CI básico con shellcheck + validación JSON para los templates de slices.

## Alcance

- CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG, ROADMAP en raíz
- .github/ISSUE_TEMPLATE/ (bug + feature)
- .github/pull_request_template.md
- .github/workflows/ci.yml (shellcheck + JSON validation)

## Archivos

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/pull_request_template.md`
- `.github/workflows/ci.yml`

## Cómo Probar (DETALLADO - OBLIGATORIO)

### Entorno Requerido

- bash, node ≥14, git
- GitHub Actions (automático al hacer push)

### Acceso al Worktree

```bash
npm run start:slice -- specs/quiver-v01/slices/slice-05-community-health-ci/slice.json
```

### Levantar el Proyecto

```bash
# No aplica
```

### Casos de Uso

#### Caso 1: Verificar CI en GitHub Actions

1. Hacer push del branch a origin
2. Abrir GitHub → Actions
3. Verificar que el workflow `ci.yml` corre y pasa

**Resultado esperado:** CI verde con shellcheck y JSON validation pasando.

---

#### Caso 2: Verificar community health en GitHub

1. Abrir el repo en GitHub
2. Ir a Insights → Community Standards
3. Verificar que los indicadores están en verde

**Resultado esperado:** README, License, Contributing, CoC, Security policy — todos presentes.

---

### Verificación Técnica

```bash
npm run check:slice -- specs/quiver-v01/slices/slice-05-community-health-ci/slice.json --gate validation
npm run check:pr -- specs/quiver-v01/slices/slice-05-community-health-ci/slice.json
shellcheck scripts/*.sh
node -e "['specs/[project-name]/slices/slice-template/slice.json'].forEach(f => JSON.parse(require('fs').readFileSync(f,'utf8')))" && echo "templates valid"
```

## Evidencia

- [ ] Screenshot de GitHub Actions CI verde
- [ ] Screenshot de Community Standards en verde

## Rollback

1. `git revert <commit-hash>`
2. Verificar que CI workflow desaparece de Actions

## Riesgos / Notas

- CHANGELOG.md debe incluir entrada para v0.1.0 que liste los cambios de los 5 slices de este spec.
- CI con shellcheck puede fallar si hay warnings en scripts existentes — corregirlos en este mismo PR.
