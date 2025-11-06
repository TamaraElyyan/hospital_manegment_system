package com.hospital.repository;

import com.hospital.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByPatientNumber(String patientNumber);
    List<Patient> findByFullNameContainingIgnoreCase(String name);
    List<Patient> findByStatus(String status);
    boolean existsByPatientNumber(String patientNumber);
}
