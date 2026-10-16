
package com.ankit.supplychain.inventory;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "inventory_risk_alerts")
public class InventoryRiskAlert {

    public enum RiskType {
        LOW_STOCK,
        STOCKOUT_RISK
    }

    public enum Severity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public enum Status {
        OPEN,
        RESOLVED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "inventory_item_id", nullable = false)
    private Long inventoryItemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_type", nullable = false)
    private RiskType riskType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Column(nullable = false, length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.OPEN;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    protected InventoryRiskAlert() {
    }

    public InventoryRiskAlert(
            Long inventoryItemId,
            RiskType riskType,
            Severity severity,
            String message) {
        this.inventoryItemId = inventoryItemId;
        this.riskType = riskType;
        this.severity = severity;
        this.message = message;
        this.status = Status.OPEN;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public void resolve() {
        status = Status.RESOLVED;
        resolvedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Long getInventoryItemId() { return inventoryItemId; }
    public RiskType getRiskType() { return riskType; }
    public Severity getSeverity() { return severity; }
    public String getMessage() { return message; }
    public Status getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getResolvedAt() { return resolvedAt; }
}
