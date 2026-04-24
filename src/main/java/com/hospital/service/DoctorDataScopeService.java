package com.hospital.service;

import com.hospital.model.Appointment;
import com.hospital.model.Doctor;
import com.hospital.model.Patient;
import com.hospital.repository.AppointmentRepository;
import com.hospital.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * لتحديد المرضى/المواعيد المسموح للطبيب رؤيتها: إسناد رسمي، أو عبر موعد معه.
 */
@Service
public class DoctorDataScopeService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    public Set<Long> getAccessiblePatientIds(Doctor doctor) {
        if (doctor == null || doctor.getId() == null) {
            return Collections.emptySet();
        }
        Long did = doctor.getId();
        Set<Long> ids = new HashSet<>();
        patientRepository.findByAssignedDoctor_Id(did).forEach(p -> ids.add(p.getId()));
        for (Appointment a : appointmentRepository.findByDoctorId(did)) {
            if (a.getPatient() != null) {
                ids.add(a.getPatient().getId());
            }
        }
        return ids;
    }

    public List<Patient> getAccessiblePatients(Doctor doctor) {
        Set<Long> ids = getAccessiblePatientIds(doctor);
        if (ids.isEmpty()) {
            return new ArrayList<>();
        }
        return patientRepository.findAllById(ids);
    }

    public boolean canDoctorAccessPatient(Doctor doctor, Long patientId) {
        if (patientId == null) {
            return false;
        }
        return getAccessiblePatientIds(doctor).contains(patientId);
    }
}
