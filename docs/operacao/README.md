# Roteiros de Operação — VIRTUHAR3D

Guia operacional para o servidor local (**Ubuntu Server 26.04 LTS**) e estações do laboratório (**Kubuntu 26.04**) em rede Gigabit sem acesso à internet.

## 1. Autoridade Certificadora Interna (`virtuhar3d-ca.crt`)

No servidor, gere a CA e o certificado local do `nginx`:

```bash
chmod +x infra/nginx/generate-local-ca.sh
./infra/nginx/generate-local-ca.sh virtuhar3d.local
```

Em cada estação **Kubuntu 26.04** (ou via script de provisionamento do laboratório):

```bash
sudo cp virtuhar3d-ca.crt /usr/local/share/ca-certificates/virtuhar3d-ca.crt
sudo update-ca-certificates
# Registro no banco NSS usado por Chromium 157.x e Firefox 160.x
certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n "VIRTUHAR3D CA" -i virtuhar3d-ca.crt
```

## 2. Implantação e Atualização com Docker Compose

```bash
cp .env.example .env
# Ajustar POSTGRES_PASSWORD, SESSION_SECRET e CORS_ORIGIN
npm ci
npm run build
docker compose up -d --build
# Executar seed idempotente na primeira subida
docker compose exec api npx tsx server/src/seed.ts
```

Verificações pós-subida:

- `curl -k https://virtuhar3d.local/api/health` deve retornar HTTP `200`.
- Conferir logs da API: `docker compose logs -f api`.

## 3. Backup Diário (`pg_dump`) e Teste de Restauração

Backup compactado em `/var/backups/virtuhar3d` (agendar via cron às 23:00):

```bash
mkdir -p /var/backups/virtuhar3d
docker compose exec -T db pg_dump -U virtuhar3d -Fc virtuhar3d > /var/backups/virtuhar3d/virtuhar3d-$(date +%F).dump
```

Restauração em caso de falha (ou teste mensal de restauração):

```bash
docker compose stop api
docker compose exec -T db pg_restore -U virtuhar3d -d virtuhar3d --clean --if-exists < /var/backups/virtuhar3d/virtuhar3d-YYYY-MM-DD.dump
docker compose start api
```

## 4. Procedimento de Rollback

1. Voltar para a tag Git estável anterior: `git checkout v0.3.0`.
2. Recompilar e reiniciar os contêineres: `npm ci && npm run build && docker compose up -d --build`.
3. Se a versão anterior exigir schema de banco anterior, restaurar o último `.dump` compatível antes de religar o serviço `api`.
