package com.courtly.controller;

import com.courtly.config.SecurityConfig;
import com.courtly.entity.Court;
import com.courtly.entity.Level;
import com.courtly.entity.Match;
import com.courtly.repository.CourtRepository;
import com.courtly.repository.MatchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MatchController.class)
@Import(SecurityConfig.class)
class MatchControllerTest extends BaseControllerTest {

    @MockBean MatchRepository matchRepository;
    @MockBean CourtRepository courtRepository;

    private Court mockCourt;
    private Match mockMatch;

    @BeforeEach
    void setUpData() {
        mockCourt = Court.builder()
                .id("court-1").name("Pista Central").address("Calle 1").build();

        mockMatch = Match.builder()
                .id("match-1").court(mockCourt).organizer(mockUser)
                .date(LocalDate.now().plusDays(1)).time(LocalTime.of(18, 0))
                .level(Level.INTERMEDIO).totalSpots(4).build();
    }

    @Test
    void getAll_returnsMatches() throws Exception {
        when(matchRepository.findByDateGreaterThanEqual(any())).thenReturn(List.of(mockMatch));

        mockMvc.perform(get("/api/matches")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("match-1"));
    }

    @Test
    void getById_found_returnsMatch() throws Exception {
        when(matchRepository.findById("match-1")).thenReturn(Optional.of(mockMatch));

        mockMvc.perform(get("/api/matches/match-1")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("match-1"));
    }

    @Test
    void getById_notFound_returns404() throws Exception {
        when(matchRepository.findById("unknown")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/matches/unknown")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_returnsMatch() throws Exception {
        when(courtRepository.findById("court-1")).thenReturn(Optional.of(mockCourt));
        when(matchRepository.save(any())).thenReturn(mockMatch);

        mockMvc.perform(post("/api/matches")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(JSON)
                        .content("""
                                {
                                    "courtId": "court-1",
                                    "date": "%s",
                                    "time": "18:00",
                                    "level": "INTERMEDIO",
                                    "totalSpots": 4
                                }
                                """.formatted(LocalDate.now().plusDays(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("match-1"));
    }

    @Test
    void join_spotsAvailable_returnsMatch() throws Exception {
        when(matchRepository.findById("match-1")).thenReturn(Optional.of(mockMatch));
        when(matchRepository.save(any())).thenReturn(mockMatch);

        mockMvc.perform(post("/api/matches/match-1/join")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk());
    }

    @Test
    void join_noSpots_returns400() throws Exception {
        Match fullMatch = Match.builder()
                .id("match-1").court(mockCourt).organizer(mockUser)
                .date(LocalDate.now().plusDays(1)).time(LocalTime.of(18, 0))
                .level(Level.INTERMEDIO).totalSpots(1).build();
        fullMatch.getParticipants().add(mockUser);

        when(matchRepository.findById("match-1")).thenReturn(Optional.of(fullMatch));

        mockMvc.perform(post("/api/matches/match-1/join")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isBadRequest());
    }

    @Test
    void leave_returnsOk() throws Exception {
        when(matchRepository.findById("match-1")).thenReturn(Optional.of(mockMatch));

        mockMvc.perform(delete("/api/matches/match-1/leave")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk());
    }

    @Test
    void delete_asOrganizer_returnsNoContent() throws Exception {
        when(matchRepository.findById("match-1")).thenReturn(Optional.of(mockMatch));

        mockMvc.perform(delete("/api/matches/match-1")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_notOrganizer_returns403() throws Exception {
        Match otherMatch = Match.builder()
                .id("match-2").court(mockCourt)
                .organizer(com.courtly.entity.User.builder()
                        .id("other-user").username("otro").build())
                .date(LocalDate.now().plusDays(1)).time(LocalTime.of(18, 0))
                .level(Level.INTERMEDIO).totalSpots(4).build();

        when(matchRepository.findById("match-2")).thenReturn(Optional.of(otherMatch));

        mockMvc.perform(delete("/api/matches/match-2")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isForbidden());
    }
}
