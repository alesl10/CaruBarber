# Despliegue — Supabase (Postgres) + Vercel (backend y frontend)

Arquitectura:

```
Frontend (Next.js)  ──►  Backend (NestJS, función serverless)  ──►  Postgres (Supabase)
   Vercel project            Vercel project                          Supabase project
```

- Auth por JWT en `localStorage` (sin cookies) → el cross-origin frontend↔backend funciona solo con CORS.
- El backend detecta `DATABASE_URL`: si está, usa Postgres; si no, SQLite (dev local).

---

## 0. Requisitos

- El proyecto tiene que estar en un repo de **GitHub/GitLab/Bitbucket** (Vercel deploya desde ahí).
  Si todavía no lo está:
  ```bash
  cd C:/Users/usuario/Desktop/turnero-peluqueria
  git init && git add -A && git commit -m "turnero caru barber"
  # crear el repo en GitHub y:
  git remote add origin https://github.com/<usuario>/<repo>.git
  git push -u origin main
  ```
- Cuentas gratis en **supabase.com** y **vercel.com**.

---

## 1. Base de datos — Supabase

1. supabase.com → **New project**. Elegí una región cercana (idealmente la misma que Vercel).
   Poné una **Database Password** y guardala.
2. Esperá el aprovisionamiento (~2 min).
3. **Project Settings → Database → Connection string**. Vas a necesitar DOS variantes:
   - **Directa** (pestaña *URI*): `postgresql://postgres:[PASSWORD]@db.<ref>.supabase.co:5432/postgres`
     → se usa **una sola vez** para crear el esquema.
   - **Pooler / Transaction** (pestaña *Connection pooling*, Mode = Transaction, puerto **6543**):
     `postgresql://postgres.<ref>:[PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres`
     → es la que usa el backend en Vercel (serverless necesita el pooler).

   Reemplazá `[PASSWORD]` por la contraseña real en ambas.

### 1.1 Crear el esquema (una vez, desde tu máquina)

```bash
cd backend
npm install
npm run build

# PowerShell:
$env:DATABASE_URL="postgresql://postgres:[PASSWORD]@db.<ref>.supabase.co:5432/postgres"
npm run schema:sync
```

Debe imprimir `✔ Esquema sincronizado en la base`. Verificá en Supabase → **Table Editor** que
aparecieron las tablas (`usuarios`, `servicios`, `turnos`, `horarios_trabajo`, `bloqueos_agenda`,
`configuracion_agenda`, `notificaciones`).

> Si más adelante cambian las entidades, se vuelve a correr `schema:sync` con la URL directa.

---

## 2. Backend — Vercel

1. vercel.com → **Add New… → Project** → importá el repo.
2. **Root Directory: `backend`**.
3. Framework Preset: **Other** (ya viene fijado por `backend/vercel.json`).
4. **Environment Variables** (Settings → Environment Variables):

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | connection string del **pooler / transaction (6543)** |
   | `DB_SYNC` | `false` |
   | `DB_SSL` | `true` |
   | `SEED_ON_BOOT` | `true` (podés poner `false` después del primer arranque) |
   | `JWT_SECRET` | string largo y aleatorio |
   | `JWT_EXPIRES` | `7d` |
   | `FRONTEND_URL` | URL del frontend en Vercel (la completás en el paso 3; se puede editar después) |
   | `PUBLIC_APP_URL` | igual que `FRONTEND_URL` |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_SECURE` | `true` |
   | `SMTP_USER` | tu Gmail |
   | `SMTP_PASS` | app password de 16 caracteres |
   | `MAIL_FROM` | `Caru Barber <tu@gmail.com>` |
   | `PELUQUERO_EMAIL` | a dónde llegan los avisos de reserva |

5. **Deploy**. Cuando termine, entrá a `https://<backend>.vercel.app/health` →
   debe responder `{"ok":true,...}` (el primer request es un cold start, puede tardar unos segundos).
6. Probá el login:
   `POST https://<backend>.vercel.app/auth/login` con
   `{"email":"admin@peluqueria.com","password":"admin123"}` → debe devolver un `token`.

---

## 3. Frontend — Vercel

1. vercel.com → **Add New… → Project** → el mismo repo otra vez.
2. **Root Directory: `frontend`**. Framework: **Next.js** (autodetectado).
3. **Environment Variables**:

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<backend>.vercel.app` |

4. **Deploy**.
5. Copiá la URL final del frontend (`https://<frontend>.vercel.app`) y **volvé al proyecto del
   backend** → editá `FRONTEND_URL` y `PUBLIC_APP_URL` con ese valor → **Redeploy** del backend
   (para que el CORS y los links de los emails apunten bien).

---

## 4. Verificación end-to-end

1. Abrí el frontend, registrate como cliente, reservá un turno.
2. Debe llegarte el email "Nuevo turno …" con los links **Confirmar / Cancelar**.
3. Abrí el link de confirmar → confirmá → debe llegar el email al cliente.
4. Entrá como `admin@peluqueria.com` / `admin123` → Panel y Agenda con los datos.

**Cambiá la contraseña del admin demo** (o borrá el usuario y creá el tuyo) antes de usarlo en serio.

---

## Notas y límites

- **Supabase free**: 500 MB, 2 proyectos, y **pausa el proyecto tras 7 días sin actividad**
  (se reactiva solo al entrar al dashboard, o con uso). Para un negocio real conviene el plan Pro
  (US$25/mes) o migrar a otro Postgres.
- **Vercel Hobby (free)** es, según sus términos, para uso **no comercial**. Para una barbería que
  factura, lo correcto es Vercel **Pro** (US$20/mes) — o dejar el **frontend** en Vercel y mover el
  **backend** a un servicio gratuito que corra un server persistente:
  - **Render** (free web service): Root `backend`, build `npm install && npm run build`,
    start `npm run start`, mismas variables de entorno + `PORT` que Render inyecta.
    `src/main.ts` ya sirve para eso sin cambios. (Se duerme tras 15 min de inactividad, cold start ~1 min.)
  - **Fly.io** / **Koyeb**: idem, contenedor persistente.
- Cold start del backend en Vercel: ~1–3 s la primera request tras inactividad. Aceptable para un turnero.
- Los emails por WhatsApp siguen desactivados (ver `backend/src/notificaciones/notificador.service.ts`).
