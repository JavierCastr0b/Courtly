package com.courtly.controller;

import com.courtly.config.SecurityConfig;
import com.courtly.entity.User;
import com.courtly.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.AuthenticationManager;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest extends BaseControllerTest {

    @MockBean UserRepository userRepository;
    @MockBean AuthenticationManager authenticationManager;

    @Test
    void register_returnsToken() throws Exception {
        when(userRepository.existsByUsername("juangarcia")).thenReturn(false);
        when(userRepository.existsByEmail("juan@test.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        when(jwtService.generateToken(any())).thenReturn("generated-token");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(JSON)
                        .content("""
                                {
                                    "name": "Juan",
                                    "username": "juangarcia",
                                    "email": "juan@test.com",
                                    "password": "password123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("generated-token"));
    }

    @Test
    void register_usernameTaken_returns400() throws Exception {
        when(userRepository.existsByUsername("juangarcia")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(JSON)
                        .content("""
                                {
                                    "name": "Juan",
                                    "username": "juangarcia",
                                    "email": "juan@test.com",
                                    "password": "password123"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Username already taken"));
    }

    @Test
    void register_emailTaken_returns400() throws Exception {
        when(userRepository.existsByUsername("juangarcia")).thenReturn(false);
        when(userRepository.existsByEmail("juan@test.com")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(JSON)
                        .content("""
                                {
                                    "name": "Juan",
                                    "username": "juangarcia",
                                    "email": "juan@test.com",
                                    "password": "password123"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already registered"));
    }

    @Test
    void register_invalidBody_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(JSON)
                        .content("""
                                {
                                    "name": "",
                                    "username": "ab",
                                    "email": "not-an-email",
                                    "password": "short"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_returnsToken() throws Exception {
        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(mockUser));
        when(jwtService.generateToken(mockUser)).thenReturn("generated-token");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(JSON)
                        .content("""
                                {
                                    "username": "testuser",
                                    "password": "password123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("generated-token"))
                .andExpect(jsonPath("$.userId").value("user-1"));
    }
}
