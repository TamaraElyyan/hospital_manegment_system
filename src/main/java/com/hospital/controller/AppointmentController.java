package com.hospital.controller;

import com.hospital.model.Appointment;
import com.hospital.model.Doctor;
import com.hospital.model.Patient;
import com.hospital.model.Role;
import com.hospital.repository.AppointmentRepository;
import com.hospital.service.CurrentUserService;
import com.hospital.service.DoctorDataScopeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private CurrentUserService currentUserService;

    @Autowired
    private DoctorDataScopeService doctorDataScopeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        Optional<Doctor> docOpt = currentUserService.getCurrentDoctor();
        if (docOpt.isPresent()) {
            return ResponseEntity.ok(appointmentRepository.findByDoctorId(docOpt.get().getId()));
        }
        return ResponseEntity.ok(appointmentRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT')")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id) {
        Optional<Appointment> opt = appointmentRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Appointment a = opt.get();
        Optional<Doctor> docOpt = currentUserService.getCurrentDoctor();
        if (docOpt.isPresent() && a.getDoctor() != null
                && !a.getDoctor().getId().equals(docOpt.get().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }
        var userOpt = currentUserService.getCurrentUser();
        if (userOpt.isPresent() && userOpt.get().getRole() == Role.PATIENT) {
            Long pid = a.getPatient() != null ? a.getPatient().getId() : null;
            if (!currentUserService.isSelfPatientRecord(pid)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
            }
        }
        return ResponseEntity.ok(a);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PATIENT')")
    public ResponseEntity<?> getAppointmentsByPatient(@PathVariable Long patientId) {
        var userOpt = currentUserService.getCurrentUser();
        if (userOpt.isPresent() && userOpt.get().getRole() == Role.PATIENT
                && !currentUserService.isSelfPatientRecord(patientId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }
        Optional<Doctor> docOpt = currentUserService.getCurrentDoctor();
        if (docOpt.isPresent() && !doctorDataScopeService.canDoctorAccessPatient(docOpt.get(), patientId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }
        return ResponseEntity.ok(appointmentRepository.findByPatientId(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<?> getAppointmentsByDoctor(@PathVariable Long doctorId) {
        Optional<Doctor> me = currentUserService.getCurrentDoctor();
        if (me.isPresent() && !me.get().getId().equals(doctorId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }
        return ResponseEntity.ok(appointmentRepository.findByDoctorId(doctorId));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST')")
    public ResponseEntity<List<Appointment>> getTodayAppointments() {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        Optional<Doctor> docOpt = currentUserService.getCurrentDoctor();
        if (docOpt.isPresent()) {
            return ResponseEntity.ok(
                    appointmentRepository.findByDoctorIdAndAppointmentDateBetween(
                            docOpt.get().getId(), startOfDay, endOfDay));
        }
        return ResponseEntity.ok(appointmentRepository.findByAppointmentDateBetween(startOfDay, endOfDay));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'PATIENT')")
    public ResponseEntity<?> createAppointment(@RequestBody Appointment appointment) {
        var userOpt = currentUserService.getCurrentUser();
        if (userOpt.isPresent() && userOpt.get().getRole() == Role.PATIENT) {
            java.util.Optional<Patient> me = currentUserService.getCurrentPatient();
            if (me.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("No patient record linked to this account. Contact the hospital.");
            }
            appointment.setPatient(me.get());
        }
        appointment.setStatus("SCHEDULED");
        Appointment savedAppointment = appointmentRepository.save(appointment);
        return ResponseEntity.ok(savedAppointment);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    public ResponseEntity<?> updateAppointment(@PathVariable Long id, @RequestBody Appointment appointmentDetails) {
        Optional<Doctor> me = currentUserService.getCurrentDoctor();
        if (me.isPresent()) {
            Optional<Appointment> forDoc = appointmentRepository.findById(id);
            if (forDoc.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            if (forDoc.get().getDoctor() == null
                    || !forDoc.get().getDoctor().getId().equals(me.get().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
            }
        }
        return appointmentRepository.findById(id)
                .map(appointment -> {
                    appointment.setAppointmentDate(appointmentDetails.getAppointmentDate());
                    appointment.setStatus(appointmentDetails.getStatus());
                    appointment.setReason(appointmentDetails.getReason());
                    appointment.setNotes(appointmentDetails.getNotes());
                    appointment.setDiagnosis(appointmentDetails.getDiagnosis());
                    appointment.setPrescription(appointmentDetails.getPrescription());
                    return ResponseEntity.ok(appointmentRepository.save(appointment));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<?> deleteAppointment(@PathVariable Long id) {
        return appointmentRepository.findById(id)
                .map(appointment -> {
                    appointmentRepository.delete(appointment);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
