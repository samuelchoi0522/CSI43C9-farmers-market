package com.csi43C9.baylor.farmers_market.exception;

import lombok.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global exception handler for all REST controllers. Handles exceptions and returns
 * standardized error responses.
 */
@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles malformed JSON requests.
     * @param ignoredEx the caught exception.
     * @return 400 Bad Request
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<@NonNull Map<String, Object>> handleBadRequest(Exception ignoredEx) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Malformed JSON request or missing body");
    }

    /**
     * Handles validation errors.
     * @param ex the caught exception.
     * @return 400 Bad Request
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<@NonNull Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        return buildResponse(HttpStatus.BAD_REQUEST, "Validation Failed: " + details);
    }

    /**
     * Handles database constraint violations.
     * @param ex the caught exception.
     * @return 409 Conflict
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<@NonNull Map<String, Object>> handleConflict(DataIntegrityViolationException ex) {
        logger.error("Database error: ", ex);
        return buildResponse(HttpStatus.CONFLICT, "Database error: Possible duplicate entry or constraint violation.");
    }

    /**
     * Handles authentication failures.
     * @param e the caught exception.
     * @return 401 Unauthorized
     */
    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ResponseEntity<@NonNull Map<String, Object>> handleAuthFailure(Exception e) {
        logger.debug("Authentication error: ", e);
        return buildResponse(HttpStatus.UNAUTHORIZED, "Invalid username or password.");
    }

    /**
     * Fallback handler for any exceptions not specifically caught by other methods.
     * This typically handles runtime exceptions like NullPointerException or
     * unexpected database failures.
     *
     * @param ex the caught exception.
     * @param ignoredRequest the current web request.
     * @return a {@link ResponseEntity} with a 500 Internal Server Error status.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<@NonNull Map<String, Object>> handleAllUncaughtExceptions(Exception ex, WebRequest ignoredRequest) {
        logger.error("Unexpected error occurred: ", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
    }

    /**
     * Builds a standardized response body for all exceptions.
     * @param status the HTTP status code.
     * @param message the error message.
     * @return a ResponseEntity with the specified status and body.
     */
    private ResponseEntity<@NonNull Map<String, Object>> buildResponse(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return new ResponseEntity<>(body, status);
    }
}
