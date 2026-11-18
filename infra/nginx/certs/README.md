# Certificados HTTPS Locais

Esta pasta armazena os certificados gerados localmente para o nginx (`virtuhar3d.crt`, `virtuhar3d.key` e `virtuhar3d-ca.crt`).
Chaves privadas (`*.key`, `*.pem`) nunca devem ser versionadas no Git.

Para gerar os certificados de desenvolvimento/laboratório:

```bash
chmod +x infra/nginx/generate-local-ca.sh
./infra/nginx/generate-local-ca.sh virtuhar3d.local
```
