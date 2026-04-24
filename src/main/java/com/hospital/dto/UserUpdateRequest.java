package com.hospital.dto;

import com.hospital.model.Role;
import lombok.Data;

/** Admin-only user profile update; password is optional. */
@Data
public class UserUpdateRequest {
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private Role role;
    private Boolean active;
    private String newPassword;
}
