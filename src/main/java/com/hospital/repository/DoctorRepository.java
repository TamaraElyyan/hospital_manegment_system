package com.hospital.repository;

import com.hospital.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByLicenseNumber(String licenseNumber);
    List<Doctor> findBySpecialization(String specialization);
    List<Doctor> findByAvailable(Boolean available);
    Optional<Doctor> findByUserId(Long userId);
}
