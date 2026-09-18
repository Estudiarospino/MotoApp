# Plan de diseño — rediseño visual de MotoApp

> Documento de referencia para el rediseño. Complementa `docs/PROYECTO.md` (que cubre negocio y arquitectura). Última actualización: 2026-09-18.

## Diagnóstico del estado actual

Evaluado en vivo (capturas de pantalla desktop + mobile con datos reales) sobre lo construido en las Fases 0-6. Hallazgos concretos, no genéricos:

1. **Sin dirección visual.** La paleta en `globals.css` es el tema "neutral" de shadcn sin tocar: todos los tokens de color (`--primary`, `--accent`, `--chart-*`, etc.) tienen **chroma 0** en oklch — literalmente escala de grises, sin un solo color de marca. `--font-sans: var(--font-sans)` es además una referencia circular (bug del scaffold), así que la tipografía no está realmente usando Geist como debería.
2. **Cero jerarquía visual.** En la vista de contrato, el saldo de capital pendiente ($5.500.000) y la mora acumulada ($150.000 — ¡dinero atrasado!) se ven exactamente igual que un label secundario como "Fecha de inicio". No hay nada que le diga al dueño "este contrato necesita atención" de un vistazo.
3. **Componentes reutilizables existentes pero ignorados.** Hay un componente `Card` (`src/components/ui/card.tsx`) bien construido (ring, radius, spacing) que nunca se usa — cada pantalla que yo construí improvisó su propio `<div className="border border-zinc-200 rounded-lg">`. Eso genera inconsistencia y trabajo duplicado.
4. **`Badge` sin variantes semánticas.** Solo existen `default/secondary/destructive/outline/ghost/link`. No hay un verde "al día" ni un ámbar "en mora" — así que el estado de un contrato (lo más importante del negocio) no tiene código de color.
5. **Mobile roto, no solo "apretado".** Capturé `/contratos/[id]` a 390px: el nav superior se desborda y corta "Cerrar sesión"; la tabla de "Historial de periodos" pierde las columnas Abono capital, Mora nueva, Saldo nuevo y Recibo — exactamente los datos financieros que el dueño necesita — sin ningún indicio visual de que hay scroll horizontal.
6. **Dashboard vacío.** `/` es un placeholder de una línea ("se construye en una fase posterior"), la primera pantalla que ve el usuario cada vez que entra.
7. **La pantalla más importante no está diseñada como panel de estado.** Hoy `/contratos/[id]` es una secuencia lineal de bloques (resumen → periodo abierto → historial → gastos/préstamos → formulario de edición) que obliga a leer todo de arriba a abajo. No hay una respuesta visual inmediata a la pregunta que el dueño hace constantemente: *"¿cómo está este contrato?"*
8. **Iconografía sin usar.** `lucide-react` está instalado (lo usa el `Select`) pero ninguna pantalla lo aprovecha para acelerar el escaneo visual (estado, categorías de gasto, acciones).

Capturas de referencia guardadas en el entorno de esta sesión (`before/*.png`): dashboard, clientes, motos, moto-detalle, contratos, **contrato-detalle** (desktop y mobile), gastos, préstamos.

## Dirección visual propuesta

Es una herramienta financiera interna, de uso diario, por una sola persona, en escritorio y celular. No es marketing ni un SaaS con usuarios externos. Prioridad: **claridad y velocidad de lectura sobre estética decorativa** (alineado con la filosofía "premium = deliberado, no excesivo" de la skill).

- **Base neutra + un color de marca + colores semánticos de estado.** Mantener fondo/superficie neutros (buena legibilidad para cifras en pesos), pero:
  - Un **primary** con algo de saturación (propuesta: azul-índigo, transmite confianza financiera sin ser genérico "SaaS azul brillante" — a definir en la implementación con 2-3 opciones para que el usuario elija).
  - **success** (verde) = al día / pagado / disponible.
  - **warning** (ámbar) = mora acumulada / periodo abierto hace mucho.
  - **destructive** (ya existe, rojo) = incumplido / eliminar.
  - **info** (azul suave) = compra anticipada / notas.
- **Tipografía:** arreglar el token circular, usar Geist para texto general y **tabular numbers** para todas las cifras en pesos (para que columnas de montos alineen visualmente — detalle "financiero" que se nota).
- **Densidad:** esta es una app operativa de datos, no un landing — densidad media-alta está bien, pero agrupada con `Card` y espaciado consistente, no tablas desnudas flotando en blanco.

## Fundamentos a construir primero (una sola vez, benefician todas las pantallas)

