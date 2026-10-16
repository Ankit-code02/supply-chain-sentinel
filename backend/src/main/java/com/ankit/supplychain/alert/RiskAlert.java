
package com.ankit.supplychain.alert;

import com.ankit.supplychain.shipment.Shipment;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "risk_alerts")
public class RiskAlert {

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum Status {
        OPEN, RESOLVED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shipment_id", nullable = false)
    private Shipment shipment;

    @Column(name = "risk_type", nullable = false, length = 40)
    private String riskType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Severity severity;

    @Column(nullable = false, length = 500)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.OPEN;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected RiskAlert() {}

    public RiskAlert(Shipment shipment, String riskType,
                     Severity severity, String message) {
        this.shipment = shipment;
        this.riskType = riskType;
        this.severity = severity;
        this.message = message;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public Shipment getShipment() { return shipment; }
    public String getRiskType() { return riskType; }
    public Severity getSeverity() { return severity; }
    public String getMessage() { return message; }
    public Status getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
