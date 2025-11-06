package com.hospital.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(nullable = false)
    private BigDecimal consultationFee = BigDecimal.ZERO;

    private BigDecimal medicationCost = BigDecimal.ZERO;

    private BigDecimal testsCost = BigDecimal.ZERO;

    private BigDecimal roomCharges = BigDecimal.ZERO;

    private BigDecimal otherCharges = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    private BigDecimal paidAmount = BigDecimal.ZERO;

    private BigDecimal balanceAmount = BigDecimal.ZERO;

    @Column(nullable = false)
    private String paymentStatus = "UNPAID";

    @Column(length = 1000)
    private String description;

    @CreationTimestamp
    private LocalDateTime issuedDate;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
