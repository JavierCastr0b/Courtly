package com.courtly.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CreateInvitationRequest {
    @NotNull private String toUserId;
    private String courtId;
    private String customLocation;
    @NotNull private LocalDate date;
    @NotNull private LocalTime time;
    private String message;
}
