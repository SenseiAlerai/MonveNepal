# MONVE NEPAL CMS

Lightweight catalog website for MONVE NEPAL with a password-protected admin panel.

## What The Client Can Edit

- Homepage announcement
- Hero image and text
- Story image and text
- Bag categories
- Bag collection items
- Bag images
- Bag visibility, order, color, tag, and description

Admin URL:

```text
/admin
```

## Local Setup

```bash
npm install
cp .env.example .env
npm start
```

Then open:

```text
http://localhost:3000
http://localhost:3000/admin
```

Default development login:

```text
Username: admin
Password: admin12345
```

Change this before going live.

## VPS Environment

Create `.env` on the VPS:

```text
PORT=3001
SESSION_SECRET=replace-with-a-long-random-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-a-strong-password
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=monve-nepal
```

Cloudinary is optional in local development. If the Cloudinary values are missing, uploads are saved in `uploads/`. On the VPS, set the Cloudinary values so admin uploads are stored on Cloudinary.

Install and run:

```bash
npm install --omit=dev
npm start
```

Recommended PM2:

```bash
pm2 start server.js --name monve-nepal
pm2 save
```

## Nginx Reverse Proxy

Example:

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Backups

If using Cloudinary, uploaded images live in Cloudinary and only the CMS data file needs regular backup:

```text
data/monve-db.json
```

If Cloudinary is not configured, also back up:

```text
uploads/
```

The source code can be redeployed from GitHub, but `data/monve-db.json` contains the client's live content and image URLs.
