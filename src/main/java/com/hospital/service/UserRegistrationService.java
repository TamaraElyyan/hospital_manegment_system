package com.hospital.service;

import com.hospital.dto.RegisterRequest;
import com.hospital.model.*;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.PatientRepository;
import com.hospital.repository.StaffRepository;
import com.hospital.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class UserRegistrationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private StaffRepository staffRepository;

    @Transactional
    public User register(RegisterRequest request, AccountApprovalStatus approvalStatus) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());
        user.setAddress(request.getAddress());
        user.setActive(true);
        user.setApprovalStatus(approvalStatus);

        User savedUser = userRepository.save(user);

        switch (request.getRole()) {
            case DOCTOR -> {
                Doctor doctor = new Doctor();
                doctor.setUser(savedUser);
                doctor.setLicenseNumber("DOC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                doctor.setSpecialization("General Practitioner");
                doctor.setQualifications("MD");
                doctor.setExperienceYears(0);
                doctor.setConsultationFee("50.00");
                doctor.setSchedule("Mon-Fri: 9 AM - 5 PM");
                doctor.setAvailable(true);
                doctorRepository.save(doctor);
            }
            case PATIENT -> {
                Patient patient = new Patient();
                patient.setUser(savedUser);
                patient.setPatientNumber("PAT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                patient.setFullName(savedUser.getFullName());
                patient.setDateOfBirth(LocalDate.now().minusYears(30));
                patient.setAge(30);
                patient.setGender("Not Specified");
                patient.setPhone(savedUser.getPhone());
                patient.setEmail(savedUser.getEmail());
                patient.setAddress(savedUser.getAddress());
                patient.setStatus("ACTIVE");
                patientRepository.save(patient);
            }
            case NURSE, RECEPTIONIST -> {
                Staff staff = new Staff();
                staff.setUser(savedUser);
                staff.setPosition(request.getRole().toString());
                staff.setShift("Morning");
                staff.setActive(true);
                staffRepository.save(staff);
            }
            default -> {
            }
        }

        return savedUser;
    }
}
