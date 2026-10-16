
package com.ankit.supplychain.inventory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class InventoryRiskDetectionService {

    private final InventoryRepository inventoryRepository;
    private final InventoryRiskAlertRepository alertRepository;

    public InventoryRiskDetectionService(
            InventoryRepository inventoryRepository,
            InventoryRiskAlertRepository alertRepository) {
        this.inventoryRepository = inventoryRepository;
        this.alertRepository = alertRepository;
    }

    public record ScanResult(
            int itemsScanned,
            int alertsCreated) {
    }

    public record AlertResponse(
            Long id,
            Long inventoryItemId,
            String sku,
            String itemName,
            String riskType,
            String severity,
            String message,
            String status,
            java.time.Instant createdAt) {
    }

    @Transactional
    public ScanResult scan() {
        List<InventoryItem> items = inventoryRepository.findAll();
        int created = 0;

        for (InventoryItem item : items) {
            int quantity = item.getQuantityOnHand();
            int reorderPoint = item.getReorderPoint();
            int leadTime = item.getLeadTimeDays();

            BigDecimal demand = item.getAverageDailyDemand();

            BigDecimal stockDays = demand.signum() > 0
                    ? BigDecimal.valueOf(quantity).divide(
                    demand, 2,
                    java.math.RoundingMode.HALF_UP)
                    : null;

            if (quantity <= reorderPoint) {
                created += createIfMissing(
                        item,
                        InventoryRiskAlert.RiskType.LOW_STOCK,
                        quantity == 0
                                ? InventoryRiskAlert.Severity.CRITICAL
                                : InventoryRiskAlert.Severity.HIGH,
                        "Stock is " + quantity + " units, at or below the "
                                + reorderPoint + "-unit reorder point.");
            }

            if (stockDays != null
                    && stockDays.compareTo(
                    BigDecimal.valueOf(leadTime)) < 0) {
                created += createIfMissing(
                        item,
                        InventoryRiskAlert.RiskType.STOCKOUT_RISK,
                        stockDays.signum() == 0
                                ? InventoryRiskAlert.Severity.CRITICAL
                                : InventoryRiskAlert.Severity.HIGH,
                        "Estimated stock coverage is " + stockDays
                                + " days, shorter than the supplier lead time of "
                                + leadTime + " days.");
            }
        }

        return new ScanResult(items.size(), created);
    }

    private int createIfMissing(
            InventoryItem item,
            InventoryRiskAlert.RiskType type,
            InventoryRiskAlert.Severity severity,
            String message) {

        boolean exists = alertRepository
                .existsByInventoryItemIdAndRiskTypeAndStatus(
                        item.getId(),
                        type,
                        InventoryRiskAlert.Status.OPEN);

        if (exists) {
            return 0;
        }

        alertRepository.save(new InventoryRiskAlert(
                item.getId(), type, severity, message));
        return 1;
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> findOpenAlerts() {
        return alertRepository
                .findByStatusOrderByCreatedAtDesc(
                        InventoryRiskAlert.Status.OPEN)
                .stream()
                .map(alert -> {
                    InventoryItem item = inventoryRepository
                            .findById(alert.getInventoryItemId())
                            .orElse(null);

                    return new AlertResponse(
                            alert.getId(),
                            alert.getInventoryItemId(),
                            item == null ? null : item.getSku(),
                            item == null ? null : item.getName(),
                            alert.getRiskType().name(),
                            alert.getSeverity().name(),
                            alert.getMessage(),
                            alert.getStatus().name(),
                            alert.getCreatedAt());
                })
                .toList();
    }
}
