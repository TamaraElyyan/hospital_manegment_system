package com.hospital.config;

import com.hospital.model.*;
import com.hospital.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@hospital.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setFullName("Admin User");
            admin.setPhone("+1234567890");
            admin.setRole(Role.ADMIN);
            admin.setAddress("123 Hospital Street");
            admin.setActive(true);
            userRepository.save(admin);

            Department cardiology = new Department();
            cardiology.setName("Cardiology");
            cardiology.setDescription("Heart and cardiovascular system");
            cardiology.setHeadOfDepartment("Dr. Smith");
            cardiology.setLocation("Building A, Floor 2");
            cardiology.setPhone("+1234567891");
            cardiology.setActive(true);
            departmentRepository.save(cardiology);

            Department neurology = new Department();
            neurology.setName("Neurology");
            neurology.setDescription("Brain and nervous system");
            neurology.setHeadOfDepartment("Dr. Johnson");
            neurology.setLocation("Building B, Floor 3");
            neurology.setPhone("+1234567892");
            neurology.setActive(true);
            departmentRepository.save(neurology);

            User doctorUser = new User();
            doctorUser.setUsername("drjohn");
            doctorUser.setEmail("drjohn@hospital.com");
            doctorUser.setPassword(passwordEncoder.encode("doctor123"));
            doctorUser.setFullName("Dr. John Smith");
            doctorUser.setPhone("+1234567893");
            doctorUser.setRole(Role.DOCTOR);
            doctorUser.setAddress("456 Medical Plaza");
            doctorUser.setActive(true);
            userRepository.save(doctorUser);

            Doctor doctor = new Doctor();
            doctor.setUser(doctorUser);
            doctor.setLicenseNumber("DOC-12345");
            doctor.setSpecialization("Cardiologist");
            doctor.setQualifications("MD, PhD in Cardiology");
            doctor.setExperienceYears(10);
            doctor.setDepartment(cardiology);
            doctor.setConsultationFee("100.00");
            doctor.setSchedule("Mon-Fri: 9 AM - 5 PM");
            doctor.setAvailable(true);
            doctorRepository.save(doctor);

            User nurseUser = new User();
            nurseUser.setUsername("nurse1");
            nurseUser.setEmail("nurse1@hospital.com");
            nurseUser.setPassword(passwordEncoder.encode("nurse123"));
            nurseUser.setFullName("Nurse Mary Johnson");
            nurseUser.setPhone("+1234567894");
            nurseUser.setRole(Role.NURSE);
            nurseUser.setAddress("789 Care Street");
            nurseUser.setActive(true);
            userRepository.save(nurseUser);

            User receptionistUser = new User();
            receptionistUser.setUsername("receptionist1");
            receptionistUser.setEmail("receptionist@hospital.com");
            receptionistUser.setPassword(passwordEncoder.encode("receptionist123"));
            receptionistUser.setFullName("Sarah Williams");
            receptionistUser.setPhone("+1234567895");
            receptionistUser.setRole(Role.RECEPTIONIST);
            receptionistUser.setAddress("321 Front Desk Ave");
            receptionistUser.setActive(true);
            userRepository.save(receptionistUser);

            Patient patient = new Patient();
            patient.setPatientNumber("PAT-001");
            patient.setFullName("Michael Brown");
            patient.setDateOfBirth(LocalDate.of(1980, 5, 15));
            patient.setAge(44);
            patient.setGender("Male");
            patient.setPhone("+1234567896");
            patient.setEmail("michael.brown@email.com");
            patient.setAddress("555 Patient Road");
            patient.setBloodType("A+");
            patient.setMedicalHistory("No major illnesses");
            patient.setAllergies("None");
            patient.setEmergencyContact("Jane Brown");
            patient.setEmergencyPhone("+1234567897");
            patient.setStatus("ACTIVE");
            patient.setAssignedDoctor(doctor);
            patientRepository.save(patient);

            System.out.println("Sample data initialized successfully!");
            System.out.println("Admin: username=admin, password=admin123");
            System.out.println("Doctor: username=drjohn, password=doctor123");
            System.out.println("Nurse: username=nurse1, password=nurse123");
            System.out.println("Receptionist: username=receptionist1, password=receptionist123");
        }
    }
}
