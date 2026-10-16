
package com.ankit.supplychain.shipment;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierRiskController {

    private final SupplierRiskService supplierRiskService;

    public SupplierRiskController(
            SupplierRiskService supplierRiskService) {
        this.supplierRiskService = supplierRiskService;
    }

    @GetMapping("/risks")
    public List<SupplierRiskService.SupplierRiskResponse> getSupplierRisks() {
        return supplierRiskService.calculateSupplierRisks();
    }
}
