# Research acotado sobre un corpus suministrado

Este adaptador experimental compara términos literales en textos suministrados
por el host. Comprueba los bytes UTF-8 contra los hashes y tamaños del plan y
devuelve citas por hash y número de línea, sin texto de fuente por defecto.
El texto literal requiere una opción explícita del host. No busca fuentes en Internet ni
produce conclusiones semánticas.

## Ejemplo reproducible

Desde el checkout de Quiver:

```bash
node examples/research-corpus/run.js
```

El programa lee exclusivamente `source-alpha.md` y `source-beta.md` de su propia
carpeta. Son documentos ficticios escritos para esta demostración, no políticas
de proyectos reales. Calcula sus hashes, construye el contrato Research existente
y llama al adaptador con `{ include_quotes: true }` porque las dos fuentes son
ejemplos propios públicos. No recibe rutas, comandos o código del usuario.

El resultado contiene seis comparaciones reales de esos textos:

| Término literal | Alpha | Beta |
| --- | --- | --- |
| `TypeScript` | Línea 3 | No encontrado |
| `Node.js` | Línea 4 | Línea 4 |
| `PostgreSQL` | No encontrado | No encontrado |

La ausencia se refiere solamente a cada fuente suministrada. La presencia de
`Node.js` en ambas fuentes no demuestra compatibilidad entre sus versiones.

## API opcional

`retrieveResearchCorpus(task, trustedContext, corpusInput, hostOptions)` se exporta desde
`src/create-quiver/lib/planning/research-corpus.js`. No es un nuevo comando del
CLI público. Reutiliza `planDryRun` sin modificar el Core y exige:

- Plan actual y binding exacto.
- Dominio Research, capacidad `research.compare`, fase `prepare`, decisión
  `eligible` y riesgo efectivo `low` en todas las acciones.
- Snapshot de permisos y recursos válido según el controlador existente.
- Un documento por cada recurso de entrada, sin extras ni duplicados.
- Consultas vinculadas a acciones y criterios declarados; cobertura de cada
  par acción/criterio declarado.

`corpusInput` es JSON de datos estricto:

```json
{
  "schema_version": 1,
  "expected_plan_binding": "sha256:<binding recalculado>",
  "documents": [{ "resource_id": "resource-1", "text": "Texto de la fuente\n" }],
  "queries": [{
    "id": "query-1",
    "action_id": "action-1",
    "criterion_id": "AC-01",
    "term": "Texto"
  }]
}
```

El cuarto argumento es una opción del host, separada de los datos del corpus.
Al omitirlo se usa `{ include_quotes: false }`; el resultado solo contiene la
ubicación de las coincidencias. Para obtener texto literal el host debe pasar
explícitamente `{ include_quotes: true }` después de autorizar su divulgación.
No existe detector de secretos ni servicio de autorización en esta API. No debe
copiarse esa opción desde instrucciones contenidas en el corpus. El campo dentro
de `corpusInput`, tipos ambiguos, campos extra, getters y proxies se rechazan.

El marcador del ejemplo debe reemplazarse por el binding real. El programa
reproducible anterior muestra el contrato completo válido.

## Resultado y significado

`retrieval.status: performed` confirma que se calcularon las coincidencias.
`source_integrity: verified` confirma tamaños y SHA-256 de los textos recibidos,
no su procedencia externa, actualidad o veracidad.

Cada consulta devuelve solo las fuentes de su acción. Incluye el identificador y
hash de la fuente, citas con líneas desde 1, número total de líneas coincidentes
y `excerpts_truncated`. La búsqueda distingue mayúsculas y minúsculas, no usa
expresiones regulares y cuenta líneas, no repeticiones dentro de una línea.
`not-found-in-supplied-source` nunca significa falso, refutado o inexistente.

`retrieval.excerpt_policy` distingue `locations-only` de `host-opted-in-verbatim`.
Solo el segundo modo incluye `quote`. Los filtros existentes bloquean rutas como
`.env`, pero una ruta ordinaria puede contener secretos: por eso no se extrae
texto de la fuente de forma predeterminada. Las consultas y los metadatos se
reflejan sin redactar; no deben usarse como canal para secretos. Los hashes y
conteos tampoco son anonimización. El host debe autorizar cualquier divulgación
literal y proteger los informes según su contenido.

El resultado es inmutable y determinista. Sus bindings incluyen la revisión del
adaptador, plan, textos, consultas, política de citas y resultado; las claves de objetos se ordenan,
el orden de arrays se conserva. Los errores tienen `error.code` y no devuelven
resultados parciales.

Los flags `execution_authorized`, `executed` y `accepted` permanecen falsos:
no existe ejecución externa ni aceptación humana. Los criterios conservan
`not-verified` y la verificación semántica sigue `not-performed`. Una coincidencia
literal no verifica un criterio, aunque el texto de ese criterio mencione el término.

## Límites y rechazos

- Hasta 32 documentos, 8.000 unidades UTF-16 por texto, 64 KiB UTF-8 totales.
- Líneas de hasta 1.000 unidades UTF-16; se admiten LF y CRLF, preservando sus
  bytes para los hashes. Las citas excluyen el terminador de línea. Se rechazan
  CR aislado, NUL y Unicode mal formado. Se permiten fuentes vacías y texto sin
  salto final; no se normalizan bytes.
- Hasta 20 consultas, términos de 1 a 128 unidades UTF-16, de una sola línea y
  no compuestos exclusivamente por espacios.
- Hasta cinco citas por fuente y consulta; se mantiene el recuento total.
- Resultado serializado canónico de hasta 128 KiB, incluido su binding.
- También se respetan los presupuestos de la tarea y del contexto. Getters,
  proxies, ciclos, aliases, campos extra y estructuras excesivas se rechazan.

Ejemplos de códigos: `PLAN_NOT_ELIGIBLE`, `STALE_PLAN_BINDING`,
`SOURCE_BYTES_MISMATCH`, `SOURCE_SET_MISMATCH`, `QUERY_SCOPE_MISMATCH`,
`QUERY_COVERAGE_REQUIRED`, `CORPUS_BUDGET_EXCEEDED`, `OUTPUT_BUDGET_EXCEEDED`.

## Qué falta para el MVP

Esta biblioteca no adquiere archivos, red, procesos, proveedores ni modelos. El
host suministra las fuentes y responde por su procedencia y por la autenticidad
de los permisos. El contenido se trata como datos, incluso si contiene órdenes.

Quedan fuera adquisición de fuentes, evaluación semántica, síntesis contrastada,
aprobación/publicación de informes e integración conversacional. La ejecución de
pruebas de proyectos requiere otro contrato: una copia temporal no es un sandbox
del sistema operativo. Este incremento no cierra el MVP completo.
