package com.ankit.supplychain.inventory;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService service;

    public InventoryController(InventoryService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryService.ItemResponse create(
            @RequestBody InventoryService.CreateRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<InventoryService.ItemResponse> findAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public InventoryService.ItemResponse findById(
            @PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping("/{id}/movements")
    public InventoryService.ItemResponse movement(
            @PathVariable Long id,
            @RequestBody InventoryService.MovementRequest request) {
        return service.recordMovement(id, request);
    }

    @GetMapping("/{id}/movements")
    public List<InventoryMovement> movements(@PathVariable Long id) {
        return service.movements(id);
    }
}