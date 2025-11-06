package com.hospital.controller;

import com.hospital.dto.LoginRequest;
import com.hospital.dto.LoginResponse;
import com.hospital.dto.RegisterRequest;
import com.hospital.model.User;
import com.hospital.repository.UserRepository;
import com.hospital.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
    System.out.println("Login attempt: " + loginRequest.getUsername());
    var userOpt = userRepository.findByUsername(loginRequest.getUsername());
    if (userOpt.isPresent() && passwordEncoder.matches(loginRequest.getPassword(), userOpt.get().getPassword())) {
        User user = userOpt.get();
        final UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String jwt;
        try {
            jwt = jwtUtil.generateToken(userDetails);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("JWT generation failed");
        }
        return ResponseEntity.ok(new LoginResponse(jwt, user.getUsername(), user.getEmail(),
                user.getFullName(), user.getRole()));
    } else {
        System.out.println("Invalid username or password");
        return ResponseEntity.status(401).body("Invalid username or password");
    }
}



// @PostMapping("/login")
// public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
//     var user = userRepository.findByUsername(loginRequest.getUsername());
//     if (user.isPresent() && passwordEncoder.matches(loginRequest.getPassword(), user.get().getPassword())) {
//         return ResponseEntity.ok(user.get());
//     } else {
//         return ResponseEntity.badRequest().body("Invalid username or password");
//     }
// }


    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email already exists");
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

        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully");
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.substring(7);
            String username = jwtUtil.extractUsername(jwt);
            User user = userRepository.findByUsername(username).orElseThrow();
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid token");
        }
    }
}
