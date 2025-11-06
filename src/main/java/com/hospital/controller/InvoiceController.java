package com.hospital.controller;

import com.hospital.model.Invoice;
import com.hospital.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoiceById(@PathVariable Long id) {
        return invoiceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Invoice>> getInvoicesByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(invoiceRepository.findByPatientId(patientId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<?> createInvoice(@RequestBody Invoice invoice) {
        if (invoice.getInvoiceNumber() == null || invoice.getInvoiceNumber().isEmpty()) {
            invoice.setInvoiceNumber("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        
        BigDecimal total = invoice.getConsultationFee()
                .add(invoice.getMedicationCost() != null ? invoice.getMedicationCost() : BigDecimal.ZERO)
                .add(invoice.getTestsCost() != null ? invoice.getTestsCost() : BigDecimal.ZERO)
                .add(invoice.getRoomCharges() != null ? invoice.getRoomCharges() : BigDecimal.ZERO)
                .add(invoice.getOtherCharges() != null ? invoice.getOtherCharges() : BigDecimal.ZERO);
        
        invoice.setTotalAmount(total);
        invoice.setBalanceAmount(total.subtract(invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO));
        
        Invoice savedInvoice = invoiceRepository.save(invoice);
        return ResponseEntity.ok(savedInvoice);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<?> updateInvoice(@PathVariable Long id, @RequestBody Invoice invoiceDetails) {
        return invoiceRepository.findById(id)
                .map(invoice -> {
                    invoice.setConsultationFee(invoiceDetails.getConsultationFee());
                    invoice.setMedicationCost(invoiceDetails.getMedicationCost());
                    invoice.setTestsCost(invoiceDetails.getTestsCost());
                    invoice.setRoomCharges(invoiceDetails.getRoomCharges());
                    invoice.setOtherCharges(invoiceDetails.getOtherCharges());
                    invoice.setPaidAmount(invoiceDetails.getPaidAmount());
                    invoice.setPaymentStatus(invoiceDetails.getPaymentStatus());
                    invoice.setDescription(invoiceDetails.getDescription());
                    
                    BigDecimal total = invoice.getConsultationFee()
                            .add(invoice.getMedicationCost() != null ? invoice.getMedicationCost() : BigDecimal.ZERO)
                            .add(invoice.getTestsCost() != null ? invoice.getTestsCost() : BigDecimal.ZERO)
                            .add(invoice.getRoomCharges() != null ? invoice.getRoomCharges() : BigDecimal.ZERO)
                            .add(invoice.getOtherCharges() != null ? invoice.getOtherCharges() : BigDecimal.ZERO);
                    
                    invoice.setTotalAmount(total);
                    invoice.setBalanceAmount(total.subtract(invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO));
                    
                    return ResponseEntity.ok(invoiceRepository.save(invoice));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteInvoice(@PathVariable Long id) {
        return invoiceRepository.findById(id)
                .map(invoice -> {
                    invoiceRepository.delete(invoice);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
