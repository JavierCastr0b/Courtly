package com.courtly.dto.request;

import com.courtly.entity.Level;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CreateMatchRequest {
    private String courtId;
    private String customLocation;
    @NotNull private LocalDate date;
    @NotNull private LocalTime time;
    @NotNull private Level level;
    @Min(2) @Max(4) private int totalSpots;
    private String description;
}
