# EXECUTION BRIEF — slice-03: Publicar rama de drafts

**Spec:** quiver-v18-stabilization
**Slice:** slice-03-publish-drafts-branch
**Estimated time:** 5 min
**Sin PR** — es un `git push` directo de una rama de referencia.

---

## ⛔ Gate obligatoria — leer antes de ejecutar cualquier cosa

Este slice está **bloqueado** hasta que el mantenedor confirme explícitamente:

1. Usé `quiver:plan`, `quiver:graph`, y `quiver:next` en al menos un ciclo real de trabajo.
2. Registré una observación en `specs/quiver-v18-slice-orchestration/EVIDENCE_REPORT.md`.
3. Confirmo que el checkpoint de v18 pasó.

**Si esa confirmación no está en el prompt que te delega este slice, abortá y pedila.**

---

## Contexto

La rama `drafts/v19-v22-orchestration-followups` existe solo localmente. Contiene 23 archivos (4 specs: v19–v22) en un único commit. ROADMAP.md y BACKLOG.md ya hacen referencia a esta rama por nombre. Publicarla en origin completa la cadena de trazabilidad y protege el trabajo ante pérdida local.

No es una rama candidata a merge. Es una rama de referencia que vive indefinidamente hasta que alguna de las specs se promueva formalmente.

---

## Verificación previa

```bash
# 1. Confirmar que la rama existe y tiene el commit correcto
git log drafts/v19-v22-orchestration-followups --oneline -1
# Esperás: 13eab96 docs(drafts): park v19-v22 spec drafts pending v18 checkpoint

# 2. Confirmar que NO existe ya en origin
git ls-remote origin drafts/v19-v22-orchestration-followups
# Esperás: salida vacía (si retorna algo, la rama ya fue publicada — slice completado)
```

---

## Ejecución

```bash
GIT_SSH_COMMAND="ssh -i ~/ssh/github-personal" \
  git push origin drafts/v19-v22-orchestration-followups
```

---

## Verificación post-push

```bash
# Confirmar que el SHA remoto coincide con el local
LOCAL_SHA=$(git rev-parse drafts/v19-v22-orchestration-followups)
REMOTE_SHA=$(git ls-remote origin drafts/v19-v22-orchestration-followups | awk '{print $1}')

echo "Local:  $LOCAL_SHA"
echo "Remote: $REMOTE_SHA"

[ "$LOCAL_SHA" = "$REMOTE_SHA" ] && echo "OK" || echo "MISMATCH — investigar"
```

---

## Restricciones

- **No** abras un PR para esta rama.
- **No** hagas `--force` en ninguna circunstancia.
- **No** edites ningún archivo en la rama antes de publicarla.
- **No** ejecutes este slice si el gate no fue confirmado explícitamente.
