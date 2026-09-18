# Sistema de gestión de arrendamiento de motos con opción de compra

> Documento de referencia del proyecto: contexto de negocio, reglas confirmadas, arquitectura técnica y plan de implementación. Última actualización: 2026-09-15.

## Contexto

El usuario tiene un negocio de arrendamiento de motocicletas con opción de compra (rent-to-own) en Colombia. Actualmente controla contratos, pagos, gastos y préstamos de forma manual/informal. Necesita un sistema propio porque ninguna herramienta genérica (ERP, contabilidad, software de talleres) modela su regla de negocio central: cada pago recibido se reparte automáticamente entre arriendo y abono a capital de la moto, el mes se cierra manualmente generando un recibo inmutable, y el saldo de la moto se va reduciendo hasta que el contrato termina (pagado en su totalidad, comprado de contado, o recuperado por incumplimiento).

Es un proyecto **100% nuevo**. El usuario decidió construirlo a la medida en vez de adaptar software existente, precisamente para poder modelar bien esta regla y tener visibilidad clara del estado de cada contrato.

Las decisiones de negocio y producto listadas abajo son firmes (confirmadas explícitamente por el usuario); los puntos marcados como "supuesto" al final son razonables pero quedan abiertos a ajuste durante la implementación.

## Decisiones de producto (confirmadas)

- **Plataforma**: aplicación web (uso desde navegador, PC y celular, sin instalación).
- **Hosting**: servidor propio (Linux, sin Docker instalado todavía — se instala como parte del despliegue).
- **Usuarios**: un solo usuario (el dueño) por ahora. El diseño no debe cerrar la puerta a agregar roles más adelante.
- **Facturación**: recibo/estado de cuenta interno en PDF, **sin validez fiscal** (no se integra con la DIAN).
- **Escala**: decenas de motos/contratos activos, no cientos. La arquitectura debe ser sólida y mantenible por una sola persona, sin infraestructura sobredimensionada (nada de microservicios/Kubernetes/colas).
- **Stack**: Node.js / TypeScript, elegido por el usuario.

## Modelo de negocio (confirmado)

### Entidades
Cliente, Motocicleta, Contrato (une 1 cliente + 1 moto), Pago, PeriodoCierre (el "recibo"), Gasto, Préstamo (+ sus abonos), Documento (adjuntos).

### El campo "Arriendo mensual" del contrato original es ambiguo — ya resuelto
En la tarjeta de contrato que usaba el usuario antes de este sistema aparecía "Arriendo mensual: $650.000", pero ese valor **no es el arriendo real**: es la meta/estimado de cobro mensual total, puramente informativo. El arriendo real y fijo (ej. $350.000) es un campo aparte que sí alimenta el cálculo. **Recomendación de UX**: en el sistema nuevo, renombrar la etiqueta a algo como "Meta mensual estimada" para no repetir la confusión, y mostrar el "Arriendo fijo mensual" como su propio campo, claramente distinto.

### Algoritmo de cierre de periodo (el corazón del sistema)
Los pagos del cliente (transferencias, cualquier frecuencia: diario/quincenal/mensual) se acumulan en el "periodo abierto" del contrato. El cierre **es siempre una acción manual del dueño**, nunca automático por fecha.

```
meta_arriendo   = arriendo_fijo_contrato + mora_acumulada_anterior
cobrado_periodo = suma de pagos del periodo abierto

si cobrado_periodo >= meta_arriendo:
    arriendo_cubierto = meta_arriendo
    abono_capital     = min(cobrado_periodo - meta_arriendo, saldo_capital_pendiente)
    mora_nueva        = 0
    si abono_capital agota saldo_capital_pendiente → Contrato = FINALIZADO_PAGADO, Moto = VENDIDA

si cobrado_periodo < meta_arriendo:
    arriendo_cubierto = cobrado_periodo
    abono_capital     = 0
    mora_nueva        = meta_arriendo - cobrado_periodo   (se suma a la meta del siguiente periodo)
```

Mientras el dueño no cierra, el periodo queda **Abierto** acumulando pagos — así se ve con claridad qué contratos llevan tiempo sin cerrarse (requisito explícito del usuario).

