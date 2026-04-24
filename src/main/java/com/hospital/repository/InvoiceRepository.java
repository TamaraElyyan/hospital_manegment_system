package com.hospital.repository;

import com.hospital.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    List<Invoice> findByPatientId(Long patientId);
    List<Invoice> findByPaymentStatus(String paymentStatus);
    List<Invoice> findByPatientIdIn(List<Long> patientIds);
    long countByPatientIdIn(List<Long> patientIds);

    long countByPatient_Id(Long patientId);

    Optional<Invoice> findByAppointment_Id(Long appointmentId);
}
