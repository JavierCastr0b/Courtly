package com.courtly.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateChallengeRequest {
    @NotNull private String challengedUserId;
    @NotBlank private String description;
    @NotNull @Future private LocalDate deadline;
}
