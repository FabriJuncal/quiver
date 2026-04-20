# Quiver v0.1 — OSS Foundation

**Fecha:** 2026-04-20
**Estado:** En ejecución

---

## Objetivo

Llevar quiver al estado mínimo publicable como framework OSS: legal claro, quickstart ejecutable, documentación en inglés, un ejemplo funcional y community health básico.

---

## Alcance

### Incluye

- ✅ LICENSE MIT
- ✅ Fixes de referencias rotas y archivos huérfanos
- ✅ `package.template.json` con scripts npm cableados
- ✅ Traducción a inglés como idioma canónico
- ✅ `examples/01-basic-slice/` end-to-end
- ✅ CONTRIBUTING, CoC, SECURITY, CHANGELOG, ROADMAP, `.github/`, CI (shellcheck + JSON validation)

### Excluye

- ❌ CLI (`npx create-quiver`) — v0.2+
- ❌ Docs site (Docusaurus) — v0.2+
- ❌ JSON Schema para slice.json — v0.2+
- ❌ Test suite bats — v0.2+
- ❌ Branding/logo — v0.2+

---

## Slices

| Slice | Título | Estado | Spec |
|-------|--------|--------|------|
| **01** | Legal + Integrity | ⏳ Pendiente | [slice-01](./slices/slice-01-legal-integrity/slice.json) |
| **02** | Executable Quickstart | ⏳ Pendiente | [slice-02](./slices/slice-02-executable-quickstart/slice.json) |
| **03** | English Canonical | ⏳ Pendiente | [slice-03](./slices/slice-03-english-canonical/slice.json) |
| **04** | First Working Example | ⏳ Pendiente | [slice-04](./slices/slice-04-first-example/slice.json) |
| **05** | Community Health + CI | ⏳ Pendiente | [slice-05](./slices/slice-05-community-health-ci/slice.json) |

---

## Definition of Done

- [ ] Todos los slices en `status: completed`
- [ ] `EVIDENCE_REPORT.md` con evidencia de cada slice
- [ ] Sin slices en `blocked` o `in_progress`
- [ ] Repo listo para cambiar visibilidad a público en GitHub

---

**Fin del SPEC**
