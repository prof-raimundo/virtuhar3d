#!/usr/bin/env bash
set -euo pipefail

# Gera Autoridade Certificadora (CA) interna da escola e certificado HTTPS para rede local.
# Uso: ./infra/nginx/generate-local-ca.sh [DOMINIO_OU_IP_SERVIDOR]

CERT_DIR="$(cd "$(dirname "$0")/certs" && pwd)"
SERVER_HOST="${1:-virtuhar3d.local}"

mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_DIR/virtuhar3d-ca.key" ]; then
  openssl genrsa -out "$CERT_DIR/virtuhar3d-ca.key" 4096
  openssl req -x509 -new -nodes \
    -key "$CERT_DIR/virtuhar3d-ca.key" \
    -sha256 -days 1825 \
    -subj "/C=BR/ST=CE/O=EEEP Lab Informatica/CN=VIRTUHAR3D CA Interna" \
    -out "$CERT_DIR/virtuhar3d-ca.crt"
fi

cat > "$CERT_DIR/server.ext" <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = $SERVER_HOST
IP.1 = 127.0.0.1
EOF

openssl genrsa -out "$CERT_DIR/virtuhar3d.key" 2048
openssl req -new \
  -key "$CERT_DIR/virtuhar3d.key" \
  -subj "/C=BR/ST=CE/O=EEEP Lab Informatica/CN=$SERVER_HOST" \
  -out "$CERT_DIR/virtuhar3d.csr"

openssl x509 -req \
  -in "$CERT_DIR/virtuhar3d.csr" \
  -CA "$CERT_DIR/virtuhar3d-ca.crt" \
  -CAkey "$CERT_DIR/virtuhar3d-ca.key" \
  -CAcreateserial \
  -out "$CERT_DIR/virtuhar3d.crt" \
  -days 825 \
  -sha256 \
  -extfile "$CERT_DIR/server.ext"

rm -f "$CERT_DIR/virtuhar3d.csr" "$CERT_DIR/server.ext" "$CERT_DIR/virtuhar3d-ca.srl"

echo "Certificados gerados em $CERT_DIR"
echo "Instale $CERT_DIR/virtuhar3d-ca.crt como CA confiável nas estações Kubuntu 26.04."
