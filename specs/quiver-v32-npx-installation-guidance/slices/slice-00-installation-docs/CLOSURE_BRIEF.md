# Closure Brief - slice-00-installation-docs

## Resumen de lo realizado

Se agregó documentación para explicar que `npx --yes create-quiver@latest` ejecuta Quiver desde la caché de npm y no instala el paquete dentro de `node_modules`. También se documentó cuándo conviene instalar `create-quiver` como `devDependency`.

## Validación contra criterios de aceptación

- README incluye explicación breve y link a la guía.
- `docs/getting-started/installation.md` explica `npx`, caché de npm, `node_modules` y `devDependency`.
- `docs/TROUBLESHOOTING.md` cubre la confusión de `node_modules`.
- Templates generados fueron alineados.
- `README_FOR_AI.md` fue actualizado como fuente de verdad.

## Cambios relevantes

- Public documentation now covers `npx` vs local install.
- Generated project templates inherit the key guidance.
- Spec package and PR body were created for traceability.

## Pendientes

- Abrir el PR.

## Riesgos remanentes

- Ninguno crítico. Esta spec no cambia comportamiento de producto.

## Recomendaciones futuras

- Consider adding `npx` cache behavior to `create-quiver --help` only if more users hit the same confusion.
