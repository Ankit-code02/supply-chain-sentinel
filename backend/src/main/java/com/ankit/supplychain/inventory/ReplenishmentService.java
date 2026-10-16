
package com.ankit.supplychain.inventory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

@Service
public class ReplenishmentService {

    private static final int SAFETY_BUFFER_DAYS = 7;

    private final InventoryRepository inventoryRepository;

    public ReplenishmentService(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    public record Recommendation(
            Long inventoryItemId,
            String sku,
            String itemName,
            String supplierName,
            int quantityOnHand,
            int reorderPoint,
            int leadTimeDays,
            BigDecimal averageDailyDemand,
            BigDecimal estimatedDaysOfStock,
            BigDecimal leadTimeDemand,
            int recommendedOrderQuantity,
            BigDecimal estimatedOrderCost,
            String priority,
            String explanation
    ) {}

    @Transactional(readOnly = true)
    public List<Recommendation> getRecommendations() {
        return inventoryRepository.findAll().stream()
                .map(this::calculate)
                .filter(r -> r.recommendedOrderQuantity() > 0)
                .sorted(Comparator
                        .comparingInt(this::priorityRank)
                        .thenComparing(
                                Recommendation::estimatedDaysOfStock,
                                Comparator.nullsLast(
                                        Comparator.naturalOrder())))
                .toList();
    }

    private Recommendation calculate(InventoryItem item) {
        int stock = item.getQuantityOnHand();
        int leadTime = item.getLeadTimeDays();
        int reorderPoint = item.getReorderPoint();

        BigDecimal demand = item.getAverageDailyDemand();
        BigDecimal unitCost = item.getUnitCost();

        BigDecimal stockDays = demand.signum() > 0
                ? BigDecimal.valueOf(stock).divide(
                demand, 2, RoundingMode.HALF_UP)
                : null;

        BigDecimal leadTimeDemand = demand.multiply(
                BigDecimal.valueOf(leadTime));

        int targetCoverageDays = leadTime + SAFETY_BUFFER_DAYS;

        BigDecimal targetStock = demand.multiply(
                BigDecimal.valueOf(targetCoverageDays));

        int recommendedQuantity = targetStock
                .subtract(BigDecimal.valueOf(stock))
                .max(BigDecimal.ZERO)
                .setScale(0, RoundingMode.CEILING)
                .intValueExact();

        // A reorder point remains an independent trigger.
        if (stock <= reorderPoint && recommendedQuantity == 0
                && demand.signum() > 0) {
            recommendedQuantity = 1;
        }

        BigDecimal estimatedCost = unitCost.multiply(
                        BigDecimal.valueOf(recommendedQuantity))
                .setScale(2, RoundingMode.HALF_UP);

        String priority;
        if (stock == 0 || (stockDays != null
                && stockDays.compareTo(
                BigDecimal.valueOf(leadTime)) < 0)) {
            priority = "CRITICAL";
        } else if (stock <= reorderPoint) {
            priority = "HIGH";
        } else {
            priority = "PLANNED";
        }

        String explanation;
        if (demand.signum() == 0) {
            explanation = "No positive daily demand is recorded. "
                    + "Review demand data before relying on a forecast.";
        } else {
            explanation = "Current stock covers "
                    + stockDays + " days. Lead-time demand is "
                    + leadTimeDemand.stripTrailingZeros().toPlainString()
                    + " units. Suggested quantity targets "
                    + targetCoverageDays
                    + " days of coverage, including a "
                    + SAFETY_BUFFER_DAYS + "-day buffer.";
        }

        return new Recommendation(
                item.getId(),
                item.getSku(),
                item.getName(),
                item.getSupplierName(),
                stock,
                reorderPoint,
                leadTime,
                demand,
                stockDays,
                leadTimeDemand.setScale(2, RoundingMode.HALF_UP),
                recommendedQuantity,
                estimatedCost,
                priority,
                explanation
        );
    }

    private int priorityRank(Recommendation recommendation) {
        return switch (recommendation.priority()) {
            case "CRITICAL" -> 0;
            case "HIGH" -> 1;
            default -> 2;
        };
    }
}
