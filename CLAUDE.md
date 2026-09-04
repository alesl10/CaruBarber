# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Turnero **Caru Barber**, para una barbería de **un solo barbero**. `backend/` es una API NestJS 11 +
TypeORM (SQLite en dev, Postgres en prod); `frontend/` es una app Next.js 14 (App Router). Dos
paquetes npm independientes, **sin `package.json` raíz**. Despliegue: Supabase + Vercel — ver
[DEPLOY.md](DEPLOY.md).

## Comandos

```bash
# Instalar (una vez por paquete)
cd backend && npm install
cd frontend && npm install

# Desarrollo (dos terminales)
cd backend && npm run start:dev      # NestJS con watch en :3001
cd frontend && npm run dev           # Next.js en :3000

# Build
cd backend && npm run build          # nest build -> backend/dist
cd frontend && npm run build

# Lint (ambos limpios)
cd backend && npm run lint           # eslint . --ext .ts
cd frontend && npm run lint          # next lint
```

Config: copiar `backend/.env.example` a `backend/.env` (necesita `JWT_SECRET`; `SMTP_*` es opcional
— sin él el email va a una cuenta de prueba Ethereal). El front lee `NEXT_PUBLIC_API_URL`
(default `http://localhost:3001`), ver `frontend/.env.local.example`.
Para reiniciar datos: parar el backend y borrar `backend/turnero.db` (se re-seedea al arrancar).

No hay suite de tests automatizados; la verificación es manual + lint.

Usuarios demo del seed: `admin@peluqueria.com` / `admin123` · `cliente@peluqueria.com` / `cliente123`.

## Arquitectura backend

- **TypeORM env-driven** ([database.module.ts](backend/src/database/database.module.ts)): si hay
  `DATABASE_URL` usa **PostgreSQL** (Supabase en prod), si no **better-sqlite3** (`turnero.db`, dev).
  `better-sqlite3` es `optionalDependency` (prod con Postgres no lo necesita). Sin migraciones: el
  esquema sale de las entidades — en dev con `synchronize: true`; en prod se crea una vez con
  `npm run schema:sync` ([src/schema-sync.ts](backend/src/schema-sync.ts), `DATABASE_URL` directa)
  y Vercel corre con `DB_SYNC=false`. Lista de entidades en [entities.ts](backend/src/database/entities.ts).
- **Seed** centralizado en [seeder.ts](backend/src/database/seeder.ts) (`OnApplicationBootstrap`,
  idempotente). NO seedear desde constructores de services.
- **Auth real**: bcrypt (`bcryptjs`) + JWT (`@nestjs/jwt`). El payload del token es
  `{ sub, email, nombre, rol }`. Piezas en `backend/src/auth/`:
  - `guards/jwt-auth.guard.ts` — valida `Authorization: Bearer` y setea `req.user`.
  - `guards/roles.guard.ts` + `decorators/roles.decorator.ts` — `@Roles('admin')`. Usar como
    `@UseGuards(JwtAuthGuard, RolesGuard)` (en ese orden).
  - `decorators/current-user.decorator.ts` — `@CurrentUser()` devuelve el payload (`UsuarioActual`).
  - `AuthModule` exporta `JwtModule` + los guards; el resto de los módulos hacen `imports: [AuthModule]`.
- **Módulos de dominio**: `servicios`, `horarios`, `notificaciones`, `turnos`. `turnos` depende de
  los otros tres.
- **DTOs con `class-validator`** en `*/dto/`. El `ValidationPipe` global usa
  `whitelist + forbidNonWhitelisted + transform`, así que body con campos de más → 400.

### Entidades (`backend/src/database/entities/`)

`Usuario` (rol `admin`|`cliente`, password = hash), `Servicio` (`duracionMinutos` es la fuente de
verdad de la duración; `precio` alimenta lo recaudado), `Turno` (estado
`pendiente`→`confirmado`→`realizado`, o `cancelado`), `ConfiguracionAgenda` (singleton id=1:
`intervaloTurnos`, `anticipacionMinimaHoras`), `HorarioTrabajo` (1 fila por `diaSemana` 0-6, con
descanso opcional), `BloqueoAgenda` (fecha puntual; `horaInicio` null = día completo), `Notificacion`.

`realizado` = el peluquero marcó que el turno se atendió (`PATCH /turnos/:id/realizar`). Es lo que
cuenta como "corte realizado" y suma a lo recaudado. Un turno `realizado` ya no se puede
confirmar ni cancelar.

