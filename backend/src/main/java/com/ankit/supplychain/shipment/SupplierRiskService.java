
package com.ankit.supplychain.shipment;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SupplierRiskService {

    private final ShipmentRepository shipmentRepository;

    public SupplierRiskService(ShipmentRepository shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }

    public record SupplierRiskResponse(
            String supplierName,
            int totalShipments,
            int completedDeliveries,
            int lateDeliveries,
            double onTimeDeliveryRate,
            double averageDelayDays,
            Integer riskScore,
            String riskLevel,
            String dataQuality,
            List<String> reasons
    ) {}

    @Transactional(readOnly = true)
    public List<SupplierRiskResponse> calculateSupplierRisks() {
        Map<String, List<Shipment>> shipmentsBySupplier =
                new LinkedHashMap<>();

        for (Shipment shipment : shipmentRepository.findAll()) {
            String supplier = shipment.getSupplierName();

            if (supplier == null || supplier.isBlank()) {
                continue;
            }

            shipmentsBySupplier
                    .computeIfAbsent(supplier.trim(), key -> new ArrayList<>())
                    .add(shipment);
        }

        return shipmentsBySupplier.entrySet().stream()
                .map(entry -> calculate(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(
                        SupplierRiskResponse::riskScore,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private SupplierRiskResponse calculate(
            String supplierName,
            List<Shipment> shipments) {

        List<Shipment> completed = shipments.stream()
                .filter(s -> s.getStatus() == Shipment.Status.DELIVERED)
                .filter(s -> s.getActualDelivery() != null)
                .filter(s -> s.getExpectedDelivery() != null)
                .toList();

        int totalCompleted = completed.size();

        if (totalCompleted == 0) {
            return new SupplierRiskResponse(
                    supplierName,
                    shipments.size(),
                    0,
                    0,
                    0.0,
                    0.0,
                    null,
                    "UNKNOWN",
                    "INSUFFICIENT_DATA",
                    List.of("No completed deliveries with actual delivery times.")
            );
        }

        List<Double> delayDays = completed.stream()
                .filter(s -> s.getActualDelivery()
                        .isAfter(s.getExpectedDelivery()))
                .map(s -> Duration.between(
                        s.getExpectedDelivery(),
                        s.getActualDelivery()).toSeconds() / 86400.0)
                .toList();

        int lateDeliveries = delayDays.size();

        double onTimeRate =
                (totalCompleted - lateDeliveries) * 100.0 / totalCompleted;

        double averageDelayDays = delayDays.stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        // 70% of the score comes from late-delivery frequency.
        double lateRate = lateDeliveries * 100.0 / totalCompleted;
        double frequencyRisk = lateRate * 0.70;

        // 30% comes from average delay duration, capped at 7 days.
        double delayRisk = Math.min(averageDelayDays / 7.0, 1.0) * 30.0;

        int score = (int) Math.round(
                Math.min(100.0, frequencyRisk + delayRisk));

        String riskLevel;
        if (score >= 70) {
            riskLevel = "HIGH";
        } else if (score >= 40) {
            riskLevel = "MEDIUM";
        } else {
            riskLevel = "LOW";
        }

        List<String> reasons = new ArrayList<>();

        reasons.add(lateDeliveries + " of " + totalCompleted
                + " completed deliveries were late.");

        reasons.add(String.format(
                java.util.Locale.ROOT,
                "On-time delivery rate: %.1f%%.",
                onTimeRate));

        if (lateDeliveries > 0) {
            reasons.add(String.format(
                    java.util.Locale.ROOT,
                    "Average delay among late deliveries: %.2f days.",
                    averageDelayDays));
        } else {
            reasons.add("No late deliveries in the recorded completed shipments.");
        }

        String dataQuality = totalCompleted < 5
                ? "LIMITED_HISTORY"
                : "SUFFICIENT_HISTORY";

        if (totalCompleted < 5) {
            reasons.add("Treat this score cautiously: fewer than 5 completed deliveries.");
        }

        return new SupplierRiskResponse(
                supplierName,
                shipments.size(),
                totalCompleted,
                lateDeliveries,
                Math.round(onTimeRate * 10.0) / 10.0,
                Math.round(averageDelayDays * 100.0) / 100.0,
                score,
                riskLevel,
                dataQuality,
                List.copyOf(reasons)
        );
    }
}
