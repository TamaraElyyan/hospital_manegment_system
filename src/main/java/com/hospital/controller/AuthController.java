package com.hospital.controller;

import com.hospital.dto.LoginRequest;
import com.hospital.dto.LoginResponse;
import com.hospital.dto.RegisterRequest;
import com.hospital.dto.RegisterResponse;
import com.hospital.model.AccountApprovalStatus;
import com.hospital.model.User;
import com.hospital.repository.UserRepository;
import com.hospital.security.JwtUtil;
import com.hospital.service.UserRegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRegistrationService userRegistrationService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        if (loginRequest == null || loginRequest.getUsername() == null || loginRequest.getUsername().isBlank()
                || loginRequest.getPassword() == null) {
            return ResponseEntity.badRequest().body("Username and password are required");
        }
        String username = loginRequest.getUsername().trim();
        String passwordPlain = loginRequest.getPassword().trim();
        if (passwordPlain.isEmpty()) {
            return ResponseEntity.badRequest().body("Password is required");
        }
        System.out.println("Login attempt: " + username);
        var userOpt = userRepository.findByUsernameIgnoreCase(username);
        if (userOpt.isEmpty() && username.contains("@")) {
            userOpt = userRepository.findByEmail(username);
        }
        boolean passwordOk = false;
        if (userOpt.isPresent()) {
            String hash = userOpt.get().getPassword();
            try {
                passwordOk = hash != null && passwordEncoder.matches(passwordPlain, hash);
            } catch (Exception e) {
                System.err.println("Password check failed for user " + username + ": " + e.getMessage());
                passwordOk = false;
            }
        }
        if (userOpt.isEmpty() || !passwordOk) {
            System.out.println("Invalid username or password");
            return ResponseEntity.status(401)
                    .body(Map.of("code", "INVALID_CREDENTIALS", "message", "Invalid username or password"));
        }

        User user = userOpt.get();

        if (user.getApprovalStatus() == AccountApprovalStatus.PENDING) {
            return ResponseEntity.status(403)
                    .body(Map.of("code", "ACCOUNT_PENDING", "message", "Account is pending admin approval"));
        }
        if (!Boolean.TRUE.equals(user.getActive())) {
            return ResponseEntity.status(403)
                    .body(Map.of("code", "ACCOUNT_DISABLED", "message", "Account is disabled"));
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String jwt;
        try {
            jwt = jwtUtil.generateToken(userDetails);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("JWT generation failed: " + e.getMessage());
        }
        return ResponseEntity.ok(new LoginResponse(jwt, user.getUsername(), user.getEmail(),
                user.getFullName(), user.getRole()));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body("Request body is required");
        }
        try {
            User saved = userRegistrationService.register(request, AccountApprovalStatus.PENDING);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    new RegisterResponse(true, null, saved.getUsername(), saved.getEmail(),
                            saved.getFullName(), saved.getRole()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Registration failed: " + e.getMessage());
        }
    }

    /**
     * Placeholder: does not email until {@code spring.mail.*} and reset tokens are implemented.
     * Response is generic to avoid disclosing which emails are registered.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody(required = false) Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required"));
        }
        String trimmed = email.trim();
        userRepository.findByEmail(trimmed)
                .ifPresent(u -> log.info("Password reset requested for user id {} (email configured: check MAIL_*)", u.getId()));
        return ResponseEntity.ok(
                Map.of("message", "If that email is registered, reset instructions will be sent when email is enabled on the server."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword() {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(Map.of("code", "NOT_IMPLEMENTED",
                        "message", "Token-based password reset is not enabled. Contact the administrator."));
    }

    // New endpoint to get current user info
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid Authorization header");
            }
            String jwt = token.substring(7);
            String username = jwtUtil.extractUsername(jwt);
            User user = userRepository.findByUsernameIgnoreCase(username).orElseThrow();
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid token");
        }
    }
}
