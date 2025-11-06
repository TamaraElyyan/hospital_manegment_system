package com.hospital.dto;

import com.hospital.model.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private String fullName;
    private String phone;
    private Role role;
    private String address;
}
