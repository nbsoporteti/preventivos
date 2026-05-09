# Deploy Preventivos CL en HostGator (cPanel)

## Estructura en el servidor

```
/home/tuusuario/
├── api-laravel/          ← código PHP (fuera de public_html por seguridad)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── storage/
│   ├── vendor/           ← se genera con composer install
│   ├── .env
│   ├── artisan
│   └── composer.json
│
└── public_html/
    ├── index.html        ← frontend React
    ├── assets/           ← CSS + JS del frontend
    ├── .htaccess         ← rutas SPA + excluye /api
    └── api/              ← symlink o copia de api-laravel/public/
        ├── index.php
        └── .htaccess
```

## Paso a paso

### 1. Base de datos

1. En cPanel > **MySQL Databases**: tu BD ya existe (`davidya1_dbpreventivos`)
2. En cPanel > **phpMyAdmin**: importa `api-laravel/database/extra_tables.sql`
   (las tablas principales ya las importaste antes con `schema.sql`)

### 2. Subir API Laravel

1. Sube la carpeta `api-laravel/` al HOME de tu cuenta (no dentro de public_html)
   - Puedes comprimir como ZIP, subir con File Manager y extraer
2. En cPanel > **Terminal** (o vía SSH) ejecuta:
   ```bash
   cd ~/api-laravel
   composer install --no-dev --optimize-autoloader
   php artisan key:generate
   ```
3. Si NO tienes terminal/SSH, instala composer en tu PC:
   - Descarga: https://getcomposer.org/download/
   - Ejecuta `composer install --no-dev` en la carpeta api-laravel LOCAL
   - Sube la carpeta `vendor/` completa al servidor

### 3. Configurar .env

Edita `~/api-laravel/.env` en el servidor:
- Verifica DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD
- Cambia JWT_SECRET por algo aleatorio largo
- Configura MAIL_USERNAME y MAIL_PASSWORD si quieres emails

### 4. Conectar public_html/api con Laravel

Opción A (symlink, si tienes SSH):
```bash
ln -s ~/api-laravel/public ~/public_html/api
```

Opción B (sin SSH):
- Copia el contenido de `api-laravel/public/` a `public_html/api/`
- Edita `public_html/api/index.php` y cambia la ruta del autoload:
  ```php
  require '/home/TU_USUARIO/api-laravel/vendor/autoload.php';
  $app = require_once '/home/TU_USUARIO/api-laravel/bootstrap/app.php';
  ```

### 5. Subir Frontend

1. Sube todo el contenido de `public_html/` (index.html, assets/, .htaccess)
   directamente a `~/public_html/` en el servidor
2. NO sobreescribas la carpeta `api/` que configuraste en el paso anterior

### 6. Permisos

```bash
chmod -R 775 ~/api-laravel/storage
chmod -R 775 ~/api-laravel/bootstrap/cache  # crear si no existe
```

### 7. Verificar

- Abre https://preventivos.cl → debería cargar el frontend
- Abre https://preventivos.cl/api/health → debería devolver `{"status":"ok"}`

## Solución de problemas

| Error | Solución |
|-------|----------|
| 500 en /api | Revisa `~/api-laravel/storage/logs/laravel.log` |
| 403 | Permisos de storage/ o .htaccess no activo |
| CORS bloqueado | Verifica CORS_ALLOWED_ORIGINS en .env |
| DB connection refused | Verifica credenciales en .env |
