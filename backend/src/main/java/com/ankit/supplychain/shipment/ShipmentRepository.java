
package com.ankit.supplychain.shipment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    Optional<Shipment> findByReference(String reference);

    boolean existsByReference(String reference);

    List<Shipment> findByStatus(Shipment.Status status);
}
