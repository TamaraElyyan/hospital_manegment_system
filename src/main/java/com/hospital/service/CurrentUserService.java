package com.hospital.service;

import com.hospital.model.Doctor;
import com.hospital.model.Patient;
import com.hospital.model.Role;
import com.hospital.model.User;
import com.hospital.repository.DoctorRepository;
import com.hospital.repository.PatientRepository;
import com.hospital.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CurrentUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    public Optional<String> getCurrentUsername() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || !a.isAuthenticated() || "anonymousUser".equals(a.getPrincipal())) {
            return Optional.empty();
        }
        return Optional.ofNullable(a.getName());
    }

    public Optional<User> getCurrentUser() {
        return getCurrentUsername().flatMap(userRepository::findByUsername);
    }

    public Optional<Doctor> getCurrentDoctor() {
        return getCurrentUser()
                .filter(u -> u.getRole() == Role.DOCTOR)
                .flatMap(u -> doctorRepository.findByUserId(u.getId()));
    }

    /**
     * Resolves the {@link Patient} record: prefers explicit {@code Patient.user} link, then email match.
     */
    public Optional<Patient> getCurrentPatient() {
        Optional<User> uOpt = getCurrentUser().filter(u -> u.getRole() == Role.PATIENT);
        if (uOpt.isEmpty()) {
            return Optional.empty();
        }
        User u = uOpt.get();
        Optional<Patient> byUser = patientRepository.findByUser_Id(u.getId());
        if (byUser.isPresent()) {
            return byUser;
        }
        if (u.getEmail() != null && !u.getEmail().isBlank()) {
            return patientRepository.findFirstByEmailIgnoreCase(u.getEmail().trim());
        }
        return Optional.empty();
    }

    public boolean isSelfPatientRecord(Long patientId) {
        if (patientId == null) {
            return false;
        }
        return getCurrentPatient()
                .map(p -> p.getId().equals(patientId))
                .orElse(false);
    }

    public boolean isCurrentUserAdmin() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null) {
            return false;
        }
        return a.getAuthorities().stream()
                .anyMatch(g -> "ROLE_ADMIN".equals(g.getAuthority()));
    }
}
