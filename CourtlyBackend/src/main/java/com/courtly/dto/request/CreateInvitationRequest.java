package com.courtly.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CreateInvitationRequest {
    @NotNull private String toUserId;
    @NotNull private String courtId;
    @NotNull private LocalDate date;
    @NotNull private LocalTime time;
    private String message;
}