### Eventos especiales
- **Compra anticipada**: el cliente paga de una vez el saldo de capital restante. Evento aparte del ciclo normal: se cobra el arriendo del periodo en curso, se salda el capital completo, Contrato → `FINALIZADO_COMPRADO`, Moto → `VENDIDA`. Si lo recaudado no alcanza a cubrir arriendo + capital completo, se rechaza la operación (no se deja el contrato "a medias"); si sobra, el excedente se registra de forma trazable, sin aplicarse automáticamente a nada.
- **Incumplimiento**: el dueño marca el contrato como `INCUMPLIDO_RECUPERADA`. Se preserva todo el historial de lo pagado. La moto vuelve a `DISPONIBLE` para asignarla a otro cliente. El periodo abierto en ese momento se cierra formalmente (con el mismo algoritmo, aunque no alcance la meta) para que ningún pago quede huérfano.
- **Préstamos**: ledger 100% separado. Tienen su propio saldo y abonos; nunca se mezclan automáticamente con los pagos de arriendo/capital.
- **Gastos**: asociados a moto/contrato solo para que el dueño vea rentabilidad real por moto — no afectan el saldo del cliente.

### Máquinas de estado
**Contrato**: `ACTIVO` → `FINALIZADO_PAGADO` (cierre normal agota el saldo) | `FINALIZADO_COMPRADO` (compra anticipada) | `INCUMPLIDO_RECUPERADA` (recuperación). Todos los finales son terminales.
**Motocicleta**: `DISPONIBLE` → `EN_CONTRATO` (se crea contrato activo) → `VENDIDA` (contrato termina pagado/comprado) — o `EN_CONTRATO` → `DISPONIBLE` (contrato termina incumplido).

### Vista de estado por contrato (la pantalla más importante)
Debe mostrar por contrato: periodo actual abierto/cerrado y cuánto lleva cobrado vs. la meta, mora acumulada si existe, historial de periodos cerrados con su recibo descargable, saldo de capital restante, gastos asociados, préstamos asociados, y documentos/comprobantes adjuntos.

## SOAT y revisión tecnomecánica por moto (implementado)

El dueño necesita hacer seguimiento a la vigencia del SOAT y de la revisión tecnomecánica de cada motocicleta — son documentos legales obligatorios en Colombia, y una moto rentada sin ellos vigentes es un riesgo real para el negocio. Decisiones tomadas:

- **Solo se guarda la fecha de expedición** (`Motocicleta.soatFechaExpedicion` / `tecnomecanicaFechaExpedicion`, ambas opcionales); el **vencimiento siempre se calcula**, nunca se almacena — a petición explícita del usuario, para no depender de que alguien saque la cuenta al registrar el dato. Única fuente de verdad: `src/lib/moto-documentos.ts`.
- **Asunción a confirmar**: vigencia de 12 meses para ambos documentos desde su expedición (`VIGENCIA_SOAT_MESES` / `VIGENCIA_TECNOMECANICA_MESES`). Si la norma real es distinta, es el único lugar que hay que ajustar.
- El formulario de la moto muestra el vencimiento calculado en vivo apenas se elige la fecha de expedición.
- Alerta a 30 días del vencimiento (`UMBRAL_ALERTA_VENCIMIENTO_DIAS`): badge en la ficha de la moto y en el listado, se suma al contador de notificaciones del dashboard, y aparece en una tarjeta de atención dedicada ("SOAT y tecnomecánica") en la página principal.
- **No incluye** (por decisión explícita, para no ampliar el alcance): adjuntar el escaneo/foto del documento. Se puede agregar después reutilizando `Documento`, que hoy no tiene relación con `Motocicleta`.

## Decisiones técnicas

