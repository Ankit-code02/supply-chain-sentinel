
package com.ankit.supplychain.shipment;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ShipmentService {

    private final ShipmentRepository repository;

    public ShipmentService(ShipmentRepository repository) {
        this.repository = repository;
    }

    public Shipment create(Shipment shipment) {
        if (repository.existsByReference(shipment.getReference())) {
            throw new IllegalArgumentException("Shipment reference already exists");
        }

        shipment.setStatus(Shipment.Status.PENDING);
        return repository.save(shipment);
    }

    @Transactional(readOnly = true)
    public List<Shipment> findAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Shipment findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ShipmentNotFoundException(id));
    }

    public Shipment updateStatus(Long id, Shipment.Status status) {
        Shipment shipment = findById(id);

        if (shipment.getStatus() == Shipment.Status.CANCELLED
                || shipment.getStatus() == Shipment.Status.DELIVERED) {
            throw new IllegalStateException(
                    "Cannot change the status of a completed or cancelled shipment");
        }

        if (status == null) {
            throw new IllegalArgumentException("Shipment status is required");
        }

        shipment.setStatus(status);

        if (status == Shipment.Status.DELIVERED) {
            shipment.setActualDelivery(java.time.Instant.now());
        }

        return repository.save(shipment);
    }
}
