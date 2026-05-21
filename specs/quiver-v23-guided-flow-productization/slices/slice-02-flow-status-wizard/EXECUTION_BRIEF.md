# EXECUTION BRIEF - slice-02: Flow status and next-step wizard

## Objetivo

Implementar un comando que muestre estado, bloqueos y proximo paso seguro.

## Alcance

- Leer estado de `.quiver/`, docs, approvals y specs.
- Reutilizar doctor/status existentes donde convenga.
- Imprimir salida breve y accionable.

## Criterios de aceptacion

- No falla con proyectos no inicializados.
- No llama proveedores.
- No escribe archivos salvo que una opcion futura lo pida explicitamente.
- Tiene tests por etapa relevante.

## Restricciones

- No resolver perfiles de agentes en esta slice.
- No crear specs ni ejecutar slices.

## Checklist de finalizacion

- [ ] Tests por estado.
- [ ] Docs actualizadas.
- [ ] Evidencia registrada.
