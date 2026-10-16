package com.ankit.supplychain.inventory;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String sku;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(name = "warehouse_location", nullable = false)
    private String warehouseLocation;

    @Column(name = "supplier_name", nullable = false)
    private String supplierName;

    @Column(name = "quantity_on_hand", nullable = false)
    private int quantityOnHand;

    @Column(name = "reorder_point", nullable = false)
    private int reorderPoint;

    @Column(name = "average_daily_demand", nullable = false)
    private BigDecimal averageDailyDemand;

    @Column(name = "lead_time_days", nullable = false)
    private int leadTimeDays;

    @Column(name = "unit_cost", nullable = false)
    private BigDecimal unitCost;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected InventoryItem() {}

    public InventoryItem(
            String sku, String name, String category,
            String warehouseLocation, String supplierName,
            int quantityOnHand, int reorderPoint,
            BigDecimal averageDailyDemand, int leadTimeDays,
            BigDecimal unitCost) {
        this.sku = sku;
        this.name = name;
        this.category = category;
        this.warehouseLocation = warehouseLocation;
        this.supplierName = supplierName;
        this.quantityOnHand = quantityOnHand;
        this.reorderPoint = reorderPoint;
        this.averageDailyDemand = averageDailyDemand;
        this.leadTimeDays = leadTimeDays;
        this.unitCost = unitCost;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void changeStock(int quantity) {
        if (quantity < 0) {
            throw new IllegalArgumentException(
                    "Inventory cannot become negative");
        }
        this.quantityOnHand = quantity;
    }

    public Long getId() { return id; }
    public String getSku() { return sku; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getWarehouseLocation() { return warehouseLocation; }
    public String getSupplierName() { return supplierName; }
    public int getQuantityOnHand() { return quantityOnHand; }
    public int getReorderPoint() { return reorderPoint; }
    public BigDecimal getAverageDailyDemand() { return averageDailyDemand; }
    public int getLeadTimeDays() { return leadTimeDays; }
    public BigDecimal getUnitCost() { return unitCost; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}