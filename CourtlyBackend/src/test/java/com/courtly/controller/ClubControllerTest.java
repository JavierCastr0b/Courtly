package com.courtly.controller;

import com.courtly.config.SecurityConfig;
import com.courtly.entity.Club;
import com.courtly.repository.ClubRepository;
import com.courtly.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
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

@WebMvcTest(ClubController.class)
@Import(SecurityConfig.class)
class ClubControllerTest extends BaseControllerTest {

    @MockBean ClubRepository clubRepository;
    @MockBean UserRepository userRepository;

    private Club mockClub;

    @BeforeEach
    void setUpData() {
        mockClub = Club.builder()
                .id("club-1").name("Club Pádel Madrid")
                .description("El mejor club").location("Madrid").build();
    }

    @Test
    void getAll_returnsClubs() throws Exception {
        when(clubRepository.findAll()).thenReturn(List.of(mockClub));

        mockMvc.perform(get("/api/clubs")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("club-1"));
    }

    @Test
    void getById_found_returnsClub() throws Exception {
        when(clubRepository.findById("club-1")).thenReturn(Optional.of(mockClub));

        mockMvc.perform(get("/api/clubs/club-1")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Club Pádel Madrid"));
    }

    @Test
    void getById_notFound_returns404() throws Exception {
        when(clubRepository.findById("unknown")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/clubs/unknown")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_returnsClub() throws Exception {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(clubRepository.save(any())).thenReturn(mockClub);

        mockMvc.perform(post("/api/clubs")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(JSON)
                        .content("""
                                {
                                    "name": "Club Pádel Madrid",
                                    "description": "El mejor club",
                                    "location": "Madrid"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("club-1"));
    }

    @Test
    void join_returnsOk() throws Exception {
        when(clubRepository.findById("club-1")).thenReturn(Optional.of(mockClub));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(clubRepository.save(any())).thenReturn(mockClub);

        mockMvc.perform(post("/api/clubs/club-1/join")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk());
    }

    @Test
    void leave_returnsOk() throws Exception {
        when(clubRepository.findById("club-1")).thenReturn(Optional.of(mockClub));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(clubRepository.save(any())).thenReturn(mockClub);

        mockMvc.perform(delete("/api/clubs/club-1/leave")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk());
    }
}
