package com.hospital.dto;

import com.hospital.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String email;
    private String fullName;
    private Role role;
}
