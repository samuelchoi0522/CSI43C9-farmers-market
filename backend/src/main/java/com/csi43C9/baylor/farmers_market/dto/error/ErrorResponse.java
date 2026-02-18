package com.csi43C9.baylor.farmers_market.dto.error;

import java.time.LocalDateTime;

/**
 * Error response DTO.
 * @param status HTTP status code
 * @param error error type
 * @param message error message
 * @param path request path
 * @param timestamp timestamp
 */
public record ErrorResponse(
        int status,
        String error,
        String message,
        String path,
        LocalDateTime timestamp
) {

}
