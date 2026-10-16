
package com.ankit.supplychain.shipment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShipmentService service;

    public ShipmentController(ShipmentService service) {
        this.service = service;
    }

    public record CreateShipmentRequest(
            @NotBlank @Size(max = 50) String reference,
            @NotBlank @Size(max = 150) String origin,
            @NotBlank @Size(max = 150) String destination,
            @Size(max = 200) String supplierName,
            @NotNull Instant expectedDelivery
    ) {}

    public record UpdateStatusRequest(
            @NotNull Shipment.Status status
    ) {}

    public record ShipmentResponse(
            Long id,
            String reference,
            String origin,
            String destination,
            String supplierName,
            Instant expectedDelivery,
            Instant actualDelivery,
            Shipment.Status status
    ) {
        static ShipmentResponse from(Shipment s) {
            return new ShipmentResponse(
                    s.getId(),
                    s.getReference(),
                    s.getOrigin(),
                    s.getDestination(),
                    s.getSupplierName(),
                    s.getExpectedDelivery(),
                    s.getActualDelivery(),
                    s.getStatus()
            );
        }
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShipmentResponse create(
            @Valid @RequestBody CreateShipmentRequest request) {
        Shipment shipment = new Shipment();
        shipment.setReference(request.reference().trim());
        shipment.setOrigin(request.origin().trim());
        shipment.setDestination(request.destination().trim());
        shipment.setExpectedDelivery(request.expectedDelivery());
        shipment.setSupplierName(
                request.supplierName() == null
                        || request.supplierName().isBlank()
                        ? null
                        : request.supplierName().trim()
        );

        return ShipmentResponse.from(service.create(shipment));
    }

    @GetMapping
    public List<ShipmentResponse> findAll() {
        return service.findAll().stream()
                .map(ShipmentResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public ShipmentResponse findById(@PathVariable Long id) {
        return ShipmentResponse.from(service.findById(id));
    }

    @PatchMapping("/{id}/status")
    public ShipmentResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ShipmentResponse.from(
                service.updateStatus(id, request.status()));
    }
}