1. Tokens de color reales en `globals.css` (`:root` y `.dark`) — primary + success/warning/info añadidos al sistema existente de shadcn.
2. Arreglar la tipografía (Geist correctamente enlazado, escala de tamaños consistente, tabular-nums para dinero).
3. `Badge`: agregar variantes `success` / `warning` / `info`.
4. Adoptar `Card` como contenedor estándar en vez de `border border-zinc-200` repetido a mano.
5. Un componente `StatCard` / bloque de métrica reutilizable (para saldo, mora, dashboard, listas).
6. Nav responsive real (hoy se desborda en mobile) — probablemente colapsar a un menú o barra inferior en mobile.
7. Patrón mobile para tablas densas: en vez de que `<Table>` pierda columnas, usar tarjetas apiladas por fila en mobile (breakpoint) para las tablas financieras críticas (historial de periodos, pagos).

## Plan por pantalla, priorizado

### P0 — Detalle de contrato (`/contratos/[id]`) — la pantalla ancla

Es la que pediste explícitamente: **todo el estado del contrato en una vista**. Propuesta de estructura:

- **Header de estado:** folio + cliente + moto + badge de estado grande, con color semántico (verde ACTIVO al día, ámbar ACTIVO con mora, rojo INCUMPLIDO, azul FINALIZADO).
- **Panel de "semáforo" arriba de todo:** 3-4 métricas clave en `Card`/`StatCard` con jerarquía tipográfica fuerte — Saldo de capital (el número más grande de la pantalla), Mora acumulada (en ámbar/rojo si > 0, en verde/neutro si es $0), Progreso del periodo abierto (cobrado vs meta, con barra de progreso, no solo texto), días desde que se abrió el periodo (con alerta visual si supera el umbral de "hace mucho").
- **Acciones agrupadas por severidad**, no en fila plana: "Cerrar periodo" como acción primaria destacada; "Compra anticipada" secundaria; "Marcar incumplimiento" con más fricción visual (quizás requiere confirmación en dos pasos, ya tiene `confirm()` pero visualmente debe distinguirse más).
- **Historial, gastos y préstamos:** posiblemente como pestañas (`Tabs`) o secciones colapsables en vez de tres tablas apiladas una tras otra — reduce el scroll y deja "arriba" siempre el estado actual.
- **Mobile:** el panel de semáforo y las acciones se mantienen arriba (lo crítico primero); el historial pasa a tarjetas apiladas, no tabla con columnas perdidas.

### P0 — Dashboard (`/`)

Hoy es un placeholder. Con los datos ya disponibles (sin esperar la Fase 8 completa) se puede construir un dashboard real: contratos activos vs total, mora total de cartera, contratos con periodo abierto hace más de N días (la alerta que el negocio pidió explícitamente en `docs/PROYECTO.md`), motos disponibles vs en contrato. Esto adelanta parte de la Fase 8 de forma natural durante el rediseño — lo dejo como pregunta abierta para vos: ¿lo adelantamos ahora o dejamos el dashboard "bien diseñado pero mínimo" y la lógica completa se implementa en su fase?

### P1 — Listas (`/contratos`, `/clientes`, `/motos`, `/gastos`, `/prestamos`)

Mismo lenguaje visual: badges de estado con color semántico, mini-resumen arriba de la lista cuando aporte (ej. "3 contratos activos, 1 en mora"), mejor uso del ancho disponible (hoy el contenido queda pegado a la izquierda con la mitad de la pantalla vacía).

### P1 — Formularios (crear/editar contrato, cliente, moto, pago, gasto, préstamo)

Agrupar visualmente campos "operativos" (los que alimentan el motor de cierre) vs "informativos" (meta estimada, cuota diaria) — hoy se ven idénticos y esa distinción es justo la que el negocio pidió cuidar (confusión histórica del campo "Arriendo mensual").

### P2 — Navegación global y login

Con 6 secciones el nav de texto plano ya no escala bien, y se rompe en mobile. Evaluar sidebar (mejor para 6+ secciones) o un nav mobile propio. Login: primera impresión de marca, hoy es un formulario sin identidad.

## Cómo lo abordaría

1. Construir los fundamentos (tokens, `Badge` semántico, `StatCard`, adoptar `Card`).
2. Rediseñar **contrato-detalle** como pantalla ancla — te la muestro, ajustamos dirección visual con tu feedback antes de replicar el patrón.
3. Propagar el mismo lenguaje a listas y formularios.
4. Dashboard y nav global al final, ya con el lenguaje visual validado.

Datos de prueba realistas (2 clientes, 3 motos, 1 contrato con historial de 2 periodos cerrados + uno abierto, un gasto y un préstamo) quedaron sembrados en `mt_dev` para poder comparar antes/después con la misma información.
