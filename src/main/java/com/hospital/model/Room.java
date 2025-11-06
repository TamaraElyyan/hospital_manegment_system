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
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String roomNumber;

    @Column(nullable = false)
    private String roomType;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    private String floor;

    private Integer capacity;

    @Column(nullable = false)
    private String status = "AVAILABLE";

    private BigDecimal chargesPerDay;

    @ManyToOne
    @JoinColumn(name = "current_patient_id")
    private Patient currentPatient;

    @Column(length = 1000)
    private String facilities;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
