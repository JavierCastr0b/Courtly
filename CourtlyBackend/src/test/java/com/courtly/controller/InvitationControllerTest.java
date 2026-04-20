package com.courtly.controller;

import com.courtly.config.SecurityConfig;
import com.courtly.entity.Court;
import com.courtly.entity.Invitation;
import com.courtly.entity.Invitation.InvitationStatus;
import com.courtly.entity.Level;
import com.courtly.entity.User;
import com.courtly.repository.CourtRepository;
import com.courtly.repository.InvitationRepository;
import com.courtly.repository.UserRepository;
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

@WebMvcTest(InvitationController.class)
@Import(SecurityConfig.class)
class InvitationControllerTest extends BaseControllerTest {

    @MockBean InvitationRepository invitationRepository;
    @MockBean UserRepository userRepository;
    @MockBean CourtRepository courtRepository;

    private User otherUser;
    private Court mockCourt;
    private Invitation mockInvitation;

    @BeforeEach
    void setUpData() {
        otherUser = User.builder()
                .id("user-2").name("Invitado").username("invitado")
                .email("invitado@test.com").password("encoded").level(Level.PRINCIPIANTE)
                .build();

        mockCourt = Court.builder()
                .id("court-1").name("Pista 1").address("Calle 1").build();

        mockInvitation = Invitation.builder()
                .id("inv-1").fromUser(mockUser).toUser(mockUser)
                .court(mockCourt).date(LocalDate.now().plusDays(2))
                .time(LocalTime.of(19, 0)).build();
    }

    @Test
    void getPending_returnsList() throws Exception {
        when(invitationRepository.findByToUserIdAndStatus("user-1", InvitationStatus.PENDING))
                .thenReturn(List.of(mockInvitation));

        mockMvc.perform(get("/api/invitations")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("inv-1"));
    }

    @Test
    void create_returnsInvitation() throws Exception {
        when(userRepository.findById("user-2")).thenReturn(Optional.of(otherUser));
        when(courtRepository.findById("court-1")).thenReturn(Optional.of(mockCourt));
        when(invitationRepository.save(any())).thenReturn(mockInvitation);

        mockMvc.perform(post("/api/invitations")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(JSON)
                        .content("""
                                {
                                    "toUserId": "user-2",
                                    "courtId": "court-1",
                                    "date": "%s",
                                    "time": "19:00",
                                    "message": "Vamos a jugar"
                                }
                                """.formatted(LocalDate.now().plusDays(2))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("inv-1"));
    }

    @Test
    void accept_asRecipient_returnsAccepted() throws Exception {
        when(invitationRepository.findById("inv-1")).thenReturn(Optional.of(mockInvitation));
        when(invitationRepository.save(any())).thenReturn(mockInvitation);

        mockMvc.perform(put("/api/invitations/inv-1/accept")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk());
    }

    @Test
    void accept_notRecipient_returns403() throws Exception {
        Invitation other = Invitation.builder()
                .id("inv-2").fromUser(mockUser).toUser(otherUser)
                .court(mockCourt).date(LocalDate.now().plusDays(1))
                .time(LocalTime.of(18, 0)).build();

        when(invitationRepository.findById("inv-2")).thenReturn(Optional.of(other));

        mockMvc.perform(put("/api/invitations/inv-2/accept")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isForbidden());
    }

    @Test
    void reject_asRecipient_returnsRejected() throws Exception {
        when(invitationRepository.findById("inv-1")).thenReturn(Optional.of(mockInvitation));
        when(invitationRepository.save(any())).thenReturn(mockInvitation);

        mockMvc.perform(put("/api/invitations/inv-1/reject")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk());
    }

    @Test
    void reject_notRecipient_returns403() throws Exception {
        Invitation other = Invitation.builder()
                .id("inv-2").fromUser(mockUser).toUser(otherUser)
                .court(mockCourt).date(LocalDate.now().plusDays(1))
                .time(LocalTime.of(18, 0)).build();

        when(invitationRepository.findById("inv-2")).thenReturn(Optional.of(other));

        mockMvc.perform(put("/api/invitations/inv-2/reject")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isForbidden());
    }
}
