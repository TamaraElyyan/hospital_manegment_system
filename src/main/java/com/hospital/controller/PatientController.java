package com.hospital.controller;

import com.hospital.model.Patient;
import com.hospital.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    @Autowired
    private PatientRepository patientRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<List<Patient>> getAllPatients() {
        return ResponseEntity.ok(patientRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT')")
    public ResponseEntity<?> getPatientById(@PathVariable Long id) {
        return patientRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<List<Patient>> searchPatients(@RequestParam String name) {
        return ResponseEntity.ok(patientRepository.findByFullNameContainingIgnoreCase(name));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<?> createPatient(@RequestBody Patient patient) {
        if (patient.getPatientNumber() == null || patient.getPatientNumber().isEmpty()) {
            patient.setPatientNumber("PAT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        Patient savedPatient = patientRepository.save(patient);
        return ResponseEntity.ok(savedPatient);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<?> updatePatient(@PathVariable Long id, @RequestBody Patient patientDetails) {
        return patientRepository.findById(id)
                .map(patient -> {
                    patient.setFullName(patientDetails.getFullName());
                    patient.setDateOfBirth(patientDetails.getDateOfBirth());
                    patient.setAge(patientDetails.getAge());
                    patient.setGender(patientDetails.getGender());
                    patient.setPhone(patientDetails.getPhone());
                    patient.setEmail(patientDetails.getEmail());
                    patient.setAddress(patientDetails.getAddress());
                    patient.setBloodType(patientDetails.getBloodType());
                    patient.setMedicalHistory(patientDetails.getMedicalHistory());
                    patient.setAllergies(patientDetails.getAllergies());
                    patient.setEmergencyContact(patientDetails.getEmergencyContact());
                    patient.setEmergencyPhone(patientDetails.getEmergencyPhone());
                    patient.setStatus(patientDetails.getStatus());
                    return ResponseEntity.ok(patientRepository.save(patient));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deletePatient(@PathVariable Long id) {
        return patientRepository.findById(id)
                .map(patient -> {
                    patientRepository.delete(patient);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
