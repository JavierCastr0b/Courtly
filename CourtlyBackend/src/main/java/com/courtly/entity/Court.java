package com.courtly.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "courts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Court {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    private String courtType;
    private String surface;

    private double latitude;
    private double longitude;

    @Column(nullable = false)
    private int totalCourts;
}
