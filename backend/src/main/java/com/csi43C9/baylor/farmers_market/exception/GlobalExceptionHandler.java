package com.csi43C9.baylor.farmers_market.exception;

import lombok.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 1. Handles missing body or malformed JSON
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<@NonNull Map<String, Object>> handleBadRequest(Exception ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Malformed JSON request or missing body");
    }

    // 2. Handles @Valid validation errors (e.g., @NotBlank, @Size)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<@NonNull Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        return buildResponse(HttpStatus.BAD_REQUEST, "Validation Failed: " + details);
    }

    // 3. Handles Database Constraint Violations (e.g., Duplicate Entry)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<@NonNull Map<String, Object>> handleConflict(DataIntegrityViolationException ex) {
        logger.error("Database error: ", ex);
        return buildResponse(HttpStatus.CONFLICT, "Database error: Possible duplicate entry or constraint violation.");
    }

    /**
     * Fallback handler for any exceptions not specifically caught by other methods.
     * This typically handles runtime exceptions like NullPointerException or
     * unexpected database failures.
     *
     * @param ex the caught exception.
     * @param request the current web request.
     * @return a {@link ResponseEntity} with a 500 Internal Server Error status.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<@NonNull Map<String, Object>> handleAllUncaughtExceptions(Exception ex, WebRequest request) {
        logger.error("Unexpected error occurred: ", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }

    // Helper method to keep code DRY
    private ResponseEntity<@NonNull Map<String, Object>> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return new ResponseEntity<>(body, status);
    }
}
