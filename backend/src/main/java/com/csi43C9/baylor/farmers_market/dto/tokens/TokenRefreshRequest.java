package com.csi43C9.baylor.farmers_market.dto.tokens;

import jakarta.validation.constraints.NotBlank;

public record TokenRefreshRequest(@NotBlank String refreshToken) {}