### Lógica de disponibilidad — [turnos.service.ts](backend/src/turnos/turnos.service.ts)

`disponibilidad(fecha, servicioId)` genera slots desde `horaApertura` en pasos de
`intervaloTurnos` y descarta los que: caen fuera del horario, pisan el descanso, pisan un
bloqueo, pisan un turno no cancelado, o ya pasaron (`anticipacionMinimaHoras`). `POST /turnos`
**revalida el slot con la misma función `slotLibre`** (no confía en el cliente) y recalcula
`horaFin` desde `Servicio.duracionMinutos`. Helpers de horas en
[common/time.util.ts](backend/src/common/time.util.ts) (`hhmmToMin`, `sumarMinutos`, `seSolapan`).
Horas se guardan como string `'HH:MM'` (comparación lexicográfica válida), fechas `'YYYY-MM-DD'`.

### Flujo de notificaciones

Dos capas, ambas disparadas desde `TurnosService`:

1. **In-app** (`NotificacionesService`, filas en la tabla `notificaciones`): `POST /turnos` crea una
   para `destinatarioRol: 'admin'`; `confirmar`/`cancelar` marcan como leídas las del turno y crean
   una dirigida al cliente (`destinatarioId`). El front hace polling (`/admin` 15s, `/mis-turnos` 20s).
2. **Hacia afuera** (`NotificadorService` en `notificaciones/`): sólo **email** (`MailerService`,
   nodemailer). Se llama fire-and-forget (`.catch(() => undefined)`), nunca rompe el flujo. Eventos:
   reserva → al peluquero con links de **confirmar/cancelar**; confirmación → al cliente; cancelación
   → a la otra parte.
   - Sin `SMTP_*` en `.env`, `MailerService` usa una cuenta de prueba Ethereal y loguea el link de
     preview de cada mail (no se entregan de verdad). Con `SMTP_*`, envía por ese servidor.
   - **WhatsApp (Twilio) está implementado pero desactivado** (comentado). El código vive en
     `whatsapp.service.ts` (no registrado en el módulo) y en llamadas comentadas dentro de
     `notificador.service.ts`; el instructivo para reactivarlo está al pie de ese archivo.

### Links de acción sin login (`turnos/publico`)

`NotificadorService` firma un JWT `{ turnoId, rol, typ: 'accion' }` y arma
`${PUBLIC_APP_URL}/turno/<token>?accion=confirmar|cancelar`. La página pública
[turno/[token]/page.tsx](frontend/src/app/turno/[token]/page.tsx) lee el token vía
`GET /turnos/publico/:token` y actúa con `POST /turnos/publico/:token { accion }`
(`TurnoPublicoController`, sin guard — la autorización va en el token). `rol: 'cliente'` sólo puede
cancelar; `rol: 'admin'` puede confirmar y cancelar. `TurnosService.verificarTokenAccion` valida
`typ === 'accion'` para que un JWT de sesión normal no sirva como link.

### Estadísticas — `GET /turnos/estadisticas?desde=&hasta=` (admin)

`TurnosService.estadisticas(desde, hasta)` recorre los turnos del rango (fechas inclusive) y
devuelve conteos por estado, `recaudado` (suma de `Servicio.precio` de los `realizado`),
`recaudadoProyectado` (los `confirmado`) y `porServicio` (desglose de realizados por servicio).
Alimenta el panel del admin.

### Endpoints

`auth`: `POST /auth/{register,login}`, `GET /auth/me`.
`servicios`: `GET` público; `POST/PATCH/DELETE` admin.
`horarios`: `GET /horarios`, `GET /horarios/configuracion`, `GET /horarios/bloqueos` públicos;
`PUT /horarios/:diaSemana`, `PUT /horarios/configuracion`, `POST/DELETE /horarios/bloqueos` admin.
`turnos` (todos requieren JWT): `GET /turnos/disponibilidad`, `GET /turnos/mios` (cliente),
`GET /turnos/estadisticas` (admin), `GET /turnos?fecha=|desde=&hasta=|estado=` (admin),
`POST /turnos` (cliente), `PATCH /turnos/:id/{confirmar,realizar}` (admin),
`PATCH /turnos/:id/cancelar` (admin o dueño).
`turnos/publico` (sin JWT, autoriza el token del link): `GET /turnos/publico/:token`,
`POST /turnos/publico/:token { accion: 'confirmar' | 'cancelar' }`.
`notificaciones` (JWT): `GET /notificaciones?noLeidas=`, `GET /notificaciones/no-leidas/count`,
`PATCH /notificaciones/leer-todas`, `PATCH /notificaciones/:id/leida` (filtra por rol del token).

