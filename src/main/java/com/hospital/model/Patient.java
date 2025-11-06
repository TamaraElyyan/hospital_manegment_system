package com.hospital.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String patientNumber;

    @Column(nullable = false)
    private String fullName;

    private LocalDate dateOfBirth;

    private Integer age;

    @Column(nullable = false)
    private String gender;

    private String phone;

    private String email;

    private String address;

    private String bloodType;

    @Column(length = 2000)
    private String medicalHistory;

    @Column(length = 2000)
    private String allergies;

    private String emergencyContact;

    private String emergencyPhone;

    @Column(nullable = false)
    private String status = "ACTIVE";

    @ManyToOne
    @JoinColumn(name = "assigned_doctor_id")
    private Doctor assignedDoctor;

    @CreationTimestamp
    private LocalDateTime registeredAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
