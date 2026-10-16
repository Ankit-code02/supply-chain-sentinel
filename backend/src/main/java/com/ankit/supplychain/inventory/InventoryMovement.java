package com.ankit.supplychain.inventory;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "inventory_movements")
public class InventoryMovement {

    public enum Type {
        RECEIPT, CONSUMPTION, ADJUSTMENT, RETURN
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "inventory_item_id", nullable = false)
    private Long inventoryItemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false)
    private Type movementType;

    @Column(name = "quantity_delta", nullable = false)
    private int quantityDelta;

    @Column(nullable = false, length = 300)
    private String reason;

    @Column(length = 100)
    private String reference;

    @Column(name = "occurred_at", nullable = false, updatable = false)
    private Instant occurredAt;

    protected InventoryMovement() {}

    public InventoryMovement(Long itemId, Type type, int delta,
                             String reason, String reference) {
        this.inventoryItemId = itemId;
        this.movementType = type;
        this.quantityDelta = delta;
        this.reason = reason;
        this.reference = reference;
    }

    @PrePersist
    void onCreate() {
        occurredAt = Instant.now();
    }

    public Long getId() { return id; }
    public Long getInventoryItemId() { return inventoryItemId; }
    public Type getMovementType() { return movementType; }
    public int getQuantityDelta() { return quantityDelta; }
    public String getReason() { return reason; }
    public String getReference() { return reference; }
    public Instant getOccurredAt() { return occurredAt; }
}