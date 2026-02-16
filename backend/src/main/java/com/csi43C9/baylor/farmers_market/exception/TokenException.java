package com.csi43C9.baylor.farmers_market.exception;

import org.springframework.http.HttpStatus;
import lombok.Getter;

/**
 * Custom exception for security and refresh token errors.
 */
@Getter
public class TokenException extends RuntimeException {
    private final HttpStatus status;

    public TokenException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
