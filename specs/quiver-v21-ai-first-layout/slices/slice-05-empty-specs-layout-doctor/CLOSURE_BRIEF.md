# CLOSURE BRIEF - slice-05: Empty specs and layout doctor

## Resumen de lo realizado

Se adapto `doctor` para aceptar proyectos sin specs despues del init AI-first y reportar el estado de layout como `new`, `legacy`, `hybrid` o `incomplete`. `plan`, `graph` y `next` ya devolvian estados vacios validos, y se agrego cobertura para asegurar ese comportamiento junto con el nuevo doctor.

## Validacion contra criterios de aceptacion

- [x] No-spec soportado.
- [x] Layout nuevo detectado.
- [x] Layout legacy detectado.
- [x] Proyectos con specs no regresan.

## Cambios relevantes

- `doctor` ya no exige exactamente un spec generado.
- `doctor` muestra layout, specs detectadas, senales legacy y recomendaciones accionables.
- Se agrego `collectLayoutReport()` y `collectDoctorReport()` para separar deteccion de layout de presentacion CLI.
- Los wrappers legacy solo se validan como ejecutables si existen.
- Se agregaron tests para layouts nuevo sin specs, minimal, legacy, hybrid e incomplete.

## Pendientes

No quedan pendientes dentro de este slice. La limpieza/migracion no destructiva de assets legacy corresponde a `slice-06`.

## Riesgos remanentes

Los mensajes de doctor cambiaron; smokes que esperaban texto exacto del layout viejo deben alinearse en `slice-06`/`slice-08`.

## Recomendaciones futuras

Mantener `doctor` como reporte de estado y recomendaciones; no convertir senales legacy en errores duros salvo que falte un archivo necesario para ejecutar un comando pedido.
