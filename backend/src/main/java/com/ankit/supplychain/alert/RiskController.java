package com.ankit.supplychain.alert;

import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api")
public class RiskController {

    private final RiskDetectionService service;

    public RiskController(RiskDetectionService service) {
        this.service = service;
    }

    public record ScanResponse(int alertsCreated) {}

    public record AlertResponse(
            Long id,
            Long shipmentId,
            String shipmentReference,
            String riskType,
            RiskAlert.Severity severity,
            String message,
            RiskAlert.Status status,
            Instant createdAt) {

        static AlertResponse from(RiskAlert alert) {
            return new AlertResponse(
                    alert.getId(),
                    alert.getShipment().getId(),
                    alert.getShipment().getReference(),
                    alert.getRiskType(),
                    alert.getSeverity(),
                    alert.getMessage(),
                    alert.getStatus(),
                    alert.getCreatedAt());
        }
    }

    @PostMapping("/risks/scan")
    public ScanResponse scan() {
        return new ScanResponse(service.scanOverdueShipments());
    }

    @GetMapping("/alerts")
    public List<AlertResponse> alerts() {
        return service.findOpenAlerts()
                .stream()
                .map(AlertResponse::from)
                .toList();
    }
}
