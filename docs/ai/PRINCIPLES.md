# AI Principles

**Última actualización:** 2026-03-13  
**Próxima revisión:** 2026-04-13 (o cuando haya learnings mayores)

---

## Principios Fundamentales

Estos principios SON LEYES. No se negocian. Si hay conflicto entre principios, el orden de prioridad es: 1 → 2 → 3 → 4.

---

### 1. 🔐 Privacidad Primero

**Por qué:** El proyecto maneja datos de usuarios. La privacidad y seguridad son responsabilidad de todos.

**Reglas:**
- ❌ NUNCA loguear datos sensibles de usuarios
- ❌ NUNCA exponer API keys en logs o errores
- ❌ NUNCA commitear `.env`, `.env.local`, o cualquier archivo con secrets
- ✅ SIEMPRE usar variables de entorno para secrets
- ✅ SIEMPRE enmascarar datos sensibles en respuestas

**Ejemplo de violación:**
```typescript
// ❌ MAL
console.log('API key:', process.env.API_KEY);

// ✅ BIEN
console.log('API key:', '••••' + process.env.API_KEY?.slice(-4));
```

---

### 2. 🎯 Simple es Mejor

**Por qué:** Tiempo es limitado. Complejidad mata velocidad.

**Reglas:**
- ✅ Si hay 2 soluciones, elegir la más simple (que funcione)
- ❌ NO sobre-ingenierizar para casos hipotéticos ("¿y si escalamos?")
- ❌ NO agregar abstracciones "por si acaso"
- ✅ YAGNI (You Ain't Gonna Need It)
- ✅ MVP primero, perfección después

**Ejemplo:**
```typescript
// ❌ MAL (sobre-ingenierizado)
abstract class PriceCalculator {
  protected abstract calculateBasePrice(): number;
  // ... 5 clases hijas
}

// ✅ BIEN (simple)
export function calculatePrice(type: string, quantity: number): number {
  const rate = RATES[type] || RATES['default'];
  return quantity * rate;
}
```

---

### 3. 🧪 Tests Antes de Commit

**Por qué:** Sin tests, no hay forma de saber si algo funciona. Sin tests, el refactor da miedo.

**Reglas:**
- ✅ TODO cambio funcional tiene tests (E2E o unitarios)
- ✅ Tests fallan → NO commit
- ✅ Si no hay tests automáticos, testing manual obligatorio
- ✅ Capturar evidencia (screenshots, logs) en `test-results/`

**Excepciones:**
- Cambios de documentación pura
- Cambios de formato (whitespace, comments)

**Ejemplo de flujo:**
```bash
# 1. Hacer cambio
git add .

# 2. Correr tests
npm run test

# 3. Si pasan → commit
git commit -m "feat: implementación"

# 4. Si fallan → fix → volver a 2
```

---

### 4. 📚 Documentar Mientras Se Hace

**Por qué:** "Después documentamos" = "Nunca documentamos". Docs desactualizadas son peores que no docs.

**Reglas:**
- ✅ Si creás endpoint → docs de API se actualizan ANTES de merge
- ✅ Si cambiás comportamiento → spec se actualiza ANTES de merge
- ✅ Si agregás feature → INDEX.md se actualiza ANTES de merge
- ✅ Código es verdad, docs son aproximación (pero intentar que sean precisas)

**Checklist de documentación por feature:**
```markdown
- [ ] Endpoint documentado en `docs/api/[modulo]/README.md`
- [ ] Spec actualizado en `specs/[spec]/slices/[slice-id]/slice.json`
- [ ] INDEX.md actualizado (si hay nuevos archivos)
- [ ] `pr.md` actualizado en `specs/[spec]/slices/[slice-id]/` o `specs-fix/[spec]/slices/[slice-id]/`
```

---

## Principios Secundarios

### 5. 🔄 Iterar Sin Piedad

- Primera versión ≠ Versión final
- Si algo no funciona, arreglarlo (no parcharlo)
- Feedback de usuarios > Opinión del developer

### 6. 📖 Legibilidad > Inteligencia

- Código aburrido es mejor que código clever
- Si necesitás comentario para explicar, simplificá el código
- Seguir convenciones del proyecto (naming, estructura)

### 7. 🎯 Foco en MVP

- Si no es crítico para MVP → Fase 2
- 80% completo y lanzado > 100% completo y en dev
- Feedback real > Perfección teórica

---

## Cómo Usar Estos Principios

### Para IA/Developers:

1. **Al empezar tarea:** Leer principios relevantes
2. **Al tomar decisión:** Verificar que no viola principios
3. **Al revisar código:** Usar principios como checklist

### Para Reviewers:

1. **Antes de aprobar:** Verificar que PR no viola principios
2. **Si hay violación:** Rechazar PR con referencia al principio
3. **Si principio es ambiguo:** Actualizar principio para clarificar

---

## Historial de Cambios

| Fecha | Cambio | Razón |
|-------|--------|-------|
| 2026-03-13 | Creación inicial | Principios fundamentales |

---

**Fin del documento**

**Próximo:** Leer `.ai/RULES.yaml` para reglas específicas
