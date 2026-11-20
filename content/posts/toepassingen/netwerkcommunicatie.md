---
title: "Netwerkcommunicatie"
excerpt: "Netwerkcommunicatie maakt het mogelijk dat de cliënt, mantelzorgers en professionals uit het zorg- en sociaal domein veilig berichten uitwisselen vanuit hun eigen applicatie, ook als zij bij verschillende organisaties werken en verschillende systemen gebruiken."
---
## Probleem en oplossing

Bij netwerkzorg werken de cliënt, mantelzorgers en professionals uit het zorg- en sociaal domein samen rond de zorg en ondersteuning van die cliënt. Maar zij gebruiken verschillende applicaties, die meestal niet rechtstreeks met elkaar communiceren. Daardoor gebruiken mensen meerdere kanalen naast elkaar, raakt de communicatie versnipperd en heeft niet iedereen op hetzelfde moment dezelfde informatie. De applicatie van een organisatie bepaalt nu vaak met wie iemand digitaal kan communiceren. Dat past niet bij netwerkzorg.

Dit speelt vooral wanneer verschillende organisaties samenwerken rondom dezelfde cliënt: huisartsen, ziekenhuizen, organisaties voor verpleging, verzorging en thuiszorg (VVT), geestelijke gezondheidszorg (GGZ) en gehandicaptenzorg, apotheken, gemeenten en welzijnsorganisaties, samen met de cliënt en mantelzorgers.

### Oplossing

Deelnemers kunnen berichten uitwisselen vanuit hun eigen applicatie, zowel bij gesprekken rondom een cliënt als bij communicatie tussen professionals en teams. Dat kan omdat de applicaties werken met gezamenlijke afspraken en open standaarden. Zo volgt de communicatie iedereen die bij de cliënt betrokken is, ook tussen zorg en bijvoorbeeld de gemeente of welzijnswerk. Dat vermindert versnippering, dubbele handelingen en afhankelijkheid van één communicatieplatform.

### Praktijkervaring

Hackathons, technische uitwerkingen en demonstraties laten zien dat berichtenuitwisseling tussen applicaties van verschillende leveranciers technisch mogelijk is. Er is al een technische implementatie van de toepassing.

De volgende stap is dat meer leveranciers aansluiten, zoals leveranciers van ECD's, systemen van huisartsen en cliëntapplicaties. Dan kan de toepassing in de praktijk worden beproefd en in gebruik worden genomen. Ben je softwareleverancier en wil je aansluiten? Neem contact op om de volgende stappen samen te zetten.

## Wat het doet

- Berichten uitwisselen tussen cliënten, mantelzorgers en professionals uit het zorg- en sociaal domein.
- Gesprekken voeren rondom een cliënt met deelnemers uit verschillende organisaties en applicaties.
- Deelnemers vinden en toevoegen: zowel individuele deelnemers als professionele teams.
- Verschillende gespreksvormen: één-op-één gesprekken, groepsgesprekken en communicatie tussen teams.
- Gestandaardiseerde uitwisseling van berichten, bijlagen, notificaties, deelnemers en leesstatussen tussen applicaties.

**Wat dit níet is:** geen centraal cliëntdossier en geen voorziening voor de eenmalige overdracht van een volledig dossier. Het is een berichtenfunctie die tussen verschillende applicaties werkt, voor samenwerking binnen het netwerk van de cliënt.

## Hoe het werkt

Een voorbeeld: een wijkverpleegkundige start vanuit het eigen elektronisch cliëntdossier (ECD) een bericht over een cliënt. De huisarts ontvangt en beantwoordt dit bericht vanuit het eigen systeem. Ook de cliënt en een mantelzorger kunnen vanuit een geschikte applicatie meedoen aan hetzelfde gesprek, voor zover zij daarvoor toegang hebben.

In grote lijnen werkt het zo:

1. Een deelnemer start vanuit de eigen applicatie een gesprek rondom een cliënt.
2. Andere relevante deelnemers uit het netwerk van de cliënt worden bij het gesprek betrokken, zoals professionals, teams, de cliënt zelf of een mantelzorger.
3. De applicaties wisselen de berichten onderling uit volgens gezamenlijke afspraken, zodat iedereen het gesprek in de eigen applicatie kan volgen.

De precieze rol van de Nuts-componenten hangt af van de gekozen technische uitwerking:

- **Adressering** — het Nuts-knooppunt is ontwikkeld voor de Generieke Functie Adressering. Het synchroniseert adresboeken tussen organisaties en applicaties, zodat organisaties, professionals en diensten te vinden en te bereiken zijn.
- **Autorisatie** — de Nuts-node kan worden gebruikt voor autorisatie tussen systemen.
- **Berichtenuitwisseling** — in de huidige uitwerking op basis van Matrix speelt de Nuts-node geen rol in de berichtenuitwisseling of autorisatie. Welke rol de Nuts-node hier krijgt, wordt nog uitgewerkt.

De toepassing kan verschillende technische mechanismen ondersteunen. De technische uitwerking komt op de Nuts Wiki.

## Rol van Nuts

Zonder gezamenlijke afspraken regelen leveranciers grotendeels onderling hoe applicaties elkaar vinden, hoe toegang wordt geregeld en hoe berichten worden uitgewisseld. Dat leidt tot veel losse koppelingen en maakt aansluiten voor nieuwe leveranciers lastiger. Het alternatief is één centraal platform, maar dan moet iedereen dezelfde applicatie gebruiken.

Nuts biedt een gezamenlijke basis voor adressering, via het Nuts-knooppunt, en voor autorisatie tussen systemen, met de Nuts-node, afhankelijk van de gekozen technische uitwerking. Leveranciers kunnen samen oplossingen ontwikkelen en beproeven en afspraken maken, zodat niet voor elke combinatie van systemen een aparte oplossing nodig is.

Netwerkcommunicatie krijgt pas echt waarde wanneer meerdere leveranciers aansluiten. De meerwaarde van Nuts zit daarom niet alleen in de techniek. Minstens zo belangrijk is de Nuts-community: daarin werkt al een groep softwareleveranciers samen aan interoperabiliteit en kunnen zij samen knelpunten voor gebruikers oplossen.

## Privacy

De grondslag hangt af van het doel van het gesprek, de deelnemers en de context. Tussen zorgprofessionals kan dat een behandelrelatie, medebehandelaarschap of wettelijke taak zijn. Voor een mantelzorger of een professional uit het sociaal domein kan toestemming of een andere passende grondslag nodig zijn. De deelnemende organisaties zijn verantwoordelijk voor het bepalen en vastleggen van de juiste grondslag.

Alleen deelnemers die aan een gesprek zijn toegevoegd en daarvoor bevoegd zijn, krijgen toegang, passend bij hun rol. Er worden niet meer persoonsgegevens gedeeld dan nodig voor het doel van het gesprek. De verwerking moet voldoen aan de AVG en aan de regels die gelden voor zorg en sociaal domein.

Is deelname gebaseerd op toestemming, dan kan de cliënt die weigeren of intrekken. De cliënt kan ook aangeven dat een mantelzorger of andere deelnemer geen toegang meer mag hebben. Die deelnemer ontvangt daarna geen nieuwe berichten meer. Wat die deelnemer al eerder heeft ontvangen en wat een organisatie volgens de wet moet bewaren, wordt niet automatisch verwijderd.

De verzender bepaalt wie een bericht ontvangt. Alleen die ontvangers zien het. Er is geen centrale bewaartermijn: wordt informatie in het cliënt- of patiëntdossier opgenomen, dan gelden de wettelijke bewaartermijnen van dat dossier, anders het bewaarbeleid van de organisatie.

De cliënt wordt geïnformeerd via de zorg- of cliëntapplicatie, de privacyverklaring en de verantwoordelijke organisatie. In de applicatie moet de cliënt, voor zover van toepassing, kunnen zien:

- welke gesprekken er rondom de cliënt zijn;
- welke personen, teams en organisaties deelnemen;
- welke berichten zijn uitgewisseld;
- hoe deelnemers worden toegevoegd of verwijderd;
- hoe toestemming kan worden ingetrokken;
- waar de cliënt terechtkan met vragen, bezwaren of een verzoek om inzage.

## Vraag je leverancier

Met netwerkcommunicatie wissel je berichten uit vanuit je eigen applicatie, ook met mensen die een ander systeem gebruiken. Dit werkt alleen als de leveranciers van al die systemen de afgesproken standaarden ondersteunen. Door ernaar te vragen, laat je zien dat er behoefte aan is.

> Is netwerkcommunicatie op Nuts voor jullie in beeld? Wij zouden het graag gebruiken met partijen die een ander systeem hebben.

## Links & contact

- **Specificatie (GitHub):** [toepassing-instante-communicatie](https://github.com/nuts-foundation/toepassing-instante-communicatie)
- **Nuts-specificatie (Wiki):** in ontwikkeling
- **Technische uitwerking (Wiki):** in ontwikkeling
- **Contact:** Kring Toepassingen
- **Contactpersoon:** Leendert de Gelder (functioneel)
- **Laatst bijgewerkt:** 27 oktober 2026