## Arquitectura frontend (`frontend/src/`)

- `lib/api.ts` — wrapper de `fetch`: base desde `NEXT_PUBLIC_API_URL`, agrega `Bearer` desde
  `localStorage` (`turnero.token`), tira `ApiError` con el mensaje del backend.
- `lib/auth.tsx` — `AuthProvider` + `useAuth()` (`user`, `cargando`, `login`, `register`, `logout`).
  Rehidrata llamando a `GET /auth/me`. Envuelto en [layout.tsx](frontend/src/app/layout.tsx).
- `lib/types.ts` — tipos compartidos con el backend. `lib/fechas.ts` — helpers de fecha en local
  (`rangoSemana`, `rangoMes`, `gridMes`, `addDias/Meses`, …).
- **`lib/ui.ts` — sistema de diseño** (marca Caru Barber: carbón + dorado). `colores` (paleta),
  `oroGradiente`, `fuenteDisplay` (Oswald, vía `--font-display`), y helpers de estilo inline:
  `card`, `input`, `label`, `boton()` (sin arg = dorado; con color = sólido), `botonChico()`,
  `botonGhost(activo)`, `chipEstado`, `avisoOk`/`avisoError`, `titulo`, `textoDorado`, `colorEstado`.
  El tema oscuro se fija en `globals.css` (`color-scheme: dark` + fondo) y las fuentes en
  `layout.tsx` con `next/font/google` (Inter + Oswald).
- `components/Logo.tsx` — `LogoBadge` (monograma "C" SVG con navaja/tijera en dorado), `Wordmark`,
  `TijeraRule` (divisor), `Logo` (badge + wordmark). Sin imagen: todo SVG/CSS.
- `components/turnos.tsx` — `FilaTurno`, `AccionesTurno` (botones Confirmar/Marcar realizado/Cancelar
  según estado) y `TurnoModal`. Reusados por el panel y la agenda.
- `components/Protegido.tsx` — `<Protegido rol="admin|cliente">`: redirige client-side según sesión.
  La barrera real es server-side (guards JWT).
- Rutas: `/` (login/registro), `/reservar` y `/mis-turnos` (cliente); admin: `/admin` (**Panel**:
  KPIs + recaudado del período Hoy/Semana/Mes + desglose por servicio + notificaciones + solicitudes
  pendientes), `/admin/agenda` (vistas **Día / Semana / Mes**), `/admin/servicios`, `/admin/horarios`;
  `/turno/[token]` es **pública** (sin `Protegido`), para el link de confirmar/cancelar del email.
  Cada página es `'use client'` y usa polling donde hace falta.

## Despliegue (Supabase + Vercel) — ver [DEPLOY.md](DEPLOY.md)

- **Backend en Vercel** = función serverless. Entrypoint [backend/api/index.ts](backend/api/index.ts)
  → cachea `bootstrapServer()` de [src/serverless.ts](backend/src/serverless.ts) (Nest sobre un
  Express plano). `backend/vercel.json` fija `buildCommand: nest build` y reescribe todo a `/api`.
  El import es a `../dist/serverless.js` (ya compilado por tsc con metadata de decoradores) a
  propósito: si el bundler de Vercel recompilara Nest con esbuild, se rompería la DI.
- `src/main.ts` sigue existiendo para dev (`start:dev`) y para deploys en un server persistente
  (Render/Fly): mismo `AppModule`, `app.listen(PORT)`.
- `DatabaseSeeder` puede correr en cada cold start (idempotente, cada `save` con try/catch);
  `SEED_ON_BOOT=false` lo apaga. `MailerService` no intenta Ethereal si `NODE_ENV=production`.
- Vars nuevas: `DATABASE_URL`, `DB_SYNC`, `DB_SSL`, `DB_POOL_MAX`, `SEED_ON_BOOT`, `NODE_ENV`.

## Convenciones

- Todo en español rioplatense ("podés", "reservá"), incluido el código de dominio.
- Backend `tsconfig` con `strict: false`; frontend con `strict: true`.
- TypeORM instalado es la **v1.1.0** (no la vieja 0.3.x): `PrimaryColumn`, `CreateDateColumn`,
  `In`, `MoreThanOrEqual`, `Between` disponibles normalmente.
