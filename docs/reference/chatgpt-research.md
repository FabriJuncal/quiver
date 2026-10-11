# Research local con Continuar con ChatGPT

Integracion experimental para el proyecto local open-source. El modo predeterminado
usa datos y respuestas ficticios; no conecta una cuenta ni consume inferencia.
La ruta real esta preparada, pero no se ha conectado ni validado contra una cuenta.
No agrega cuota al plan ni completa el MVP de Research autonomo.

## Demostracion sin conexion

Desde el checkout, con las dependencias instaladas:

```bash
node examples/chatgpt-research/run.cjs
```

Dos politicas ficticias de Delta v1 dicen 30 y 90 dias. La respuesta simulada cita
las lineas exactas y reconoce que faltan fechas y autoridad. El resultado indica
`inference: simulated`, `citation_integrity: verified`,
`semantic_verification: human-review-required` y `accepted: false`.
La verificacion mecanica no demuestra que una afirmacion este respaldada
semanticamente ni que dos textos sean realmente contradictorios.

## Conexion posterior, solamente por decision del usuario

```bash
node examples/chatgpt-research/run.cjs --live
```

Requiere una terminal interactiva y las confirmaciones CONNECT, seleccion de
cuenta/modelo, CREDITS OFF y SEND. No se ejecuta en CI. El programa muestra la URL
oficial para abrir manualmente en el navegador del sistema; no abre el navegador.
La conexion puede consumir permisos de la cuenta, pero la inferencia solo comienza
despues de revisar el corpus completo y confirmar su envio. Este ejemplo real
solo admite el corpus ficticio incluido; no carga archivos del proyecto.

El catalogo de modelos se consulta para la cuenta conectada: no se promete un
modelo concreto ni elegibilidad. Si se deniega permiso de uso del plan, no hay
inferencia. No hay fallback a API keys, otros proveedores, pagos o creditos.
Quiver pide desactivar los creditos de la app en
[ChatGPT Usage](https://chatgpt.com/settings/usage) y confirmar esa decision.
La API documentada no ofrece un parametro para imponer esa configuracion:
la confirmacion local no prueba el estado remoto ni garantiza coste cero.

## Arquitectura y limites

- El Core y `retrieveResearchCorpus` no cambian. La nueva capa usa su preflight,
  permisos, conjunto exacto de fuentes, hashes y presupuestos.
- `prepareChatGptResearch` conserva una copia del corpus y crea una revision
  vinculada al contenido, instrucciones, cuenta y modelo. Uso unico por revision.
- Envia solo texto a Responses: `input` es un array, `stream: true`, `store: false`.
  No Files, file_search, background, herramientas, shell, MCP ni agente general.
- Solo `response.completed` permite evaluar el informe. Un stream interrumpido,
  incompleto o fallido no produce resultado parcial aprobado.
- Cada cita comprueba fuente, SHA256, lineas y texto literal. Se exige cobertura
  de criterios e incertidumbre; las valoraciones del modelo siguen sin verificar.
- No se ejecuta ni renderiza HTML/Markdown del modelo. El host de ejemplo muestra JSON.

Limites locales: corpus heredado de hasta 64 KiB, una accion Research por solicitud,
payload de hasta 96 KiB, informe de hasta 32 KiB, stream de hasta 1 MiB,
una inferencia simultanea, tres intentos por proceso y 60 segundos por inferencia.
Los intentos fallidos tambien cuentan. No hay reintentos automaticos de inferencia,
refresh, intercambio OAuth ni cambio de cuenta para superar limites. El usuario
puede reintentar manualmente un fallo transitorio con una revision nueva.
Un error de cuota detiene nuevas solicitudes de esa sesion. El codigo de error
no permite inferir saldo total ni fecha de reinicio.

Estos son limites de aplicacion, no topes garantizados de tokens o dinero. La ruta
preview no admite `max_output_tokens`; cancelar la recepcion no garantiza detener
instantaneamente el trabajo remoto ni recuperar uso ya consumido. Los limites
persistentes del plan/app se gestionan en ChatGPT.

## Identidad y credenciales

OAuth usa state/nonce aleatorios, PKCE S256, callback exclusivo en 127.0.0.1 y
validacion RS256 del ID token mediante `jose` (biblioteca recomendada por el ejemplo
OIDC oficial). Emisor, audiencia, nonce, expiracion y cuenta deben coincidir.
El callback usa el mismo URI en autorizacion e intercambio; rechaza host, estado,
parametros duplicados, reutilizacion y client ID incompatibles.

Tokens solo en memoria privada del proceso. No se leen credenciales existentes de
Codex ni variables API key; no se escriben tokens en disco, entorno, URLs,
salida del navegador, informes o logs. Las URLs de autorizacion omiten id_token_hint.
Se refrescan credenciales en serie por registro y se conserva la ultima rotacion.
Cerrar sesion aborta peticiones, elimina tokens y trata de revocar la sesion remota.
Si falla, informa `remote_revocation: unconfirmed`; el usuario puede desconectar
Quiver desde ChatGPT. No se promete revocacion cuando no fue confirmada.

El ejemplo guarda exclusivamente host ID y registros publicos
`issuer/subject/client_id` en `~/.quiver-chatgpt-registrations.json`, despues del
consentimiento local. Cada registro es separado; el email no es una clave de cuenta.
El archivo no contiene tokens. Volver a ejecutar requiere autorizar una sesion;
no hay credenciales persistentes ni recuperacion automatica tras reiniciar.
Este incremento requiere un unico proceso local y un host confiable. No proporciona
aislamiento frente a otro proceso malicioso del mismo usuario.

## Validacion y fuentes oficiales

Las pruebas usan dobles para OAuth, modelos y Responses; la prueba JWT usa claves
efimeras ficticias. Callback local real, sin contacto con OpenAI. Ningun test hace
inferencia remota ni crea una cuenta. No hay prueba de elegibilidad o de cuota real.
El repositorio es CommonJS sin gate de TypeScript ni compilacion de aplicacion;
se validan sintaxis Node, pruebas, documentacion, contrato de slice y paquete.

Contrato consultado el 2026-10-10:

- [Registro y sign-in](https://developers.openai.com/siwc/token-sharing-open-source/sign-in)
- [Limitaciones preview](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations)
- [Modelos e inferencia](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference)
- [Cuentas y sesiones](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions)
- [Errores y recuperacion](https://developers.openai.com/siwc/token-sharing-open-source/errors-and-recovery)

Cambios futuros del contrato requieren revalidacion. No se usan endpoints backend-api.
