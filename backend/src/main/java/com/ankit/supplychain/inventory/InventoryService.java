package com.ankit.supplychain.inventory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class InventoryService {

    private final InventoryRepository items;
    private final InventoryMovementRepository movements;

    public InventoryService(
            InventoryRepository items,
            InventoryMovementRepository movements) {
        this.items = items;
        this.movements = movements;
    }

    public record CreateRequest(
            String sku, String name, String category,
            String warehouseLocation, String supplierName,
            int quantityOnHand, int reorderPoint,
            BigDecimal averageDailyDemand, int leadTimeDays,
            BigDecimal unitCost) {}

    public record ItemResponse(
            Long id, String sku, String name, String category,
            String warehouseLocation, String supplierName,
            int quantityOnHand, int reorderPoint,
            BigDecimal averageDailyDemand, int leadTimeDays,
            BigDecimal unitCost, boolean lowStock,
            BigDecimal estimatedDaysOfStock) {

        static ItemResponse from(InventoryItem item) {
            BigDecimal demand = item.getAverageDailyDemand();
            BigDecimal days = demand.signum() > 0
                    ? BigDecimal.valueOf(item.getQuantityOnHand())
                    .divide(demand, 2, java.math.RoundingMode.HALF_UP)
                    : null;

            return new ItemResponse(
                    item.getId(), item.getSku(), item.getName(),
                    item.getCategory(), item.getWarehouseLocation(),
                    item.getSupplierName(), item.getQuantityOnHand(),
                    item.getReorderPoint(), demand, item.getLeadTimeDays(),
                    item.getUnitCost(),
                    item.getQuantityOnHand() <= item.getReorderPoint(),
                    days);
        }
    }

    public record MovementRequest(
            InventoryMovement.Type type, int quantity,
            String reason, String reference) {}

    @Transactional
    public ItemResponse create(CreateRequest request) {
        if (request.sku() == null || request.sku().isBlank()
                || request.name() == null || request.name().isBlank()
                || request.category() == null || request.category().isBlank()
                || request.warehouseLocation() == null
                || request.warehouseLocation().isBlank()
                || request.supplierName() == null
                || request.supplierName().isBlank()
                || request.averageDailyDemand() == null
                || request.unitCost() == null) {
            throw new IllegalArgumentException(
                    "Required inventory fields must be provided");
        }

        if (request.quantityOnHand() < 0 || request.reorderPoint() < 0
                || request.leadTimeDays() < 0
                || request.averageDailyDemand().signum() < 0
                || request.unitCost().signum() < 0) {
            throw new IllegalArgumentException(
                    "Inventory quantities, demand, lead time and cost "
                            + "cannot be negative");
        }

        if (items.existsBySkuIgnoreCase(request.sku().trim())) {
            throw new IllegalArgumentException("SKU already exists");
        }

        InventoryItem item = items.save(new InventoryItem(
                request.sku().trim(), request.name().trim(),
                request.category().trim(),
                request.warehouseLocation().trim(),
                request.supplierName().trim(),
                request.quantityOnHand(), request.reorderPoint(),
                request.averageDailyDemand(), request.leadTimeDays(),
                request.unitCost()));

        if (item.getQuantityOnHand() > 0) {
            movements.save(new InventoryMovement(
                    item.getId(), InventoryMovement.Type.RECEIPT,
                    item.getQuantityOnHand(), "Initial stock",
                    "INITIAL-STOCK"));
        }

        return ItemResponse.from(item);
    }

    @Transactional(readOnly = true)
    public List<ItemResponse> findAll() {
        return items.findAll().stream()
                .map(ItemResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ItemResponse findById(Long id) {
        return ItemResponse.from(getItem(id));
    }

    @Transactional
    public ItemResponse recordMovement(
            Long id, MovementRequest request) {
        if (request.type() == null || request.quantity() <= 0
                || request.reason() == null
                || request.reason().isBlank()) {
            throw new IllegalArgumentException(
                    "Movement type, positive quantity and reason are required");
        }

        InventoryItem item = getItem(id);
        int delta;

        switch (request.type()) {
            case RECEIPT, RETURN -> delta = request.quantity();
            case CONSUMPTION -> delta = -request.quantity();
            case ADJUSTMENT -> throw new IllegalArgumentException(
                    "Use RECEIPT, CONSUMPTION or RETURN for now");
            default -> throw new IllegalArgumentException(
                    "Unsupported movement type");
        }

        int newQuantity;
        try {
            newQuantity = Math.addExact(item.getQuantityOnHand(), delta);
        } catch (ArithmeticException ex) {
            throw new IllegalArgumentException("Stock quantity overflow");
        }

        if (newQuantity < 0) {
            throw new IllegalArgumentException(
                    "Insufficient stock for this movement");
        }

        item.changeStock(newQuantity);

        movements.save(new InventoryMovement(
                item.getId(), request.type(), delta,
                request.reason().trim(), request.reference()));

        return ItemResponse.from(item);
    }

    @Transactional(readOnly = true)
    public List<InventoryMovement> movements(Long id) {
        getItem(id);
        return movements
                .findByInventoryItemIdOrderByOccurredAtDesc(id);
    }

    private InventoryItem getItem(Long id) {
        return items.findById(id).orElseThrow(
                () -> new IllegalArgumentException(
                        "Inventory item not found: " + id));
    }
}