package com.courtly.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "challenges")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Challenge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "challenger_id")
    private User challenger;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "challenged_id")
    private User challenged;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private LocalDate deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ChallengeStatus status = ChallengeStatus.PENDING;

    private String challengerScore;
    private String challengedScore;

    public enum ChallengeStatus {
        PENDING, ACTIVE, COMPLETED
    }
}
