package com.courtly.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateCourtRequest {
    @NotBlank private String name;
    @NotBlank private String address;
    @NotNull private Double latitude;
    @NotNull private Double longitude;
    private String surface;
    private int totalCourts;
}
