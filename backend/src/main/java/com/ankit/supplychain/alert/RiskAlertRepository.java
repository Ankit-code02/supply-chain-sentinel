package com.ankit.supplychain.alert;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RiskAlertRepository extends JpaRepository<RiskAlert, Long> {

    boolean existsByShipment_IdAndRiskTypeAndStatus(
            Long shipmentId,
            String riskType,
            RiskAlert.Status status);

    @Query("""
            SELECT alert
            FROM RiskAlert alert
            JOIN FETCH alert.shipment
            WHERE alert.status = :status
            ORDER BY alert.createdAt DESC
            """)
    List<RiskAlert> findOpenAlertsWithShipment(
            @Param("status") RiskAlert.Status status);
}