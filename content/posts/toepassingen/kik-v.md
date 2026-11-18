---
title: "KIK-V"
excerpt: "KIK-V maakt het voor partijen mogelijk om volgens gezamenlijke afspraken kwaliteitsinformatie uit de verpleeghuiszorg op te vragen."
status: "In productie"
---
## Probleem en oplossing

Verpleeghuizen krijgen van veel partijen vragen over hun kwaliteit en bedrijfsvoering: zorgkantoren, toezichthouders zoals de Nederlandse Zorgautoriteit (NZa) en de Inspectie Gezondheidszorg en Jeugd (IGJ), het ministerie van Volksgezondheid, Welzijn en Sport (VWS), Zorginstituut Nederland, brancheorganisaties en cliëntorganisaties. Elk van deze partijen vraagt op een eigen moment, met eigen definities en via een eigen portaal of spreadsheet.

Daardoor verzamelen verpleeghuizen dezelfde gegevens, zoals personeelssamenstelling, cliëntaantallen en basisveiligheid, steeds opnieuw met de hand. Dat kost veel tijd en levert cijfers op die onderling niet vergelijkbaar zijn. De ketenpartijen krijgen laat, onvolledig of niet-vergelijkbaar materiaal. En de zorgaanbieder ziet weinig van wat er met zijn gegevens gebeurt.

### Oplossing

KIK-V staat voor **Keteninformatie Kerngegevens Verbeteren**. Ketenpartijen en zorgaanbieders spreken samen af welke gegevens over kwaliteit, personeel en financiën ze uitwisselen en waarom. Die afspraken staan in openbare **uitwisselprofielen**, met per ketenpartij de **gevalideerde vragen** die zij mag stellen.

De zorgaanbieder maakt zijn gegevens één keer beschikbaar in een **KIK-V-datastation**: een dienst die hij afneemt bij een leverancier, gevuld vanuit zijn eigen systemen, zoals het elektronisch cliëntdossier, de personeelsadministratie en de financiële administratie. Ketenpartijen stellen hun vragen via **KIK-Starter**, de centrale vraagapplicatie. Het datastation berekent het antwoord, de zorgaanbieder controleert het en geeft het zelf vrij.

Zo is er één definitie per vraag, legt de zorgaanbieder gegevens één keer vast en bedient hij daarmee meerdere ketenpartijen. De regie blijft bij de zorgaanbieder. KIK-V gaat over verantwoording, inkoop, toezicht, beleid en keuze-informatie voor cliënten, niet over de zorg rond één cliënt.

## Wat het doet

- **Gevalideerde vragen stellen:** een ketenpartij stelt via KIK-Starter een vraag aan één of meer zorgaanbieders tegelijk.
- **Antwoord berekenen bij de bron:** het datastation van de zorgaanbieder berekent het antwoord uit de eigen gegevens.
- **Controleren en vrijgeven:** de zorgaanbieder bekijkt het antwoord, corrigeert het zo nodig en bepaalt zelf wanneer hij het vrijgeeft.
- **Ontvangen en doorzetten:** de ketenpartij krijgt een melding en zet het antwoord door naar haar eigen systeem.
- **Toegang bewaken en vastleggen:** het datastation accepteert alleen gevalideerde vragen. Vragen en antwoorden worden vastgelegd.

**Wat dit níet is:** geen dashboard, geen vervanging van bronsystemen zoals het elektronisch cliëntdossier en geen uitwisseling van cliëntdossiers. KIK-V deelt alleen geaggregeerde informatie.

## Hoe het werkt

KIK-Starter, de datastations en de beheerorganisatie KIK-V hebben elk een eigen digitale identiteit in het Nuts-netwerk. Voor elke gevalideerde vraag geeft de beheerorganisatie de ketenpartij een *verifiable credential*: een digitaal bewijs dat zij die vraag mag stellen. Het datastation kan dat bewijs zelf controleren, zonder tussenkomst van de beheerorganisatie.

Een voorbeeld: een zorgkantoor wil voor de zorginkoop weten hoe het personeel per vestiging is samengesteld.

1. Het zorgkantoor kiest in KIK-Starter de gevalideerde vraag uit het uitwisselprofiel voor zorginkoop en selecteert de zorgaanbieders in zijn regio.
2. KIK-Starter zoekt via het Nuts-netwerk het datastation van elke zorgaanbieder op en stuurt de vraag, met de verifiable credential, rechtstreeks en beveiligd naar dat datastation.
3. Het datastation controleert wie de vraag stelt, of de vraag geldig is en niet is ingetrokken, en of de beheerorganisatie KIK-V de vraag heeft uitgegeven. Daarna berekent het het antwoord.
4. Na vrijgave door de zorgaanbieder stuurt het datastation het antwoord terug, elektronisch verzegeld zodat vaststaat van wie het komt. KIK-Starter meldt dat aan het zorgkantoor.

