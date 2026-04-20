package com.courtly.controller;

import com.courtly.config.SecurityConfig;
import com.courtly.entity.Level;
import com.courtly.entity.User;
import com.courtly.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import(SecurityConfig.class)
class UserControllerTest extends BaseControllerTest {

    @MockBean UserRepository userRepository;

    @Test
    void getMe_authenticated_returnsUser() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"));
    }

    @Test
    void getMe_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getById_found_returnsUser() throws Exception {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));

        mockMvc.perform(get("/api/users/user-1")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-1"));
    }

    @Test
    void getById_notFound_returns404() throws Exception {
        when(userRepository.findById("unknown")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/unknown")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isNotFound());
    }

    @Test
    void search_returnsResults() throws Exception {
        when(userRepository.searchByNameOrUsername("juan")).thenReturn(List.of(mockUser));

        mockMvc.perform(get("/api/users/search?q=juan")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("testuser"));
    }

    @Test
    void update_ownProfile_returnsUpdated() throws Exception {
        User updated = User.builder()
                .id("user-1").name("Nuevo Nombre").username("testuser")
                .email("test@test.com").password("encoded").level(Level.AVANZADO)
                .build();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any())).thenReturn(updated);

        mockMvc.perform(put("/api/users/user-1")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(JSON)
                        .content("""
                                {"name": "Nuevo Nombre", "bio": "Mi bio"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Nuevo Nombre"));
    }

    @Test
    void update_otherProfile_returns403() throws Exception {
        mockMvc.perform(put("/api/users/other-user")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(JSON)
                        .content("""
                                {"name": "Hack"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void follow_returnsOk() throws Exception {
        User target = User.builder()
                .id("user-2").name("Target").username("target")
                .email("target@test.com").password("encoded").level(Level.PRINCIPIANTE)
                .build();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(userRepository.findById("user-2")).thenReturn(Optional.of(target));
        when(userRepository.save(any())).thenReturn(mockUser);

        mockMvc.perform(post("/api/users/user-2/follow")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk());
    }

    @Test
    void unfollow_returnsOk() throws Exception {
        User target = User.builder()
                .id("user-2").name("Target").username("target")
                .email("target@test.com").password("encoded").level(Level.PRINCIPIANTE)
                .build();
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(userRepository.findById("user-2")).thenReturn(Optional.of(target));
        when(userRepository.save(any())).thenReturn(mockUser);

        mockMvc.perform(delete("/api/users/user-2/follow")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk());
    }
}
