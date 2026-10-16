
package com.ankit.supplychain.inventory;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/risks")
public class InventoryRiskController {

    private final InventoryRiskDetectionService riskService;

    public InventoryRiskController(
            InventoryRiskDetectionService riskService) {
        this.riskService = riskService;
    }

    @PostMapping("/scan")
    public InventoryRiskDetectionService.ScanResult scan() {
        return riskService.scan();
    }

    @GetMapping
    public List<InventoryRiskDetectionService.AlertResponse> alerts() {
        return riskService.findOpenAlerts();
    }
}
