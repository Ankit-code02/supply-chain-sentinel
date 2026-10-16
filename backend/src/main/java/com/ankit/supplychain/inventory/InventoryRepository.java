package com.ankit.supplychain.inventory;

import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryRepository
        extends JpaRepository<InventoryItem, Long> {

    boolean existsBySkuIgnoreCase(String sku);
}