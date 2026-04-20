package com.courtly.controller;

import com.courtly.config.SecurityConfig;
import com.courtly.entity.Challenge;
import com.courtly.entity.Challenge.ChallengeStatus;
import com.courtly.entity.Level;
import com.courtly.entity.User;
import com.courtly.repository.ChallengeRepository;
import com.courtly.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ChallengeController.class)
@Import(SecurityConfig.class)
class ChallengeControllerTest extends BaseControllerTest {

    @MockBean ChallengeRepository challengeRepository;
    @MockBean UserRepository userRepository;

    private User otherUser;
    private Challenge mockChallenge;

    @BeforeEach
    void setUpData() {
        otherUser = User.builder()
                .id("user-2").name("Rival").username("rival")
                .email("rival@test.com").password("encoded").level(Level.INTERMEDIO)
                .build();

        mockChallenge = Challenge.builder()
                .id("challenge-1").challenger(mockUser).challenged(otherUser)
                .description("Te reto").deadline(LocalDate.now().plusDays(7))
                .build();
    }

    @Test
    void getMyChallenges_returnsList() throws Exception {
        when(challengeRepository.findByUserId("user-1")).thenReturn(List.of(mockChallenge));

        mockMvc.perform(get("/api/challenges")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("challenge-1"));
    }

    @Test
    void create_returnsChallenge() throws Exception {
        when(userRepository.findById("user-2")).thenReturn(Optional.of(otherUser));
        when(challengeRepository.save(any())).thenReturn(mockChallenge);

        mockMvc.perform(post("/api/challenges")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(JSON)
                        .content("""
                                {
                                    "challengedUserId": "user-2",
                                    "description": "Te reto a un partido",
                                    "deadline": "%s"
                                }
                                """.formatted(LocalDate.now().plusDays(7))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("challenge-1"));
    }

    @Test
    void accept_asChallenged_returnsChallenge() throws Exception {
        Challenge accepted = Challenge.builder()
                .id("challenge-1").challenger(mockUser).challenged(mockUser)
                .description("Te reto").deadline(LocalDate.now().plusDays(7))
                .status(ChallengeStatus.ACTIVE).build();

        when(challengeRepository.findById("challenge-1")).thenReturn(Optional.of(accepted));
        when(challengeRepository.save(any())).thenReturn(accepted);

        mockMvc.perform(put("/api/challenges/challenge-1/accept")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void accept_notChallenged_returns403() throws Exception {
        when(challengeRepository.findById("challenge-1")).thenReturn(Optional.of(mockChallenge));

        mockMvc.perform(put("/api/challenges/challenge-1/accept")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isForbidden());
    }

    @Test
    void setScore_asChallenger_returnsChallenge() throws Exception {
        when(challengeRepository.findById("challenge-1")).thenReturn(Optional.of(mockChallenge));
        when(challengeRepository.save(any())).thenReturn(mockChallenge);

        mockMvc.perform(put("/api/challenges/challenge-1/score")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(JSON)
                        .content("""
                                {"score": "6-3 6-4"}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void setScore_notInvolved_returns403() throws Exception {
        User stranger = User.builder().id("stranger").username("stranger").build();
        Challenge other = Challenge.builder()
                .id("challenge-2").challenger(otherUser).challenged(stranger)
                .description("otro reto").deadline(LocalDate.now().plusDays(5))
                .build();

        when(challengeRepository.findById("challenge-2")).thenReturn(Optional.of(other));

        mockMvc.perform(put("/api/challenges/challenge-2/score")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(JSON)
                        .content("""
                                {"score": "6-0 6-0"}
                                """))
                .andExpect(status().isForbidden());
    }
}
