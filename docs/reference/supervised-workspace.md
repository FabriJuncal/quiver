# Aplicación supervisada en workspace temporal

La API experimental `reviewDevelopmentWorkspace(sourceRoot, request)` convierte
una propuesta Development válida en archivos reales dentro de una copia temporal
nueva. El módulo está en `src/create-quiver/lib/planning/supervised-workspace.js`.
No modifica el origen ni está conectado a un comando, proveedor o chat.

## Flujo del host

1. El host obtiene una tarea, contexto confiable y propuesta conforme a
   [la API pura](experimental-dry-run-planner.md).
2. Invoca la revisión con un directorio absoluto de origen autorizado y un objeto
   con exactamente `task`, `trusted_context` y `proposal_input`.
3. Presenta `session.review`: alcance, diff, hashes antes/después, pruebas
   propuestas y destino temporal. Esta fase lee archivos pero no escribe.
4. Llama a `session.execute(authorize)`. La función síncrona `authorize` pertenece
   al host confiable y recibe el manifiesto congelado. Solo después de verificar
   consentimiento y permisos actuales devuelve `{ approved: true, binding,
   approval_id }`, con el binding revisado y un identificador de aprobación.
5. El adaptador relee todos los inputs, exige los mismos bytes y crea un directorio
   temporal exclusivo. Devuelve `workspace`, `evidence` y `evidence_sha256`.

Una función que devuelve aprobación incondicional es una fixture, no autenticación
de producción. La tarea, su texto y los hashes no son autoridad. La autenticidad,
revocación y vigencia de política y consentimiento siguen siendo deber del host.
El binding incluye la raíz canónica del origen. La sesión se consume una sola vez,
incluso al denegar o fallar; una nueva revisión requiere nueva autorización.

## Límites y garantías acotadas

- Se reutiliza el controlador puro y se recalcula la propuesta; no se modifica
  `dry-run.js` ni se importan capacidades de IO desde el Core.
- Solo modificaciones de archivos existentes, UTF-8 válido, LF, sin NUL y con
  newline final (o archivo vacío). Contexto y posiciones del diff deben coincidir
  exactamente; no hay aplicación aproximada ni soporte de binarios/renombres.
- Hasta 1 MiB de inputs reales y 1 MiB de outputs agregados; se conservan los
  límites menores del contrato de propuesta. No se recorren archivos no declarados.
- Se rechazan symlinks/junctions en las rutas leídas, archivos con hardlinks,
  directorios como inputs, aliases Windows y hashes/tamaños falsos.
- La copia contiene únicamente outputs aprobados en `files/`; no es un clon
  ejecutable del proyecto ni contiene automáticamente sus dependencias.
- `evidence.json` registra identidad de tarea, aprobación, scope, hashes y lectura
  posterior de los bytes. Su digest detecta cambios respecto al digest retenido
  por el host; no es firma, atestación externa ni registro inmutable.
- No se ejecutan pruebas propuestas, código, shell, red ni modelos. La evidencia
  conserva `tests.status: not-performed`, criterios no verificados y
  `accepted: false`. `executed: true` significa solo aplicación en copia temporal.

Es un adaptador para un host cooperativo, no un sandbox contra procesos maliciosos
con acceso concurrente al filesystem o al proceso Node. Los chequeos de identidad
y hashes detectan cambios observados, pero no constituyen exclusión mutua frente
a reemplazos concurrentes de directorios. El host debe aislar y custodiar sus
raíces durante revisión/ejecución. No usarlo sobre fuentes compartidas adversarias.
El host conserva o elimina el directorio temporal devuelto; nunca debe promoverlo
automáticamente al origen.

## Validación reproducible

```bash
node --test tests/lib/planning-supervised-workspace.test.js tests/lib/planning-dry-run.test.js tests/lib/planning-development-proposal.test.js
```

Las pruebas usan archivos reales desechables, aplicación exacta y evidencia con
hash, además de rechazos por entradas cambiadas y autorización incorrecta.
No necesitan modelos, servicios, credenciales ni elevación administrativa.

## Brecha pendiente del MVP

Este incremento demuestra revisión, autorización del host y aplicación verificable
de una propuesta en una copia. Faltan ejecución de tests del proyecto en aislamiento
con límites, Research con fuentes/resultados verificables bajo el mismo Core y la
interacción chat-first. No declara terminado el MVP ni inicia Studio/Cloud/V59.
