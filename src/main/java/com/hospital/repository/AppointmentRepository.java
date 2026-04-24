package com.hospital.repository;

import com.hospital.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientId(Long patientId);
    List<Appointment> findByDoctorId(Long doctorId);
    List<Appointment> findByStatus(String status);
    List<Appointment> findByAppointmentDateBetween(LocalDateTime start, LocalDateTime end);
    List<Appointment> findByDoctorIdAndAppointmentDateBetween(Long doctorId, LocalDateTime start, LocalDateTime end);

    List<Appointment> findByDoctorIdAndStatus(Long doctorId, String status);

    long countByDoctorId(Long doctorId);

    long countByPatient_Id(Long patientId);

    long countByPatient_IdAndStatus(Long patientId, String status);

    List<Appointment> findByPatient_IdAndAppointmentDateBetween(
            Long patientId, LocalDateTime start, LocalDateTime end);
}
