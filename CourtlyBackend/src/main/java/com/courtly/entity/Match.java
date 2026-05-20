package com.courtly.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "matches", indexes = {
    @Index(name = "idx_match_organizer", columnList = "organizer_id"),
    @Index(name = "idx_match_court", columnList = "court_id"),
    @Index(name = "idx_match_date", columnList = "date"),
    @Index(name = "idx_match_level", columnList = "level")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.EAGER, optional = true)
    @JoinColumn(name = "court_id")
    private Court court;

    private String sportType;
    private String matchType;

    private String customLocation;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "organizer_id")
    private User organizer;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime time;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Level level;

    @Column(nullable = false)
    private int totalSpots;

    private String description;

    @Builder.Default
    @BatchSize(size = 25)
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "match_participants",
            joinColumns = @JoinColumn(name = "match_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<User> participants = new HashSet<>();

    @Builder.Default
    @BatchSize(size = 25)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "match_winners",
            joinColumns = @JoinColumn(name = "match_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<User> winners = new HashSet<>();

    @Builder.Default
    @BatchSize(size = 25)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "match_team_a",
            joinColumns = @JoinColumn(name = "match_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<User> teamA = new HashSet<>();

    @Builder.Default
    @BatchSize(size = 25)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "match_team_b",
            joinColumns = @JoinColumn(name = "match_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<User> teamB = new HashSet<>();

    @Builder.Default
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "match_guests_a", joinColumns = @JoinColumn(name = "match_id"))
    @Column(name = "guest_name")
    private List<String> teamAGuests = new ArrayList<>();

    @Builder.Default
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "match_guests_b", joinColumns = @JoinColumn(name = "match_id"))
    @Column(name = "guest_name")
    private List<String> teamBGuests = new ArrayList<>();

    @Builder.Default
    private boolean resultRecorded = false;

    private String score;

    public int getSpotsLeft() {
        int guests = (teamAGuests != null ? teamAGuests.size() : 0)
                   + (teamBGuests != null ? teamBGuests.size() : 0);
        return totalSpots - participants.size() - guests;
    }
}
