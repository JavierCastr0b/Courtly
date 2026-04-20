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

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CourtController.class)
@Import(SecurityConfig.class)
class CourtControllerTest extends BaseControllerTest {

    @MockBean CourtRepository courtRepository;
    @MockBean MatchRepository matchRepository;

    private Court mockCourt;

    @BeforeEach
    void setUpData() {
        mockCourt = Court.builder()
                .id("court-1").name("Pista Central").address("Calle Mayor 1").build();
    }

    @Test
    void getAll_returnsCourts() throws Exception {
        when(courtRepository.findAll()).thenReturn(List.of(mockCourt));

        mockMvc.perform(get("/api/courts")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("court-1"));
    }

    @Test
    void getById_found_returnsCourt() throws Exception {
        when(courtRepository.findById("court-1")).thenReturn(Optional.of(mockCourt));

        mockMvc.perform(get("/api/courts/court-1")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Pista Central"));
    }

    @Test
    void getById_notFound_returns404() throws Exception {
        when(courtRepository.findById("unknown")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/courts/unknown")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isNotFound());
    }

    @Test
    void getMatchesByCourt_returnsMatches() throws Exception {
        Match match = Match.builder()
                .id("match-1").court(mockCourt).organizer(mockUser)
                .date(LocalDate.now().plusDays(1)).time(LocalTime.of(18, 0))
                .level(Level.INTERMEDIO).totalSpots(4).build();

        when(matchRepository.findByCourtId("court-1")).thenReturn(List.of(match));

        mockMvc.perform(get("/api/courts/court-1/matches")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("match-1"));
    }

    @Test
    void search_returnsCourts() throws Exception {
        when(courtRepository.searchByNameOrAddress("central")).thenReturn(List.of(mockCourt));

        mockMvc.perform(get("/api/courts/search?q=central")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("court-1"));
    }
}
