#!/usr/bin/env bash
# Verifies a PKIoverheid truststore bundle (public/certs/*/truststore.pem) against the publisher.
# For every certificate in the bundle:
#   1. its DER thumbprint equals that of the copy downloaded from the "# Source:" URL above it;
#   2. it does not expire within EXPIRY_DAYS;
#   3. unless self-signed, it chains to a root in the bundle and is not on its issuer's CRL.
# Exit code 1 if any check fails. Requires openssl and curl.
set -euo pipefail

BUNDLE=${1:-public/certs/production/truststore.pem}
EXPIRY_DAYS=${EXPIRY_DAYS:-90}
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# Split the bundle into cert-NN.pem, with the Source URL in cert-NN.src.
awk -v d="$WORK" '
  /^# Source: /   { src=$3 }
  /BEGIN CERT/    { n++; f=sprintf("%s/cert-%02d.pem", d, n); printf "%s", src > sprintf("%s/cert-%02d.src", d, n); src="" }
  f               { print > f }
  /END CERT/      { close(f); f="" }
' "$BUNDLE"

fail=0
: > "$WORK/roots.pem"
: > "$WORK/intermediates.pem"

is_self_signed() {
  [ "$(openssl x509 -in "$1" -noout -subject_hash)" = "$(openssl x509 -in "$1" -noout -issuer_hash)" ]
}

common_name() {
  openssl x509 -in "$1" -noout -subject -nameopt multiline | sed -n 's/^ *commonName *= //p'
}

for pem in "$WORK"/cert-*.pem; do
  cn=$(common_name "$pem")
  src=$(cat "${pem%.pem}.src")

  # 1. Same bytes as the publisher's copy (DER).
  if [ -z "$src" ]; then
    echo "FAIL  no '# Source:' line: $cn"; fail=1
  else
    local_fp=$(openssl x509 -in "$pem" -outform DER | openssl dgst -sha256 -r | cut -c1-64)
    pub_fp=$(curl -sSfL "$src" | openssl dgst -sha256 -r | cut -c1-64)
    if [ "$local_fp" = "$pub_fp" ]; then
      echo "OK    matches publisher: $cn"
    else
      echo "FAIL  differs from publisher ($src): $cn"; fail=1
    fi
  fi

  # 2. Expiry.
  if ! openssl x509 -in "$pem" -noout -checkend $((EXPIRY_DAYS * 86400)) >/dev/null; then
    echo "FAIL  expires within $EXPIRY_DAYS days: $cn"; fail=1
  fi

  if is_self_signed "$pem"; then
    cat "$pem" >> "$WORK/roots.pem"
  else
    cat "$pem" >> "$WORK/intermediates.pem"
  fi
done

# 3. Chain and CRL check for every non-root certificate.
for pem in "$WORK"/cert-*.pem; do
  is_self_signed "$pem" && continue
  cn=$(common_name "$pem")
  crl_args=()
  cdp=$(openssl x509 -in "$pem" -noout -ext crlDistributionPoints 2>/dev/null | grep -o 'URI:[^ ]*' | head -1 | cut -c5- || true)
  if [ -n "$cdp" ]; then
    if curl -sSfL "$cdp" -o "$WORK/crl.bin"; then
      openssl crl -inform DER -in "$WORK/crl.bin" -out "$WORK/crl.pem" 2>/dev/null || cp "$WORK/crl.bin" "$WORK/crl.pem"
      crl_args=(-crl_check -CRLfile "$WORK/crl.pem")
    else
      echo "FAIL  CRL not downloadable ($cdp): $cn"; fail=1
    fi
  else
    echo "WARN  no CRL distribution point: $cn"
  fi
  if out=$(openssl verify -CAfile "$WORK/roots.pem" -untrusted "$WORK/intermediates.pem" "${crl_args[@]}" "$pem" 2>&1); then
    echo "OK    chain and CRL: $cn"
  else
    echo "FAIL  $cn: $(printf '%s' "$out" | tail -1)"; fail=1
  fi
done

if [ "$fail" -ne 0 ]; then
  echo "truststore verification FAILED"
  exit 1
fi
echo "truststore verification passed ($(ls "$WORK"/cert-*.pem | wc -l | tr -d ' ') certificates)"
