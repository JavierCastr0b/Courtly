package com.courtly.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "invitations", indexes = {
    @Index(name = "idx_invitation_to_user", columnList = "to_user_id"),
    @Index(name = "idx_invitation_from_user", columnList = "from_user_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Invitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "from_user_id")
    private User fromUser;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "to_user_id")
    private User toUser;

    @ManyToOne(fetch = FetchType.EAGER, optional = true)
    @JoinColumn(name = "court_id")
    private Court court;

    private String customLocation;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime time;

    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private InvitationStatus status = InvitationStatus.PENDING;

    public enum InvitationStatus {
        PENDING, ACCEPTED, REJECTED
    }
}