De belangrijkste controles zijn:

- **Gedeelde begrippen** — alle partijen gebruiken dezelfde definities. Daardoor zijn antwoorden vergelijkbaar en herbruikbaar.
- **Gevalideerde vraag** — het datastation controleert technisch of een vraag is toegestaan en niet is ingetrokken.
- **Berekenen bij de bron** — alleen geaggregeerde antwoorden worden gedeeld: totalen of percentages die niet tot personen te herleiden zijn. Ruwe gegevens blijven bij de zorgaanbieder.
- **Vrijgave en vastleggen** — de zorgaanbieder geeft antwoorden zelf vrij. Elke vraag en elk antwoord wordt vastgelegd.

## Rol van Nuts

Bij KIK-V wisselen **zorgaanbieders in de verpleeghuiszorg** via hun datastation gegevens uit met **ketenpartijen**: zorgkantoren, NZa, IGJ, VWS, Zorginstituut Nederland, het Rijksinstituut voor Volksgezondheid en Milieu (RIVM), brancheorganisatie ActiZ en Patiëntenfederatie Nederland. De **beheerorganisatie KIK-V** beheert de uitwisselprofielen en geeft de gevalideerde vragen uit. **KIK-Starter** stelt vragen namens ketenpartijen die zelf geen Nuts-node willen of hoeven te beheren.

Zonder het Nuts-netwerk zijn er aparte koppelingen nodig tussen elke ketenpartij en elk type datastation, elk met eigen afspraken over identificatie, beveiliging en toegang. Het alternatief is een centrale voorziening met de gegevens van alle zorgaanbieders. Dat wil KIK-V juist voorkomen.

Het Nuts-netwerk levert het vertrouwen en de vindbaarheid: digitale identiteiten, verifiable credentials en een register waarin partijen elkaar kunnen vinden. Elk datastation heeft één aansluiting, waarmee nieuwe ketenpartijen en zorgaanbieders kunnen aansluiten zonder extra koppelingen. Datastations van verschillende leveranciers werken op dezelfde manier samen, en de gegevens blijven bij de bron: alleen het vrijgegeven antwoord wordt gedeeld.

## Privacy

Er worden geen persoonsgegevens uitgewisseld. Het gaat alleen om geaggregeerde gegevens die niet tot personen te herleiden zijn, op basis van een openbaar uitwisselprofiel. Voor een deel van de ketenpartijen, zoals de NZa en de IGJ, ligt er een wettelijke taak onder de vraag. Elke nieuwe indicator, zoals het ziekteverzuimpercentage, krijgt een privacytoets.

De ketenpartij gebruikt het antwoord alleen voor het doel uit het uitwisselprofiel en ziet alleen de antwoorden op haar eigen vragen. De zorgaanbieder beslist zelf of hij een antwoord vrijgeeft en ziet in zijn datastation welke vragen zijn binnengekomen. De beheerorganisatie kan gevalideerde vragen op ieder moment intrekken.

Keuze of bezwaar voor de cliënt is niet van toepassing: er worden geen gegevens over individuele cliënten gedeeld. De berekening vindt plaats binnen de organisatie van de zorgaanbieder, met de leverancier van het datastation als verwerker. Uitwisselprofielen en gevalideerde vragen zijn openbaar op het KIK-V-publicatieplatform; de zorgaanbieder kan in zijn privacyverklaring vermelden dat hij via KIK-V geaggregeerde kwaliteitsinformatie deelt.

## Vraag je leverancier

Met KIK-V beantwoord je uitvragen van ketenpartijen één keer vanuit je eigen gegevens, zonder handmatig verzamelen en aanleveren.

> Ondersteunt jullie software KIK-V? Zo niet, staat dit op de roadmap?

> Bieden jullie een KIK-V-datastation aan, of werken jullie samen met een leverancier die dat doet?

## Links & contact

- **Technische specificaties (KIK-V):** [KIK-V op Nuts](https://kik-v-publicatieplatform.nl/documentatie/nuts-technischespecificaties)
- **Code (GitLab):** [kik-v/nuts](https://gitlab.com/kik-v/nuts)
- **Afsprakenset (KIK-V):** [Afsprakenset KIK-V](https://kik-v-publicatieplatform.nl/afsprakenset)
- **Implementatie (KIK-V):** [Implementatiedocumentatie KIK-V](https://kik-v-publicatieplatform.nl/implementatie-documentatie)
- **Datastation (KIK-V):** [Datastation KIK-V](https://www.kik-v.nl/onderwerpen/d/datastation-kik-v)
- **Programma KIK-V (Zorginstituut):** [kik-v.nl](https://www.kik-v.nl/)
- **Initiatief:** Zorginstituut Nederland, programma KIK-V in opdracht van VWS
- **Contact:** Kring Toepassingen
- **Contactpersoon:** Ruben Kreuwel
