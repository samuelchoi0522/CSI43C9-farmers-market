package com.csi43C9.baylor.farmers_market.exception;

import com.csi43C9.baylor.farmers_market.dto.error.ErrorResponse;
import lombok.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * Global exception handler for all REST controllers. Handles exceptions and returns
 * standardized ErrorResponse objects.
 */
@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles malformed JSON requests.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<@NonNull ErrorResponse> handleBadRequest(HttpMessageNotReadableException ignoredEx, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Malformed JSON request or missing body", request);
    }

    /**
     * Handles wrong Content-Type headers (e.g., text/plain vs application/json).
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<@NonNull ErrorResponse> handleUnsupportedMediaType(HttpMediaTypeNotSupportedException ex, WebRequest request) {
        String message = String.format("Content-Type '%s' is not supported. Please use 'application/json'.", ex.getContentType());
        return buildResponse(HttpStatus.UNSUPPORTED_MEDIA_TYPE, message, request);
    }

    /**
     * Handles validation errors from @Valid annotations.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<@NonNull ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex, WebRequest request) {
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        return buildResponse(HttpStatus.BAD_REQUEST, "Validation Failed: " + details, request);
    }

    /**
     * Handles database constraint violations like duplicates.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<@NonNull ErrorResponse> handleConflict(DataIntegrityViolationException ex, WebRequest request) {
        logger.error("Database error: ", ex);
        return buildResponse(HttpStatus.CONFLICT, "Database error: Possible duplicate entry or constraint violation.", request);
    }

    /**
     * Handles login and user lookup failures.
     */
    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ResponseEntity<@NonNull ErrorResponse> handleAuthFailure(Exception e, WebRequest request) {
        logger.debug("Authentication error: ", e);
        return buildResponse(HttpStatus.UNAUTHORIZED, "Invalid username or password.", request);
    }

    /**
     * Handles custom TokenExceptions (Missing tokens, expired tokens).
     */
    @ExceptionHandler(TokenException.class)
    public ResponseEntity<@NonNull ErrorResponse> handleTokenException(TokenException ex, WebRequest request) {
        return buildResponse(ex.getStatus(), ex.getMessage(), request);
    }

    /**
     * Handles business logic errors like invalid percentages or data formats.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<@NonNull ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    /**
     * Fallback handler for all other uncaught exceptions.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<@NonNull ErrorResponse> handleAllUncaughtExceptions(Exception ex, WebRequest request) {
        logger.error("Unexpected error occurred: ", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request);
    }

    /**
     * Utility method to consistently build the ErrorResponse record.
     */
    private ResponseEntity<@NonNull ErrorResponse> buildResponse(HttpStatus status, String message, WebRequest request) {
        String path = "";
        if (request instanceof ServletWebRequest servletRequest) {
            path = servletRequest.getRequest().getRequestURI();
        }

        ErrorResponse errorResponse = new ErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                message,
                path,
                LocalDateTime.now()
        );
        return new ResponseEntity<>(errorResponse, status);
    }
}
