package com.hospital.controller;

import com.hospital.model.Doctor;
import com.hospital.repository.DoctorRepository;
import com.hospital.service.CurrentUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*")
public class DoctorController {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private CurrentUserService currentUserService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE')")
    public ResponseEntity<List<Doctor>> getAllDoctors() {
        Optional<Doctor> me = currentUserService.getCurrentDoctor();
        if (me.isPresent()) {
            return ResponseEntity.ok(Collections.singletonList(me.get()));
        }
        return ResponseEntity.ok(doctorRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE')")
    public ResponseEntity<?> getDoctorById(@PathVariable Long id) {
        Optional<Doctor> opt = doctorRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Optional<Doctor> me = currentUserService.getCurrentDoctor();
        if (me.isPresent() && !me.get().getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }
        return ResponseEntity.ok(opt.get());
    }

    @GetMapping("/specialization/{specialization}")
    public ResponseEntity<List<Doctor>> getDoctorsBySpecialization(@PathVariable String specialization) {
        return ResponseEntity.ok(doctorRepository.findBySpecialization(specialization));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createDoctor(@RequestBody Doctor doctor) {
        Doctor savedDoctor = doctorRepository.save(doctor);
        return ResponseEntity.ok(savedDoctor);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<?> updateDoctor(@PathVariable Long id, @RequestBody Doctor doctorDetails) {
        Optional<Doctor> me = currentUserService.getCurrentDoctor();
        if (me.isPresent() && !me.get().getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }
        return doctorRepository.findById(id)
                .map(doctor -> {
                    doctor.setLicenseNumber(doctorDetails.getLicenseNumber());
                    doctor.setSpecialization(doctorDetails.getSpecialization());
                    doctor.setQualifications(doctorDetails.getQualifications());
                    doctor.setExperienceYears(doctorDetails.getExperienceYears());
                    doctor.setDepartment(doctorDetails.getDepartment());
                    doctor.setConsultationFee(doctorDetails.getConsultationFee());
                    doctor.setSchedule(doctorDetails.getSchedule());
                    doctor.setAvailable(doctorDetails.getAvailable());
                    return ResponseEntity.ok(doctorRepository.save(doctor));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteDoctor(@PathVariable Long id) {
        return doctorRepository.findById(id)
                .map(doctor -> {
                    doctorRepository.delete(doctor);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
