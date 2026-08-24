# System Design Write-up: Last-Mile Delivery Tracker

**Architecture Overview**: The platform is an event-driven logistics engine built with Next.js 14 App Router, TypeScript, Prisma ORM, and SQLite/PostgreSQL. It delivers high-throughput rate quoting, spatial agent dispatching, append-only tracking audits, and customer-driven failure recovery.

---

## 1. Dynamic Rate Calculation Engine
The rate engine processes 5 pricing dimensions with **zero hardcoded values**: package geometry $(L \times W \times H)$, scale weight, order classification (`B2B` vs `B2C`), route locality (`INTRA_ZONE` vs `INTER_ZONE`), and payment mode (`PREPAID` vs `COD`).

1. **Volumetric Weight Calculation**: Packages consume vehicle volumetric capacity. Volumetric weight is normalized via the standard IATA logistics divisor:
   $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$
2. **Chargeable Weight**: The billable weight is established dynamically:
   $$\text{Chargeable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$
3. **Dynamic Rate Card Lookup**: The engine retrieves active rate cards (`RateCard`) matching `(OrderType, ZoneType)`. It calculates extra weight beyond the base threshold ($\max(0, \text{Chargeable Wt} - \text{Base Wt})$) and applies billable increments:
   $$\text{Shipping Charge} = \max\left(\text{Min Charge}, \text{Base Rate} + \lceil \text{Extra Weight} \rceil \times \text{Per Extra Kg Rate}\right)$$
4. **COD Risk Surcharge**: If `PaymentType == 'COD'`, the engine executes `SurchargeConfig` rules:
   $$\text{COD Fee} = \begin{cases} \max(\text{Min Fee}, \text{Fixed Fee}) & \text{if FIXED} \\ \max\left(\text{Min Fee}, \text{Declared Value} \times \frac{\text{Percentage}}{100}\right) & \text{if PERCENTAGE} \end{cases}$$
5. **Total Charge**: $\text{Total} = \text{Shipping Charge} + \text{COD Surcharge}$.

All parameters are admin-configurable in real time with instant cache invalidation.

---

## 2. Zone Detection & Spatial Mapping Approach
Geographic routing is decoupled from physical coordinates using a hierarchical Zone-Area model:
- **Zone Layer**: High-level logistics territories (e.g., `Metro North`, `Metro South`).
- **Area Layer**: Postal codes and city neighborhoods mapped directly to Parent Zones, tagged with reference coordinates $(Lat, Lng)$.

When an order is submitted:
1. Origin area and destination area resolve to `pickupZoneId` and `dropZoneId`.
2. Locality evaluation:
   $$\text{Zone Type} = \begin{cases} \text{INTRA\_ZONE} & \text{if } \text{pickupZoneId} = \text{dropZoneId} \\ \text{INTER\_ZONE} & \text{if } \text{pickupZoneId} \neq \text{dropZoneId} \end{cases}$$
3. This triggers the appropriate rate cards and informs dispatch routing heuristics.

---

## 3. Intelligent Auto-Assignment & Availability Modeling
Agent assignment balances spatial proximity, territorial coverage, and fleet workload to optimize first-attempt delivery rates:

1. **Workforce Filtering**: Identifies agents where `role == 'AGENT'`, `isAvailable == true`, and `activeDeliveries < maxCapacity`.
2. **Scoring Function**:
   $$\text{Score} = D_{\text{Haversine}}(\text{Agent}, \text{Pickup}) + P_{\text{zone}} + (W_{\text{active}} \times 2)$$
   - $D_{\text{Haversine}}$: Great-circle distance in km between agent coordinates and pickup location.
   - $P_{\text{zone}}$: $+25\text{km}$ cross-zone penalty if the agent is outside the pickup zone.
   - $W_{\text{active}}$: Active load weighting ($+2\text{km}$ penalty per active shipment) to avoid driver fatigue.
3. **Dispatch & Atomicity**: The lowest scoring candidate is assigned, agent active deliveries counter is incremented, and status transitions to `ASSIGNED`. Admins retain manual re-assignment override capabilities at all times.

---

## 4. Failed Delivery & Rescheduling State Machine
Real-world delivery exceptions (locked gates, customer unavailability, payment disputes) are managed through a closed-loop recovery workflow:

```
[OUT_FOR_DELIVERY] --(Delivery Attempt Fails)--> [FAILED]
                                                    ¦
                                         (Customer Notification)
                                                    ¦
                                         (Customer Picks Date/Slot)
                                                    ¦
                                                    ?
                                              [RESCHEDULED]
                                                    ¦
                                      (Auto-Reassignment Pipeline)
                                                    ¦
                                                    ?
                                            [OUT_FOR_DELIVERY]
```

1. **Failure Logging**: The delivery agent records the failure with mandatory taxonomy (e.g., *Customer Unavailable*, *Wrong Address*, *Premises Locked*) and field remarks. Order status shifts to `FAILED`.
2. **Customer Alerting**: Notification dispatchers emit instant SMS and Email containing direct self-service rescheduling links.
3. **Customer Reschedule Action**: The customer accesses their tracking timeline and selects a new delivery date, preferred time slot (e.g. *Morning*, *Afternoon*), and updated access notes.
4. **Re-assignment**: Status transitions to `RESCHEDULED`, a `RescheduleRequest` audit record is created, and the assignment engine re-evaluates the optimal agent for the rescheduled delivery window.
5. **Immutable Event Audit**: Every stage transition writes an append-only `TrackingEvent` with timestamp, actor identification, and geographic coordinates, providing total operational transparency.
