
package com.hospital.controller;

import com.hospital.dto.RegisterRequest;
import com.hospital.dto.UserUpdateRequest;
import com.hospital.model.AccountApprovalStatus;
import com.hospital.model.User;
import com.hospital.repository.UserRepository;
import com.hospital.service.ApprovalEmailService;
import com.hospital.service.UserRegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRegistrationService userRegistrationService;

    @Autowired
    private ApprovalEmailService approvalEmailService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody RegisterRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body("Request body is required");
        }
        try {
            User user = userRegistrationService.register(request, AccountApprovalStatus.APPROVED);
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to create user: " + e.getMessage());
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest req) {
        if (req == null) {
            return ResponseEntity.badRequest().body("Request body is required");
        }
        return userRepository.findById(id)
                .map(user -> {
                    if (req.getFullName() != null) {
                        user.setFullName(req.getFullName().trim());
                    }
                    if (req.getPhone() != null) {
                        user.setPhone(req.getPhone().trim().isEmpty() ? null : req.getPhone().trim());
                    }
                    if (req.getAddress() != null) {
                        user.setAddress(req.getAddress().trim().isEmpty() ? null : req.getAddress().trim());
                    }
                    if (req.getActive() != null) {
                        user.setActive(req.getActive());
                    }
                    if (req.getRole() != null) {
                        user.setRole(req.getRole());
                    }
                    if (req.getEmail() != null) {
                        String e = req.getEmail().trim();
                        if (!e.equals(user.getEmail())) {
                            var withEmail = userRepository.findByEmail(e);
                            if (withEmail.isPresent() && !withEmail.get().getId().equals(user.getId())) {
                                return ResponseEntity.badRequest().body("Email already in use");
                            }
                        }
                        user.setEmail(e);
                    }
                    if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
                        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
                    }
                    return ResponseEntity.ok(userRepository.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    userRepository.delete(user);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleUserActive(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    boolean on = Boolean.TRUE.equals(user.getActive());
                    user.setActive(!on);
                    userRepository.save(user);
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    if (user.getApprovalStatus() != AccountApprovalStatus.PENDING) {
                        return ResponseEntity.badRequest().body("User is already approved or not pending");
                    }
                    user.setApprovalStatus(AccountApprovalStatus.APPROVED);
                    user.setActive(true);
                    User saved = userRepository.save(user);
                    approvalEmailService.notifyApproved(saved);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
