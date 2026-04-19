package com.courtly.dto.request;

import com.courtly.entity.Level;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CreatePostRequest {
    @NotBlank private String title;
    private String description;
    private String location;
    private Level level;
    private int playersNeeded;
    private LocalDate date;
    private LocalTime time;
}
