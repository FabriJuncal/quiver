# Cambio, pruebas reales y evidencia en una app controlada

Esta demo agrega búsqueda por nombre al catálogo propio de Quiver. Reutiliza
el [adaptador supervisado](supervised-workspace.md), aplica el parche en una
copia y ejecuta seis comprobaciones fijas del host. No ejecuta repositorios
arbitrarios ni interpreta comandos incluidos en una propuesta.

Desde un checkout con las dependencias existentes:

    node examples/development-verification/run.cjs search
    node examples/development-verification/run.cjs wrong

El primer comando termina con exit 0: antes fallan búsqueda por nombre y ausencia
de resultados; después pasan las seis pruebas. El segundo termina con exit 1:
el parche incorrecto busca por ID y la prueba de búsqueda por nombre falla.
Las tres regresiones verifican listado, búsqueda por ID y copias defensivas.
La búsqueda nueva ignora mayúsculas y espacios exteriores, acepta coincidencias
parciales y devuelve todos los elementos para una consulta vacía.

El JSON devuelve los resultados y la ruta absoluta de verification.json en
una carpeta temporal nueva. Los comandos conservan esa evidencia para inspección.
reviewDemo() permite al host conservar la sesión y llamar a dispose() para
eliminar exclusivamente los directorios que creó; nunca el origen.

## Revisión y autorización

reviewDemo({ variant, timeoutMs, sourceRoot }) acepta solo las variantes
conocidas search y wrong. El origen opcional debe contener los bytes exactos
del catálogo propio; no habilita código externo. Los hashes del catálogo, de
ambas variantes y del ejecutor de pruebas están fijados en el host.

La revisión prepara copias temporales de la versión original y las pruebas,
sin ejecutar procesos ni modificar el origen. El manifiesto incluye el parche
completo y el binding del adaptador existente, hashes de aplicación y pruebas,
IDs de criterios, comandos exactos, runtime, entorno reducido y límites.
session.execute(authorize, { signal }) exige aprobación síncrona del host
con ese binding y un identificador. Cada sesión se consume una sola vez.

El comando de ejemplo proporciona consentimiento de fixture explícito al
seleccionar una variante conocida. Esa función no autentica personas ni
constituye un servicio de aprobaciones para producción.

Las pruebas residen fuera del parche. El proceso hijo usa el Node actual con
argumentos fijos, sin shell, sin heredar NODE_OPTIONS, PATH o credenciales.
En Windows solo conserva SystemRoot. El límite de tiempo es por proceso,
entre 1 y 30000 ms (5000 por defecto); la salida combinada se limita a 64 KiB.

## Evidencia y límites

Se revisan nuevamente los bytes antes de ejecutar y entre las dos ejecuciones.
La evidencia registra aprobación, hashes, comando, entorno, versión de Node,
plataforma, duración, códigos de salida y cada resultado. Solo el patrón de
fallos esperado en el original permite ejecutar la versión modificada.
Timeout, cancelación, error de proceso y resultados incompletos no verifican
éxito. La aceptación humana permanece false, incluso cuando pasan las pruebas.
El registro de aplicación original conserva tests.status: not-performed;
el nuevo registro añade la verificación realizada por este host separado.

Los resultados prueban únicamente los criterios del catálogo controlado; no
demuestran corrección general del software. Los hashes no son firmas y la
evidencia local no es un registro inmutable. Contiene rutas absolutas locales.
La comprobación del origen detecta cambios observados, sin atribuir su autor.

Una carpeta temporal no es un sandbox del sistema operativo. El host y sus
archivos deben permanecer bajo control exclusivo durante la ejecución:
los chequeos de rutas/hashes no cierran carreras adversariales con otros
procesos del mismo usuario. La cancelación termina el hijo directo y espera
su cierre; no administra descendientes. Estos fixtures no crean descendientes,
usan red ni acceden a secretos. No ampliar la lista de hashes a código ajeno.

No se modifican Core, el adaptador supervisado, Research, dependencias o CLI.
Chat, generación de cambios por IA y ejecución aislada de proyectos arbitrarios
siguen pendientes. Esta demo no declara terminado el MVP.
