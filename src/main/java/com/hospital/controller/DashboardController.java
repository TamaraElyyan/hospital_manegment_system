package com.hospital.controller;

import com.hospital.dto.DashboardStats;
import com.hospital.model.Appointment;
import com.hospital.model.Doctor;
import com.hospital.model.Patient;
import com.hospital.model.Role;
import com.hospital.repository.*;
import com.hospital.service.CurrentUserService;
import com.hospital.service.DoctorDataScopeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private CurrentUserService currentUserService;

    @Autowired
    private DoctorDataScopeService doctorDataScopeService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'PATIENT')")
    public ResponseEntity<DashboardStats> getDashboardStats() {
        Optional<Doctor> docOpt = currentUserService.getCurrentDoctor();
        if (docOpt.isPresent()) {
            return ResponseEntity.ok(buildStatsForDoctor(docOpt.get()));
        }
        var userOpt = currentUserService.getCurrentUser();
        if (userOpt.isPresent() && userOpt.get().getRole() == Role.PATIENT) {
            Optional<Patient> pOpt = currentUserService.getCurrentPatient();
            if (pOpt.isPresent()) {
                return ResponseEntity.ok(buildStatsForPatient(pOpt.get()));
            }
            return ResponseEntity.ok(emptyStats());
        }
        if (userOpt.isPresent() && userOpt.get().getRole() == Role.DOCTOR) {
            return ResponseEntity.ok(emptyStats());
        }
        if (userOpt.isEmpty()
                || (userOpt.get().getRole() != Role.ADMIN
                && userOpt.get().getRole() != Role.RECEPTIONIST
                && userOpt.get().getRole() != Role.NURSE)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Long totalPatients = patientRepository.count();
        Long totalDoctors = doctorRepository.count();
        Long totalAppointments = appointmentRepository.count();
        Long totalInvoices = invoiceRepository.count();

        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        Long todayAppointments = (long) appointmentRepository.findByAppointmentDateBetween(startOfDay, endOfDay).size();

        Long pendingAppointments = (long) appointmentRepository.findByStatus("SCHEDULED").size();
        Long scheduledAppointments = (long) appointmentRepository.findByStatus("SCHEDULED").size();
        Long completedAppointments = (long) appointmentRepository.findByStatus("COMPLETED").size();
        Long cancelledAppointments = (long) appointmentRepository.findByStatus("CANCELLED").size();
        List<Map<String, Object>> recentAppointments = appointmentRepository.findAll().stream()
                .sorted((a1, a2) -> a2.getCreatedAt().compareTo(a1.getCreatedAt()))
                .limit(5)
                .map(this::appointmentToMap)
                .collect(Collectors.toList());

        DashboardStats stats = new DashboardStats(
                totalPatients,
                totalDoctors,
                totalAppointments,
                totalInvoices,
                todayAppointments,
                pendingAppointments,
                recentAppointments,
                new ArrayList<>(),
                scheduledAppointments,
                completedAppointments,
                cancelledAppointments
        );

        return ResponseEntity.ok(stats);
    }

    private DashboardStats emptyStats() {
        return new DashboardStats(
                0L, 0L, 0L, 0L, 0L, 0L, new ArrayList<>(), new ArrayList<>(), 0L, 0L, 0L);
    }

    private DashboardStats buildStatsForPatient(Patient p) {
        long pid = p.getId();
        long totalAppts = appointmentRepository.countByPatient_Id(pid);
        long invCount = invoiceRepository.countByPatient_Id(pid);
        long scheduled = appointmentRepository.countByPatient_IdAndStatus(pid, "SCHEDULED");
        long completed = appointmentRepository.countByPatient_IdAndStatus(pid, "COMPLETED");
        long cancelled = appointmentRepository.countByPatient_IdAndStatus(pid, "CANCELLED");
        long pending = scheduled;

        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        long todayAppts = appointmentRepository
                .findByPatient_IdAndAppointmentDateBetween(pid, startOfDay, endOfDay)
                .size();

        List<Map<String, Object>> recent = appointmentRepository.findByPatientId(pid).stream()
                .sorted((a1, a2) -> a2.getCreatedAt().compareTo(a1.getCreatedAt()))
                .limit(5)
                .map(this::appointmentToMap)
                .collect(Collectors.toList());

        return new DashboardStats(
                1L,
                0L,
                totalAppts,
                invCount,
                todayAppts,
                pending,
                recent,
                new ArrayList<>(),
                scheduled,
                completed,
                cancelled
        );
    }

    private DashboardStats buildStatsForDoctor(Doctor d) {
        long did = d.getId();
        Set<Long> patientIds = doctorDataScopeService.getAccessiblePatientIds(d);
        long totalPatients = patientIds.size();
        long totalAppointments = appointmentRepository.countByDoctorId(did);
        List<Long> pList = new ArrayList<>(patientIds);
        long totalInvoices = pList.isEmpty() ? 0L : invoiceRepository.countByPatientIdIn(pList);

        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        var today = appointmentRepository.findByDoctorIdAndAppointmentDateBetween(did, startOfDay, endOfDay);
        long todayAppointments = today.size();

        long scheduled = appointmentRepository.findByDoctorIdAndStatus(did, "SCHEDULED").size();
        long completed = appointmentRepository.findByDoctorIdAndStatus(did, "COMPLETED").size();
        long cancelled = appointmentRepository.findByDoctorIdAndStatus(did, "CANCELLED").size();

        List<Map<String, Object>> recentAppointments = appointmentRepository.findByDoctorId(did).stream()
                .sorted((a1, a2) -> a2.getCreatedAt().compareTo(a1.getCreatedAt()))
                .limit(5)
                .map(this::appointmentToMap)
                .collect(Collectors.toList());

        return new DashboardStats(
                totalPatients,
                1L,
                totalAppointments,
                totalInvoices,
                todayAppointments,
                scheduled,
                recentAppointments,
                new ArrayList<>(),
                scheduled,
                completed,
                cancelled
        );
    }

    private Map<String, Object> appointmentToMap(Appointment apt) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", apt.getId());
        map.put("patientName", apt.getPatient() != null ? apt.getPatient().getFullName() : null);
        String doctorName = null;
        if (apt.getDoctor() != null && apt.getDoctor().getUser() != null) {
            doctorName = apt.getDoctor().getUser().getFullName();
        }
        map.put("doctorName", doctorName);
        map.put("date", apt.getAppointmentDate());
        map.put("status", apt.getStatus());
        return map;
    }
}
