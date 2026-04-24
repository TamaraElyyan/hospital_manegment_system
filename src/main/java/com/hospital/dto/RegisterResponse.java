package com.hospital.dto;

import com.hospital.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {
    private boolean pendingApproval;
    private String token;
    private String username;
    private String email;
    private String fullName;
    private Role role;
}
