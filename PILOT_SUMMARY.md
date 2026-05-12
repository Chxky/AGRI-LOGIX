# Agri-Logix SeedTracker — Pilot Summary

## Golden Document: Pfumvudza Input Distribution Verification Platform

### The Problem
Zimbabwe's Pfumvudza/Agri-Inputs Scheme distributes subsidised seed and fertiliser to smallholder farmers across the country. With over 3 million beneficiary farming households and an annual input budget exceeding US$270 million, the government faces a critical challenge: **verification**. Without a system to track seed bags from warehouse to farmer, the Ministry of Agriculture cannot confirm that subsidised inputs reach intended recipients, and Treasury cannot release payments to seed houses with confidence.

### The Solution: Agri-Logix SeedTracker

A blockchain-anchored, mobile-first supply chain verification platform that tags certified seed bags with unique QR codes, enables farmers to confirm delivery via USSD or smartphone, and provides real-time reconciliation dashboards for government stakeholders.

### Pilot Scope
| Parameter | Detail |
|-----------|--------|
| **Geography** | 1 district (pilot phase) |
| **Partner Seed House** | 1 certified Pfumvudza supplier |
| **Product** | 5,000 seed bags (variety: SC513) |
| **Target Farmers** | 2,000 registered farming households |
| **Duration** | 8 weeks |
| **Budget** | US$15,000 (excl. USSD channel costs) |

### Technology Stack
- **Farmer Interface**: USSD (*123#) + Flutter smartphone app
- **Dashboard**: React + Ant Design (Seed House & Government portals)
- **Backend**: Firebase (Firestore, Cloud Functions, Auth)
- **Blockchain**: Immutable hash-chained audit trail on Firestore
- **Mapping**: Leaflet.js with GPS-verified redemptions
- **Hosting**: Firebase Hosting + Cloud Functions

### Key Metrics to Measure
1. **Redemption Rate**: % of dispatched bags confirmed by farmers
2. **Verification Gap**: Bags dispatched vs. bags redeemed (diversion detection)
3. **Time to Reconciliation**: Days from dispatch to verified payment report
4. **Farmer Adoption**: % of farmers using USSD vs. app
5. **Counterfeit Detection**: Number of flagged bags / suspicious QR codes

### Expected Outcomes
| Metric | Baseline (Current) | Target (Pilot) |
|--------|-------------------|----------------|
| Verification Accuracy | ~40% (manual) | >95% (digital) |
| Reconciliation Time | 3-6 months | <1 week |
| Input Diversion | Unknown | <5% |
| Subsidy Payment Delay | 12-18 months | <30 days |
| Data Integrity | Paper-based | Immutable audit trail |

### Pilot Partners
- **Seed House**: [Partner Name — e.g., Seed Co Zimbabwe]
- **District**: [Pilot District Name]
- **Extension Officers**: 10 trained officers
- **Technology Partner**: Agri-Logix

### Success Criteria
1. >80% of distributed bags are redeemed via USSD or app
2. <5% discrepancy between dispatched and redeemed bags
3. Treasury-ready payment report generated within 7 days of pilot end
4. Positive farmer feedback on USSD usability
5. Extension officers able to train farmers independently

### Budget Breakdown (Pilot)
| Item | Cost (USD) |
|------|-----------|
| QR sticker printing (5,000 units) | 500 |
| USSD channel setup (Africa's Talking) | 1,500 |
| Firebase infrastructure (2 months) | 400 |
| Extension officer training (2 sessions) | 2,000 |
| Field monitoring & data collection | 3,000 |
| Contingency | 2,600 |
| **Total** | **$10,000** |

### Roadmap to Scale
```
Phase 1 (Q1 2026): Pilot — 1 district, 1 seed house, 5,000 bags
    ↓
Phase 2 (Q2 2026): Expand — 5 districts, 3 seed houses, 100,000 bags
    ↓
Phase 3 (Q3 2026): National rollout — All 10 provinces, all certified seed houses
    ↓
Phase 4 (Q4 2026): Treasury integration — Direct payment trigger from verified data
```

### Risk Mitigation
| Risk | Mitigation |
|------|------------|
| Low farmer literacy | USSD with Shona/Ndebele prompts, extension officer support |
| Network coverage gaps | Offline scanning + batch sync, USSD works on 2G |
| QR sticker damage | Laminate stickers, include human-readable code |
| Counterfeit QR codes | Certification whitelist, hash-chain verification |
| Seed house resistance | Demonstrate payment acceleration benefit |

### Contact
**Agri-Logix** — SeedTracker Programme
Email: info@agri-logix.co.zw

---

*"Every seed bag counted. Every farmer verified. Every dollar accounted for."*
