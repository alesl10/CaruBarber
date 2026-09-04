# Caru Barber · Turnero

Aplicación de turnos para una barbería de un solo barbero. Interfaz oscura con identidad dorada
(logo y paleta de Caru Barber).

- **backend/** — API REST con NestJS 11 + TypeORM + SQLite. Puerto `3001`.
- **frontend/** — Next.js 14 (App Router). Puerto `3000`.

## Puesta en marcha

```bash
# Backend
cd backend
cp .env.example .env          # ajustar JWT_SECRET
npm install
npm run start:dev

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

Abrir http://localhost:3000.

Usuarios demo (se crean solos al primer arranque):

| Rol      | Email                     | Contraseña  |
|----------|---------------------------|-------------|
| Peluquero (admin) | `admin@peluqueria.com`   | `admin123`   |
| Cliente  | `cliente@peluqueria.com`  | `cliente123` |

Para reiniciar los datos: parar el backend y borrar `backend/turnero.db`.

## Funcionalidad

**Cliente**
- Crear cuenta / iniciar sesión.
- Reservar un turno: elige servicio y fecha, ve solo los horarios libres y reserva. El turno
  queda **pendiente** hasta que el peluquero lo aprueba.
- Ver sus turnos y su estado (se actualiza solo), cancelar.

**Peluquero (admin)**
- **Panel**: métricas del período elegido (hoy / esta semana / este mes) — cortes realizados,
  turnos pendientes, confirmados y cancelados, **lo recaudado** (según los cortes marcados como
  realizados, a precio de cada servicio) y el **desglose por servicio**. Además, bandeja de
  notificaciones (avisa cuando alguien reserva) y cola de solicitudes para **aprobar o cancelar**.
- **Agenda**: vistas **día, semana y mes**. Desde la agenda se confirma, se marca un turno como
  **realizado** (lo que alimenta las métricas y lo recaudado) o se cancela.
- **Servicios**: alta/baja/edición, **duración** (define la duración del turno) y **precio**.
- **Horarios**: días y horas de atención por día de la semana, descanso opcional, intervalo entre
  turnos, antelación mínima para reservar, y **bloqueos** de fechas puntuales (feriados, vacaciones).

El backend valida que los turnos no se solapen entre sí, ni con el descanso, ni con los bloqueos,
ni caigan fuera del horario de atención (tanto al listar disponibilidad como al confirmar la reserva).

## Avisos por email

- Cuando un cliente reserva, el peluquero recibe un **email** con un link para **confirmar o
  cancelar** el turno sin necesidad de iniciar sesión.
- Cuando el peluquero confirma, el cliente recibe el aviso. Lo mismo si se cancela.

Configuración en `backend/.env` (ver `.env.example`):

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`. **Si no se
  configura SMTP**, se usa una cuenta de prueba automática y el link para ver cada email se escribe
  en la consola del backend (los mails no se entregan a destino real — sirve para probar).
  Ejemplo Gmail: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`,
  `SMTP_USER=tu@gmail.com`, `SMTP_PASS=<app password>`.
- `PELUQUERO_EMAIL`: a dónde llegan los avisos del peluquero (si se omite, usa el email del usuario admin).

> Los avisos por **WhatsApp** (vía Twilio) están implementados pero **desactivados/comentados**.
> Para reactivarlos, ver el instructivo al pie de `backend/src/notificaciones/notificador.service.ts`.

## Notas técnicas

Ver [CLAUDE.md](CLAUDE.md) para la arquitectura en detalle. Autenticación con JWT + bcrypt.
