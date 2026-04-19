package com.courtly.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank private String name;
    @NotBlank @Size(min = 3, max = 30) private String username;
    @NotBlank @Email private String email;
    @NotBlank @Size(min = 8) private String password;
}