- **Next.js 16 (App Router) + TypeScript + React 19**, full-stack en un solo proyecto. **Importante**: Next.js 16 introdujo "Cache Components" (`cacheComponents: true`), un modelo de caché explícito que exige envolver en `<Suspense>` cualquier componente que lea la sesión (cookies) para poder generar un "shell" estático — pensado para sitios con partes públicas cacheables. Esta app es 100% interna, autenticada y con datos financieros que siempre deben ser frescos, así que **no se activa `cacheComponents`** (queda en su valor por defecto, deshabilitado). Con esto, el comportamiento es el "modelo anterior": nada se cachea implícitamente (Prisma no usa `fetch`, así que nunca se cachea salvo que se envuelva explícitamente en `unstable_cache`, cosa que este proyecto no hace). Regla del proyecto: **no envolver en `unstable_cache` ni usar `'use cache'`** en nada que muestre contratos, pagos, saldos o el dashboard.
- **PostgreSQL 16/17 + Prisma 7.x estable** (no adoptar la serie 8.x mientras esté en release candidate).
- **Dinero como `Int` (pesos colombianos enteros), nunca `Float`.** El COP no maneja decimales en este negocio, así que toda la aritmética del motor de cierre es suma/resta de enteros exacta, sin riesgo de redondeo. Toda la aritmética de dinero se centraliza en `src/lib/money.ts` (nadie más hace `+`/`-` de montos directamente). Validación con Zod (`z.number().int()`) en cada formulario/Server Action, más CHECK constraints a nivel de Postgres como defensa adicional (montos > 0, saldos >= 0).
- **Autenticación propia y mínima** (no Auth.js/NextAuth): tablas `Usuario` + `Sesion` en base de datos, contraseña con `argon2`, token de sesión aleatorio cuyo hash se guarda en DB, cookie httpOnly/secure. Deja la puerta abierta a roles futuros sin rediseño.
- **Server Actions** para las mutaciones (registrar pago, cerrar periodo, crear contrato, etc.) en vez de REST/tRPC — es una app interna de un solo cliente. Route Handlers solo para descargas de archivos/PDF y `/api/health`.
- **`@react-pdf/renderer`** para el PDF del recibo (evita depender de Chromium/Puppeteer en el servidor).
- **Tailwind CSS + shadcn/ui** para las pantallas CRUD y el dashboard.
- **Vitest** para pruebas, especialmente del motor de cierre (aritmética 100% entera → aserciones de igualdad exacta, cualquier fallo es un bug real).
- **Docker Compose** en el servidor propio del usuario (app + Postgres + Caddy como reverse proxy con HTTPS automático vía Let's Encrypt — requiere un dominio apuntando al servidor).

## Modelo de datos (Prisma)

```prisma
enum RolUsuario { ADMIN }

model Usuario {
  id           String     @id @default(cuid())
  email        String     @unique
  nombre       String
  passwordHash String
  rol          RolUsuario @default(ADMIN)
  activo       Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  sesiones     Sesion[]
}

model Sesion {
  id        String   @id @default(cuid())
  usuarioId String
  usuario   Usuario  @relation(fields: [usuarioId], references: [id])
  tokenHash String   @unique
  userAgent String?
  ip        String?
  expiresAt DateTime
  createdAt DateTime @default(now())
  @@index([usuarioId])
}

enum TipoIdentificacion { CC CE PASAPORTE NIT OTRO }

model Cliente {
  id                   String             @id @default(cuid())
  nombreCompleto       String
  tipoIdentificacion   TipoIdentificacion @default(CC)
  numeroIdentificacion String             @unique
  telefono             String?
  email                String?
  direccion            String?
  notas                String?
  activo               Boolean            @default(true)
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  contratos  Contrato[]
  prestamos  Prestamo[]
  documentos Documento[]
}

enum EstadoMoto { DISPONIBLE EN_CONTRATO VENDIDA }

model Motocicleta {
  id            String     @id @default(cuid())
  marca         String
  modelo        String
  placa         String     @unique
  color         String?
  anioModelo    Int?
  precioInicial Int
  estado        EstadoMoto @default(DISPONIBLE)
  notas         String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  contratos Contrato[]
  gastos    Gasto[]
  prestamos Prestamo[]
}

enum EstadoContrato { ACTIVO FINALIZADO_PAGADO FINALIZADO_COMPRADO INCUMPLIDO_RECUPERADA }

model Contrato {
  id    String @id @default(cuid())
  folio Int    @unique @default(autoincrement())   // se formatea en la UI como "CT-0001"

  clienteId     String
  cliente       Cliente     @relation(fields: [clienteId], references: [id])
  motocicletaId String
  motocicleta   Motocicleta @relation(fields: [motocicletaId], references: [id])

  valorTotalContrato    Int
  arriendoFijoMensual   Int      /// USADO por el motor de cierre
  metaMensualReferencia Int?     /// SOLO informativo ("Meta mensual estimada" en la UI) — nunca entra al cálculo
  cuotaDiariaReferencia Int?     /// SOLO informativo — nunca entra al cálculo

  fechaInicio      DateTime  @db.Date
  fechaFinEstimada DateTime? @db.Date

  saldoCapitalPendiente     Int
  moraAcumulada             Int      @default(0)
  fechaAperturaPeriodoActual DateTime @db.Date

  estado  EstadoContrato @default(ACTIVO)
  version Int            @default(0)   // bloqueo optimista en el cierre

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  finalizadoAt DateTime?

  pagos          Pago[]
  periodosCierre PeriodoCierre[]
  gastos         Gasto[]
  prestamos      Prestamo[]
  documentos     Documento[]

  @@index([estado])
  @@index([clienteId])
  @@index([motocicletaId])
}
// Migración manual adicional: índice único parcial para que una moto no pueda
// tener dos contratos ACTIVO a la vez —
// CREATE UNIQUE INDEX ... ON "Contrato" (motocicleta_id) WHERE estado = 'ACTIVO'

enum MetodoPago { TRANSFERENCIA EFECTIVO OTRO }

model Pago {
  id              String         @id @default(cuid())
  contratoId      String
  contrato        Contrato       @relation(fields: [contratoId], references: [id])
  periodoCierreId String?        // null = periodo abierto; se fija al cerrar y nunca cambia
  periodoCierre   PeriodoCierre? @relation(fields: [periodoCierreId], references: [id])

  fecha      DateTime   @db.Date   // fecha real del pago (puede ser retroactiva)
  monto      Int
  metodo     MetodoPago @default(TRANSFERENCIA)
  referencia String?
  notas      String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  documentos Documento[]           // comprobante(s), opcional

  @@index([contratoId, periodoCierreId])
  @@index([fecha])
}

enum TipoCierre { NORMAL COMPRA_ANTICIPADA }

model PeriodoCierre {
  id            String     @id @default(cuid())
  contratoId    String
  contrato      Contrato   @relation(fields: [contratoId], references: [id])
  numeroPeriodo Int
  tipoCierre    TipoCierre @default(NORMAL)

  fechaAperturaPeriodo DateTime @db.Date
  fechaCierre          DateTime @default(now())

  // snapshot inmutable de todo lo usado en el cálculo (auditable aunque el
  // arriendo fijo del contrato cambie después):
  moraAnterior         Int
  arriendoFijoUsado    Int
  metaArriendo         Int
  cobradoPeriodo       Int
  arriendoCubierto     Int
  abonoCapital         Int
  moraNueva            Int
  saldoCapitalAnterior Int
  saldoCapitalNuevo    Int
  excedenteNoAplicado  Int     @default(0)   // solo relevante en COMPRA_ANTICIPADA
  contratoFinalizado   Boolean @default(false)

  createdAt DateTime @default(now())
  pagos      Pago[]
  documentos Documento[]   // el PDF del recibo generado

  @@unique([contratoId, numeroPeriodo])
  @@index([contratoId])
}

enum CategoriaGasto { MANTENIMIENTO REPARACION SEGURO IMPUESTOS OTRO }

model Gasto {
  id            String         @id @default(cuid())
  motocicletaId String
  motocicleta   Motocicleta    @relation(fields: [motocicletaId], references: [id])
  contratoId    String?
  contrato      Contrato?      @relation(fields: [contratoId], references: [id])
  fecha         DateTime       @db.Date
  categoria     CategoriaGasto @default(MANTENIMIENTO)
  descripcion   String
  monto         Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  documentos Documento[]
  @@index([motocicletaId])
  @@index([contratoId])
}

enum EstadoPrestamo { ACTIVO PAGADO }

model Prestamo {
  id            String         @id @default(cuid())
  clienteId     String
  cliente       Cliente        @relation(fields: [clienteId], references: [id])
  motocicletaId String?
  motocicleta   Motocicleta?   @relation(fields: [motocicletaId], references: [id])
  contratoId    String?        // solo referencia informativa
  contrato      Contrato?      @relation(fields: [contratoId], references: [id])
  fecha          DateTime       @db.Date
  montoOriginal  Int
  saldoPendiente Int
  motivo         String?
  estado         EstadoPrestamo @default(ACTIVO)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  abonos     AbonoPrestamo[]
  documentos Documento[]
  @@index([clienteId])
}

model AbonoPrestamo {
  id         String   @id @default(cuid())
  prestamoId String
  prestamo   Prestamo @relation(fields: [prestamoId], references: [id])
  fecha DateTime @db.Date
  monto Int
  createdAt DateTime @default(now())
  documentos Documento[]
  @@index([prestamoId])
}

enum TipoArchivo { CEDULA COMPROBANTE_PAGO CONTRATO_FIRMADO RECIBO_PERIODO SOPORTE_GASTO SOPORTE_PRESTAMO OTRO }

model Documento {
  id                 String      @id @default(cuid())
  tipo               TipoArchivo
  nombreOriginal     String
  rutaAlmacenamiento String
  mimeType           String
  tamanioBytes       Int

  clienteId       String?
  cliente         Cliente?       @relation(fields: [clienteId], references: [id])
  contratoId      String?
  contrato        Contrato?      @relation(fields: [contratoId], references: [id])
  pagoId          String?
  pago            Pago?          @relation(fields: [pagoId], references: [id])
  periodoCierreId String?
  periodoCierre   PeriodoCierre? @relation(fields: [periodoCierreId], references: [id])
  gastoId         String?
  gasto           Gasto?         @relation(fields: [gastoId], references: [id])
  prestamoId      String?
  prestamo        Prestamo?      @relation(fields: [prestamoId], references: [id])
  abonoPrestamoId String?
  abonoPrestamo   AbonoPrestamo? @relation(fields: [abonoPrestamoId], references: [id])

  createdAt DateTime @default(now())
  @@index([contratoId])
  @@index([clienteId])
}
// Migración manual adicional: CHECK (num_nonnulls(cliente_id, contrato_id, pago_id,
// periodo_cierre_id, gasto_id, prestamo_id, abono_prestamo_id) >= 1)
```

**Regla de inmutabilidad del ledger** (aplicada en el código de servidor, no solo confiando en la UI): un `Pago` solo es editable/borrable mientras `periodoCierreId` es `null`. Un `PeriodoCierre`, una vez creado, nunca se edita ni se borra. `Contrato`/`Motocicleta` no se borran físicamente, solo cambian de estado.

## Motor de cierre — diseño

Tres capas, sin sobre-diseñar:
1. **`src/server/engine/cierre.ts`** — función pura (`calcularCierrePeriodo`), sin I/O ni Prisma, recibe y devuelve enteros. 100% testeable con Vitest usando igualdad exacta.
2. **`src/server/engine/cierreService.ts`** — orquestación transaccional: dentro de una única transacción Postgres, bloquea la fila del contrato (`SELECT ... FOR UPDATE`), captura el conjunto exacto de IDs de pagos abiertos, delega el cálculo a la capa 1, crea el `PeriodoCierre`, actualiza esos pagos por ID exacto (no por condición genérica, para no absorber pagos que lleguen a mitad del proceso), y actualiza `Contrato`/`Motocicleta`. Aislamiento `Serializable` + `Contrato.version` (bloqueo optimista) como defensa adicional contra doble clic/doble pestaña.
3. **Server Action delgada** que solo llama a la capa 2 y maneja la respuesta hacia la UI.

El PDF del recibo se genera **después** de confirmar la transacción (nunca dentro), y es regenerable en cualquier momento porque `PeriodoCierre` guarda el snapshot completo.

La compra anticipada reutiliza el mismo motor con una variante (`calcularCompraAnticipada`) que exige que lo recaudado cubra arriendo + saldo completo; si no alcanza, rechaza la operación con el monto faltante.

## Estructura del proyecto

```
mt/
├── prisma/{schema.prisma, migrations/, seed.ts}
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/            # valida sesión en su layout.tsx (no en middleware)
│   │   │   ├── page.tsx            # dashboard general
│   │   │   ├── clientes/...
│   │   │   ├── motos/...
│   │   │   ├── contratos/
│   │   │   │   └── [contratoId]/page.tsx   # vista de estado por contrato
│   │   │   └── reportes/page.tsx
│   │   └── api/{documentos,recibos,health}/route.ts
│   ├── server/
│   │   ├── engine/{cierre.ts, cierre.test.ts, cierreService.ts, compraAnticipada.ts}
│   │   ├── auth/{session.ts, password.ts}
│   │   ├── storage/fileStorage.ts
│   │   └── pdf/reciboPdf.tsx
│   ├── lib/{money.ts, dates.ts, db.ts, validation/}
│   └── components/ui/              # shadcn/ui
├── docker/{Dockerfile, Caddyfile}
├── docker-compose.yml
└── .env.example
```

## Despliegue (servidor propio)

- **Docker Compose** con 3 servicios: `app` (Next.js, build multi-stage con `output: 'standalone'`), `db` (`postgres:16-alpine`), `caddy` (reverse proxy + HTTPS automático). Solo `caddy` expone puertos 80/443; `app` y `db` quedan en red interna.
- **Backups**: `pg_dump` diario vía cron del host + backup del volumen de archivos subidos, copiados **fuera del servidor** (ej. `rclone` a almacenamiento externo económico) — un backup que vive solo en el mismo disco no protege contra falla del servidor. Probar la restauración periódicamente.
- **HTTPS**: requiere un dominio/subdominio apuntando al servidor (Let's Encrypt no emite certificados para IPs desnudas).
- Hardening básico (firewall, SSH por llave, actualizaciones automáticas) y monitoreo mínimo (`/api/health` + un servicio gratuito tipo UptimeRobot).

## Plan de fases

| Fase | Contenido | Verificable cuando... |
|---|---|---|
| 0. Setup | Next.js+TS+Tailwind, Prisma+Postgres (dev), Vitest, estructura de carpetas | `npm run dev` levanta y `/api/health` confirma conexión a la DB |
| 1. Auth | `Usuario`/`Sesion`, login/logout, layout protegido, seed del admin | Login funcional |
| 2. Clientes y Motos | CRUD completo + validación Zod | Inventario real cargable |
| 3. Contratos (sin motor) | Crear/ver/editar, valida moto `DISPONIBLE`, la pasa a `EN_CONTRATO` | Contratos reales creables con estados correctos |
| 4. Pagos + Motor de cierre | Registro de pagos, `engine/cierre.ts` con suite de tests exhaustiva, `cierreService.ts` transaccional, acción "Cerrar periodo", Compra Anticipada, Incumplimiento | **Hito clave**: ciclo de vida completo de un contrato de punta a punta |
| 5. Vista de estado + PDF | Pantalla de detalle de contrato completa, generación de recibo PDF | La pantalla más importante, funcional |
| 6. Gastos y Préstamos | CRUD de ambos, ledger de préstamo independiente | Rentabilidad por moto visible |
| 7. Documentos | Subida/descarga de archivos genéricos con control de acceso | Flujo documental completo |
| 8. Dashboard general | Alertas de periodos abiertos hace mucho, mora total de cartera | Panorama del negocio de un vistazo |
| 9. Despliegue | Dockerfile, compose, Caddy, servidor, backups probados (con restauración real), migración de datos previos si aplica | Sistema en producción con HTTPS y backup/restore verificado |

## Supuestos a confirmar (no bloquean el inicio, pero deben validarse antes de la Fase 4)

- `metaMensualReferencia` es puramente informativo y no participa en el algoritmo de cierre (se desprende de lo ya confirmado, pero conviene confirmarlo explícitamente).
- Compra anticipada: si lo recaudado no alcanza, se rechaza la operación; si sobra, el excedente queda registrado pero no se aplica automáticamente a nada.
- Marcar `INCUMPLIDO_RECUPERADA` fuerza el cierre del periodo abierto en ese momento.
- El comprobante adjunto en un `Pago` es opcional (se puede adjuntar después).
- Umbral de alerta de "periodo abierto hace mucho" en el dashboard: 35-40 días por defecto, configurable.
- Migración de datos existentes (si el usuario ya tiene contratos/clientes/motos en Excel o papel): pendiente de definir alcance en la Fase 9.

## Verificación end-to-end

1. `npm run dev` con Postgres local (o vía `docker compose up db`) — confirmar `/api/health`.
2. Ejecutar `npx vitest` sobre `src/server/engine/cierre.test.ts` — todos los casos (pago exacto, insuficiente con mora, excedente con abono a capital, cierre que agota el capital, mora previa arrastrada) deben pasar con igualdad exacta.
3. Flujo manual en el navegador: crear un cliente y una moto → crear un contrato (la moto pasa a `EN_CONTRATO`) → registrar 2-3 pagos → cerrar el periodo → verificar que el saldo de capital de la moto bajó exactamente lo esperado, que se generó el PDF del recibo, y que el periodo aparece como cerrado en el historial.
4. Probar el caso de mora: cerrar un periodo con cobro insuficiente y verificar que la meta del siguiente periodo sube correctamente.
5. Probar compra anticipada e incumplimiento en contratos de prueba separados, verificando los cambios de estado de Contrato y Motocicleta.
6. `docker compose up --build` en el servidor (o un entorno equivalente) para validar el despliegue completo antes de ir a producción.
