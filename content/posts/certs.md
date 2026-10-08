---
layout: page
title: PKIoverheid truststores
permalink: /certs/
---

# PKIoverheid truststores

Deze pagina bevat de truststore-bundel met de CA-certificaten van PKIoverheid Private Services voor het productie- en test-netwerk van Nuts. Onder die hiërarchie geeft PKIoverheid UZI-servercertificaten en andere private servercertificaten uit. De Nuts-node gebruikt de bundel om de TLS-certificaten van andere nodes op het gRPC-netwerk te controleren. De reverse proxy gebruikt de bundel om de client-certificaten te controleren van partijen die de FHIR- of andere data-endpoints aanroepen.

| Bundel | Bestand | Hiërarchieën | Gebruik |
|---|---|---|---|
| Productie | [/certs/production/truststore.pem](/certs/production/truststore.pem) | PKIoverheid Private Services G1 en G4 | Het productie-netwerk en het test-netwerk (acceptatie) van Nuts |

Op het test-netwerk (acceptatie) gelden dezelfde PKIoverheid Private Services-certificaten als op productie. Het stable-netwerk (non-production) gebruikt geen PKIoverheid-certificaten, maar certificaten van de Nuts development CA. De truststore daarvoor staat in [nuts-foundation/nuts-development-network-ca](https://github.com/nuts-foundation/nuts-development-network-ca). De testcertificaten van CIBG (TEST en ACCEPTATIE) zitten niet in de bundel: die worden op geen enkel Nuts-netwerk gebruikt.

De bundel is een PEM-bestand. Boven elk certificaat staat als commentaar het subject, de bron-URL en de SHA-256 thumbprint. TLS-bibliotheken (OpenSSL, Go, nginx, HAProxy, Traefik) negeren die regels.

<div class="callout">
<p><strong>Controleer de bundel vóór gebruik.</strong> Nuts biedt de bundel aan als hulpmiddel; leveranciers blijven zelf verantwoordelijk voor de inhoud van hun truststore. Volg daarvoor de <a href="#verifieren">verificatiestappen</a> en vergelijk ieder certificaat met de uitgever (Logius of CIBG), ook na iedere update van de bundel.</p>
</div>

## Inhoud van de bundel

Binnen Nuts wordt ieder servercertificaat dat onder PKIoverheid Private Services is uitgegeven vertrouwd voor TLS-verbindingen, of dat nu door het UZI-register, KPN, DigiCert of Digidentity is gedaan. PKIoverheid noemt die uitgevers Trust Service Providers (TSP's). Daarom bevat de productiebundel de root-CA's, intermediate-CA's en TSP-CA's van al die uitgevers, niet alleen die van CIBG. De ZOVAR-CA's (certificaten voor zorgverzekeraars) zijn weggelaten om de bundel niet groter te maken dan nodig: zorgverzekeraars zijn nog niet actief in het Nuts-ecosysteem. Dat is geen beveiligingsmaatregel. ZOVAR-certificaten vallen onder hetzelfde PKIoverheid-regime en worden gewoon geaccepteerd als een partij zijn volledige keten meestuurt, want die valideert tegen dezelfde roots. De `did:x509`-pins in de toepassingsdefinities zijn wel UZI-specifiek, maar die staan los van deze bundel.

De ingetrokken TSP-CA's uit 2024 (zoals `UZI Server - G4 PKIo Priv G-TLS SYS - 2024`, ingetrokken op 29-10-2025) zitten **niet** in de bundel. De G1-hiërarchie verloopt in november 2028; vanaf 12 november 2026 geeft CIBG alleen nog onder G4 uit.

Bron: [cert.pkioverheid.nl](https://cert.pkioverheid.nl/) (Logius).

| Hiërarchie | Certificaat (subject CN) | Bron (download bij de uitgever) | SHA-256 thumbprint (DER) |
|---|---|---|---|
| G1 | Staat der Nederlanden Private Root CA - G1 | [PrivateRootCA-G1.cer](https://cert.pkioverheid.nl/PrivateRootCA-G1.cer) | 0257ce27b52408e24ee2c0945640b723c5bc66ddbda4ada58c60357604f0e675 |
| G1 | Staat der Nederlanden Private Services CA - G1 | [DomPrivateServicesCA-G1.cer](https://cert.pkioverheid.nl/DomPrivateServicesCA-G1.cer) | 2eaaf678e645dc26ea82c016ef3960935659cf81b4c44d9b2d0fb1a142666c98 |
| G1 | DigiCert QuoVadis PKIoverheid Private Services CA - 2023 | [DigiCertQuoVadisPKIoverheidPrivateServicesCA2023.cer](https://cert.pkioverheid.nl/DigiCertQuoVadisPKIoverheidPrivateServicesCA2023.cer) | b63a82ce98e9fe704dc42b7cb4b63d4bf0646b1d0754f9a4c696a4afb39436bc |
| G1 | Digidentity BV PKIoverheid Private Services CA - G1 | [Digidentity_BV_PKIoverheid_Private_Services_CA-G1.cer](https://cert.pkioverheid.nl/Digidentity_BV_PKIoverheid_Private_Services_CA-G1.cer) | bfe8f634772b0ec2cd2a41a17fc7612577d7e24f934073dec89a991b6169687e |
| G1 | KPN PKIoverheid Private Services CA - G1 | [KPN_PKIoverheid_Private_Services_CA-G1.cer](https://cert.pkioverheid.nl/KPN_PKIoverheid_Private_Services_CA-G1.cer) | bdb68500aaae2563c57b4525784360436d3e3fd8df974b25a77f132cecc2a49d |
| G1 | QuoVadis PKIoverheid Private Services CA - G1 | [QuoVadis_PKIoverheid_Private_Services_CA-G1.cer](https://cert.pkioverheid.nl/QuoVadis_PKIoverheid_Private_Services_CA-G1.cer) | 69df8d18c54503f83dc239c3dcf8115b2a447efc5defca6119d18e988c12276d |
| G1 | UZI-register Private Server CA G1 | [UZI-register_Private_Server_CA_G1.cer](https://cert.pkioverheid.nl/UZI-register_Private_Server_CA_G1.cer) | bdd860ef8e87e2b2c7ebb34dd6e9e1771a3a3c5dec850ba7080e3e2904dbd897 |
| G4 | Staat der Nederlanden - G4 Root Priv G-TLS - 2024 | [StaatderNederlandenG4RootPrivGTLS2024.cer](https://cert.pkioverheid.nl/StaatderNederlandenG4RootPrivGTLS2024.cer) | 4411f67d3d7f4f49d34ff8862249de0d6692adc92df0855fb1dd67a169800484 |
| G4 | Staat der Nederlanden - G4 Intm Priv G-TLS SYS - 2024 | [StaatderNederlandenG4IntmPrivGTLSSYS2024.cer](https://cert.pkioverheid.nl/StaatderNederlandenG4IntmPrivGTLSSYS2024.cer) | a24f6f2fa192dd96ceeaf8d4c380d8663426f95858956a5adff5cfd36b30554f |
| G4 | DigiCert - G4 PKIo Priv G-TLS SYS - 2025 | [DigiCertG4PKIoPrivGTLSSYS2025.cer](https://cert.pkioverheid.nl/DigiCertG4PKIoPrivGTLSSYS2025.cer) | a3234374ce91c000c929c66daade6c85457d61850e6fb388e349fd710a9bb305 |
| G4 | Digidentity - G4 PKIo Priv G-TLS SYS - 2025 | [DigidentityG4PKIoPrivGTLSSYS2025.cer](https://cert.pkioverheid.nl/DigidentityG4PKIoPrivGTLSSYS2025.cer) | fc6b0573c096991e59e886e28e314dfd74d96a8ea3976e197f23c2e5c49acd87 |
| G4 | KPN - G4 PKIo Priv G-TLS SYS - 2025 | [KPNG4PKIoPrivGTLSSYS2025.cer](https://cert.pkioverheid.nl/KPNG4PKIoPrivGTLSSYS2025.cer) | 2b4ee93832a4b2ca349e86c21caf8f959b106c2d0aa6fd49a983fca00574d1a6 |
| G4 | UZI Server - G4 PKIo Priv G-TLS SYS - 2025 | [UZIServerG4PKIoPrivGTLSSYS2025.cer](https://cert.pkioverheid.nl/UZIServerG4PKIoPrivGTLSSYS2025.cer) | b034cbfffcafe784edaef49fefad354edbc7823d8d6522d3da6f8e91ff28aa42 |

## Gebruik van de bundel

De bundel hoort in de truststore van de Nuts-node en in de client-certificaatconfiguratie van de reverse proxy, voor de endpoints die mTLS vereisen. Zie de [Nuts-node documentatie](https://nuts-node.readthedocs.io/en/stable/) voor de configuratie.

<h2 id="verifieren">Verifiëren</h2>

Twee stappen volstaan. Haal de twee roots op bij de uitgever en vergelijk hun thumbprints met de tabel hierboven (de G4-root ook met [uziregister.nl](https://www.uziregister.nl/softwareleveranciers/ca-certificaten-g4), waar CIBG de SHA-1- en SHA-256-thumbprints publiceert). Controleer daarna dat ieder certificaat in de bundel door een van die roots is ondertekend, direct of via een intermediate uit de bundel. Alleen wie de privésleutel van een root heeft, kan een certificaat maken dat eraan koppelt, dus hiermee is de hele bundel gecontroleerd. Van de bundel als geheel publiceren we bewust geen checksum.

```sh
# 1. Haal de twee roots bij de uitgever en toon hun thumbprints.
#    Vergelijk die met de tabel; de G4-root ook met uziregister.nl.
for r in PrivateRootCA-G1 StaatderNederlandenG4RootPrivGTLS2024; do
  curl -sSf "https://cert.pkioverheid.nl/$r.cer" -o "$r.cer"
  openssl x509 -inform DER -in "$r.cer" -noout -subject -fingerprint -sha256
  openssl x509 -inform DER -in "$r.cer" >> roots.pem
done

# 2. Controleer dat ieder certificaat in de bundel door een van die roots is ondertekend.
#    Verwacht: 13 regels die eindigen op OK.
awk '/BEGIN CERT/{f=sprintf("bundle-%02d.pem",++n)} f{print > f} /END CERT/{f=""}' truststore.pem
for f in bundle-*.pem; do
  openssl verify -CAfile roots.pem -untrusted truststore.pem "$f"
done
```

Dezelfde controle, aangevuld met een check op verloopdatum en intrekking (CRL) van ieder certificaat, draait wekelijks en bij iedere wijziging van de bundel: [scripts/verify-truststore.sh](https://github.com/nuts-foundation/nuts-webpresence/blob/master/scripts/verify-truststore.sh).

## Beheer

Een fout of verlopen certificaat gezien? [Meld het via een issue](https://github.com/nuts-foundation/nuts-webpresence/issues). Een beveiligingsprobleem, bijvoorbeeld een certificaat in de bundel dat niet van de uitgever afkomstig is? Meld dat niet via een openbaar issue, maar volg de [responsible-disclosureprocedure van Nuts](https://github.com/nuts-foundation/nuts-node/blob/master/SECURITY.md).
