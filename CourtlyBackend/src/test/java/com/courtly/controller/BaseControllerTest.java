package com.courtly.controller;

import com.courtly.entity.Level;
import com.courtly.entity.User;
import com.courtly.security.JwtService;
import com.courtly.security.UserDetailsServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

public abstract class BaseControllerTest {

    protected static final String TOKEN = "test-token";
    protected static final String AUTH_HEADER = "Bearer " + TOKEN;
    protected static final MediaType JSON = MediaType.APPLICATION_JSON;

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @MockBean
    protected JwtService jwtService;

    @MockBean
    protected UserDetailsServiceImpl userDetailsService;

    protected User mockUser;

    @BeforeEach
    void setUpAuth() {
        mockUser = User.builder()
                .id("user-1")
                .name("Test User")
                .username("testuser")
                .email("test@test.com")
                .password(new BCryptPasswordEncoder().encode("password123"))
                .level(Level.INTERMEDIO)
                .build();

        when(jwtService.extractUsername(TOKEN)).thenReturn("testuser");
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(mockUser);
        when(jwtService.isTokenValid(eq(TOKEN), any())).thenReturn(true);
    }
}
