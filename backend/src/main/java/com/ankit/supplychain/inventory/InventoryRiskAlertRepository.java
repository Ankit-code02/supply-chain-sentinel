
package com.ankit.supplychain.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InventoryRiskAlertRepository
        extends JpaRepository<InventoryRiskAlert, Long> {

    boolean existsByInventoryItemIdAndRiskTypeAndStatus(
            Long inventoryItemId,
            InventoryRiskAlert.RiskType riskType,
            InventoryRiskAlert.Status status);

    List<InventoryRiskAlert> findByStatusOrderByCreatedAtDesc(
            InventoryRiskAlert.Status status);
}
