
package com.ankit.supplychain.inventory;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/replenishment")
public class ReplenishmentController {

    private final ReplenishmentService replenishmentService;

    public ReplenishmentController(
            ReplenishmentService replenishmentService) {
        this.replenishmentService = replenishmentService;
    }

    @GetMapping
    public List<ReplenishmentService.Recommendation> getRecommendations() {
        return replenishmentService.getRecommendations();
    }
}
