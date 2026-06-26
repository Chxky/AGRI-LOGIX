
You are a senior systems architect and security engineer specialising in cross‑border digital public infrastructure. Build the complete Minimum Viable Product (MVP) for “SADC‑Guard” – a trilateral security and trade cooperation platform that unites South Africa, Botswana, and Zimbabwe. The platform must respect full national data sovereignty, operate offline in remote border areas, and comply with the strictest data protection and encryption standards in the region.

## 1. Core Mission
SADC‑Guard is a thin, interoperable layer that connects the existing law enforcement, identity, and border management systems of three SADC member states. It enables real‑time, encrypted sharing of anonymised threat intelligence, biometric watchlist cross‑matching, and joint border post operations – without any single country surrendering control of its data.

## 2. Core Modules

### 2.1 Cross‑Border Watchlist Exchange
- A real‑time, event‑driven messaging layer between SAPS (South Africa), Botswana Police Service, and Zimbabwe Republic Police.
- Alerts on: wanted persons, stolen vehicles, suspicious cargo, missing persons, travel bans.
- All alerts are encrypted end‑to‑end (AES‑256) and signed with the originating country’s digital certificate.
- The receiving country only gets an anonymised alert digest unless its query matches a watchlist record, after which a secure, logged request for full details can be made.
- Every alert and access request is immutably logged on a shared, distributed audit chain (Hyperledger Fabric or a lightweight hash‑chain across three nodes) to prevent tampering and build trust.

### 2.2 Joint Biometric Screening
- An extension of UBIL principles: authorised border officers can scan a fingerprint, face, or iris and instantly query whether the person is flagged in any of the three national databases.
- Biometric templates are irreversibly hashed before any cross‑border comparison; raw biometric data never leaves the home country.
- The query returns only a match/no‑match token. If there’s a hit, the officer must submit a formal, logged request for identity details, which can be approved or denied by the home country’s system.
- Uses zero‑knowledge proofs wherever possible (e.g., “Person is wanted” without revealing the nature of the offence until authorised).

### 2.3 Border Post Command Centre
- A lightweight dashboard for border management agencies showing live traffic flows, alert queues, and resource status at major border posts (e.g., Beitbridge, Kazungula, Groblersbrug).
- Works fully offline on ruggedised tablets in the bush; syncs via encrypted batch uploads when connectivity returns.
- Integrates with existing customs declaration systems and vehicle registration databases via adapters.

### 2.4 Cross‑Border Trade & Travel Facilitation
- A trusted traveller programme that allows pre‑vetted, biometric‑verified frequent traders and tourists to use dedicated fast‑track lanes.
- Integrates with ZimVisit for tourism bookings, allowing a seamless, secure journey that simultaneously feeds arrival/departure data into the command centre.
- Includes a digital document vault for permits, visas, and vehicle clearance certificates – verifiable instantly by any border officer via QR code, even offline.

## 3. Federated Architecture & Data Sovereignty
- Each country hosts its own **national node** (on‑premise or sovereign cloud) that contains its full police, identity, and customs databases.
- A **shared orchestration layer** (hosted neutrally, e.g., by SADC or a jointly governed entity) handles only encrypted alert routing, tokenised biometric matching, and the distributed audit log.
- No raw personal data ever leaves the originating country without explicit, logged, multi‑party authorisation.
- The system is designed so that any country can unilaterally suspend participation without destabilising the others – a core trust requirement.

## 4. Tech Stack (Aligned with Your Existing Ecosystem)

| Component | Technology |
|-----------|------------|
| National Node Backend | NestJS (Node.js) + FastAPI (Python) for biometric microservices |
| Shared Orchestration Layer | NestJS with Apache Kafka for encrypted event streaming |
| Distributed Audit Log | Hyperledger Fabric (preferred) or a lightweight Firestore‑based hash‑chain across three cloud regions |
| Mobile Field App | Flutter (Dart) – works offline on tablets/phones, integrates fingerprint/face scanners, generates QR codes |
| Border Post Dashboard | React (TypeScript) + Ant Design |
| USSD/SMS Fallback | Africa’s Talking – for officers in remote areas to query watchlist status via text |
| Biometric Matching | Neurotechnology MegaMatcher or Innovatrics – deployed within each national node, exposing only a hashed match API |
| Encryption & Signing | Mutual TLS 1.3 for inter‑node communication, AES‑256‑GCM for data at rest, Ed25519 digital signatures for all alert payloads |
| Device Security | X.509 certificates provisioned for every authorised device; lost devices can be remotely revoked |

