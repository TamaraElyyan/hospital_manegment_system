package com.hospital.controller;

import com.hospital.model.Appointment;
import com.hospital.model.Invoice;
import com.hospital.model.Patient;
import com.hospital.model.Role;
import com.hospital.repository.AppointmentRepository;
import com.hospital.repository.InvoiceRepository;
import com.hospital.repository.PatientRepository;
import com.hospital.service.CurrentUserService;
import com.hospital.service.DoctorDataScopeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private CurrentUserService currentUserService;

    @Autowired
    private DoctorDataScopeService doctorDataScopeService;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        var userOpt = currentUserService.getCurrentUser();
        if (userOpt.isPresent() && userOpt.get().getRole() == Role.PATIENT) {
            return ResponseEntity.ok(
                    currentUserService.getCurrentPatient()
                            .map(p -> invoiceRepository.findByPatientId(p.getId()))
                            .orElse(new ArrayList<>()));
        }
        var docOpt = currentUserService.getCurrentDoctor();
        if (docOpt.isEmpty()) {
            return ResponseEntity.ok(invoiceRepository.findAll());
        }
        var ids = new ArrayList<>(doctorDataScopeService.getAccessiblePatientIds(docOpt.get()));
        if (ids.isEmpty()) {
            return ResponseEntity.ok(new ArrayList<>());
        }
        return ResponseEntity.ok(invoiceRepository.findByPatientIdIn(ids));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<?> getInvoiceById(@PathVariable Long id) {
        Optional<Invoice> opt = invoiceRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        var docOpt = currentUserService.getCurrentDoctor();
        if (docOpt.isPresent()) {
            var inv = opt.get();
            if (inv.getPatient() == null
                    || !doctorDataScopeService.canDoctorAccessPatient(
                            docOpt.get(), inv.getPatient().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
            }
        }
        var userOpt = currentUserService.getCurrentUser();
        if (userOpt.isPresent() && userOpt.get().getRole() == Role.PATIENT) {
            Long pid = opt.get().getPatient() != null ? opt.get().getPatient().getId() : null;
            if (!currentUserService.isSelfPatientRecord(pid)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
            }
        }
        return ResponseEntity.ok(opt.get());
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<?> getInvoicesByPatient(@PathVariable Long patientId) {
        var userOpt = currentUserService.getCurrentUser();
        if (userOpt.isPresent() && userOpt.get().getRole() == Role.PATIENT
                && !currentUserService.isSelfPatientRecord(patientId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }
        var docOpt = currentUserService.getCurrentDoctor();
        if (docOpt.isPresent() && !doctorDataScopeService.canDoctorAccessPatient(docOpt.get(), patientId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }
        return ResponseEntity.ok(invoiceRepository.findByPatientId(patientId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<?> createInvoice(@RequestBody Invoice request) {
        if (request.getPatient() == null || request.getPatient().getId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("patient.id is required");
        }
        Long patientId = request.getPatient().getId();
        Optional<Patient> pOpt = patientRepository.findById(patientId);
        if (pOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Patient not found");
        }
        Patient patient = pOpt.get();
        Appointment appointment = null;
        if (request.getAppointment() != null && request.getAppointment().getId() != null) {
            Long apptId = request.getAppointment().getId();
            Optional<Appointment> aOpt = appointmentRepository.findById(apptId);
            if (aOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Appointment not found");
            }
            appointment = aOpt.get();
            if (appointment.getPatient() == null || !appointment.getPatient().getId().equals(patientId)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("The appointment does not belong to the selected patient");
            }
            Optional<Invoice> dup = invoiceRepository.findByAppointment_Id(appointment.getId());
            if (dup.isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("This appointment is already linked to an invoice");
            }
        }

        String invNo = request.getInvoiceNumber();
        if (invNo == null || invNo.isEmpty()) {
            invNo = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invNo);
        invoice.setPatient(patient);
        invoice.setAppointment(appointment);
        invoice.setConsultationFee(request.getConsultationFee() != null ? request.getConsultationFee() : BigDecimal.ZERO);
        invoice.setMedicationCost(request.getMedicationCost() != null ? request.getMedicationCost() : BigDecimal.ZERO);
        invoice.setTestsCost(request.getTestsCost() != null ? request.getTestsCost() : BigDecimal.ZERO);
        invoice.setRoomCharges(request.getRoomCharges() != null ? request.getRoomCharges() : BigDecimal.ZERO);
        invoice.setOtherCharges(request.getOtherCharges() != null ? request.getOtherCharges() : BigDecimal.ZERO);
        invoice.setPaidAmount(request.getPaidAmount() != null ? request.getPaidAmount() : BigDecimal.ZERO);
        invoice.setPaymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : "UNPAID");
        invoice.setDescription(request.getDescription());

        BigDecimal consultation = invoice.getConsultationFee();
        BigDecimal total = consultation
                .add(invoice.getMedicationCost() != null ? invoice.getMedicationCost() : BigDecimal.ZERO)
                .add(invoice.getTestsCost() != null ? invoice.getTestsCost() : BigDecimal.ZERO)
                .add(invoice.getRoomCharges() != null ? invoice.getRoomCharges() : BigDecimal.ZERO)
                .add(invoice.getOtherCharges() != null ? invoice.getOtherCharges() : BigDecimal.ZERO);
        invoice.setTotalAmount(total);
        invoice.setBalanceAmount(total.subtract(invoice.getPaidAmount()));

        return ResponseEntity.ok(invoiceRepository.save(invoice));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<?> updateInvoice(@PathVariable Long id, @RequestBody Invoice invoiceDetails) {
        Optional<Invoice> opt = invoiceRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Invoice invoice = opt.get();
        Long patientId = invoice.getPatient().getId();

        if (invoiceDetails.getAppointment() != null) {
            if (invoiceDetails.getAppointment().getId() == null) {
                invoice.setAppointment(null);
            } else {
                Long apptId = invoiceDetails.getAppointment().getId();
                Optional<Appointment> aOpt = appointmentRepository.findById(apptId);
                if (aOpt.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Appointment not found");
                }
                Appointment a = aOpt.get();
                if (a.getPatient() == null || !a.getPatient().getId().equals(patientId)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("The appointment does not belong to this invoice's patient");
                }
                Optional<Invoice> dup = invoiceRepository.findByAppointment_Id(apptId);
                if (dup.isPresent() && !dup.get().getId().equals(id)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body("This appointment is already linked to another invoice");
                }
                invoice.setAppointment(a);
            }
        }

        if (invoiceDetails.getConsultationFee() != null) {
            invoice.setConsultationFee(invoiceDetails.getConsultationFee());
        }
        invoice.setMedicationCost(invoiceDetails.getMedicationCost() != null ? invoiceDetails.getMedicationCost() : BigDecimal.ZERO);
        invoice.setTestsCost(invoiceDetails.getTestsCost() != null ? invoiceDetails.getTestsCost() : BigDecimal.ZERO);
        invoice.setRoomCharges(invoiceDetails.getRoomCharges() != null ? invoiceDetails.getRoomCharges() : BigDecimal.ZERO);
        invoice.setOtherCharges(invoiceDetails.getOtherCharges() != null ? invoiceDetails.getOtherCharges() : BigDecimal.ZERO);
        invoice.setPaidAmount(invoiceDetails.getPaidAmount() != null ? invoiceDetails.getPaidAmount() : BigDecimal.ZERO);
        invoice.setPaymentStatus(invoiceDetails.getPaymentStatus() != null ? invoiceDetails.getPaymentStatus() : invoice.getPaymentStatus());
        invoice.setDescription(invoiceDetails.getDescription());

        BigDecimal consultation = invoice.getConsultationFee() != null ? invoice.getConsultationFee() : BigDecimal.ZERO;
        BigDecimal total = consultation
                .add(invoice.getMedicationCost() != null ? invoice.getMedicationCost() : BigDecimal.ZERO)
                .add(invoice.getTestsCost() != null ? invoice.getTestsCost() : BigDecimal.ZERO)
                .add(invoice.getRoomCharges() != null ? invoice.getRoomCharges() : BigDecimal.ZERO)
                .add(invoice.getOtherCharges() != null ? invoice.getOtherCharges() : BigDecimal.ZERO);
        invoice.setTotalAmount(total);
        invoice.setBalanceAmount(total.subtract(invoice.getPaidAmount() != null ? invoice.getPaidAmount() : BigDecimal.ZERO));

        return ResponseEntity.ok(invoiceRepository.save(invoice));
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