## 5. Security & Compliance (SADC‑Wide)

- **Data Protection Laws:** Full compliance with South Africa’s POPIA, Zimbabwe’s Cyber and Data Protection Act, Botswana’s Data Protection Act, and the SADC Model Law on Data Protection.
- **Consent & Purpose Limitation:** Biometric queries are only permitted for border security and law enforcement purposes, strictly logged, and auditable.
- **Breach Notification:** Automated 24‑hour notification to all affected nations’ data protection authorities if any encrypted alert stream is compromised.
- **Regular Penetration Testing:** Architecture supports mandatory annual penetration testing by an independent SADC‑recognised cybersecurity firm.

## 6. Database Schema (Per National Node)

Each country’s node contains its own copy of these collections (Firestore or PostgreSQL):

### `watchlist`
- entryId (auto), subjectIdentifier (hashed), alertType, severity, issuingAuthority, encryptedPayload, timestamp, expiry

### `biometricHashes`
- hashId (auto), subjectIdentifier (hashed national ID), templateHash (SHA‑256 salted), modality (fingerprint/face/iris), lastUpdated

### `borderPostLogs`
- logId (auto), officerId, borderPost, queryType, queryHash, result (match/no‑match), timestamp, geolocation

### `trustedTravellers`
- travellerId (auto), encryptedIdentity, biometricHash, vehiclePlate (encrypted), status, expiry

### `auditTrail` (also replicated in the shared layer)
- eventId (auto), nodeOrigin, eventType, encryptedSummary, digitalSignature, timestamp

## 7. Cloud Functions / APIs (National Node & Shared Layer)

1. `pushAlert` – Creates a watchlist alert, encrypts it, signs it, and pushes the digest to the shared orchestrator.
2. `queryBiometric` – Receives a hashed biometric template, broadcasts to all participating nodes, returns match/no‑match token.
3. `requestFullIdentity` – Logged, formal request for identity details after a biometric hit. Requires authorisation from the home country.
4. `getBorderPostStatus` – Returns live traffic, alert queue, and resource data for a specific border post.
5. `enrolTrustedTraveller` – Vets and registers a traveller, issues a QR‑coded digital pass stored offline on their device.
6. `verifyDocument` – Scans a QR code (visa, permit, vehicle clearance) and returns validity status even offline.
7. `suspendNode` – Emergency function allowing any country to temporarily suspend its participation while keeping the shared audit trail intact.

## 8. Offline & Remote Area Design
- Flutter app caches the last 30 days of watchlist digests and biometric hash‑indexes for offline matching.
- When a border post is offline, the officer can still scan a person’s fingerprint; the app checks against the local cache and queues the query for sync.
- USSD codes allow officers with feature phones to type in a person’s ID number and receive a colour‑coded risk response (Green/Clear, Amber/Wanted, Red/Armed & Dangerous) within seconds.

## 9. Development Roadmap (12‑Week MVP)

| Weeks | Focus |
|-------|-------|
| 1‑2 | Architecture: set up three national node environments (simulated), shared Kafka orchestrator, and Hyperledger Fabric network. |
| 3‑4 | Watchlist Exchange: alert creation, encryption, signing, pushing to shared layer, and consumption by other nodes. |
| 5‑6 | Biometric Screening: hashed template matching API within each node, cross‑node query orchestrator, match token response, formal identity request flow. |
| 7‑8 | Border Post Dashboard & Field App: build React dashboard with live feeds, Flutter offline app with biometric scanner integration, QR document verification. |
| 9‑10 | Trusted Traveller Programme: enrolment, digital pass generation, fast‑track lane integration. USSD fallback for remote queries. |
| 11‑12 | Security hardening, penetration testing plan, SADC compliance documentation, demo data seeder, pilot preparation guide. |

## 10. Deliverables
- Full source code for each national node (Node/NestJS + FastAPI), the shared orchestrator, the React dashboard, and the Flutter field app.
- Hyperledger Fabric chaincode or hash‑chain implementation, with deployment scripts.
- Firestore/PostgreSQL schemas and security rules.
- `README.md` covering setup, environment variables, and deployment across three simulated countries.
- A one‑page SADC‑Guard Golden Document and a trilateral pilot proposal brief.

Now, using the above specification, generate the complete codebase for SADC‑Guard. Start with the shared orchestration layer and the national node backend, then the React dashboard and Flutter field app. Ensure all code is well‑commented, respects the federated architecture, and is ready for a trilateral pilot involving South Africa, Botswana, and Zimbabwe.