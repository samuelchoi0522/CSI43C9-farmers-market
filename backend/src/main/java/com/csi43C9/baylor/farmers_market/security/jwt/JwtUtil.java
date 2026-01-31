package com.csi43C9.baylor.farmers_market.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Utility class for JSON Web Token (JWT) operations.
 *
 * <p>This class provides methods for generating, extracting information from,
 * and validating JWTs used for authentication within the application.
 * It handles the creation of tokens, retrieval of claims like username and
 * expiration date, and verification of token integrity and validity.
 */
@Component
public class JwtUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    @Value("${farmers.market.jwt.secret}")
    private String jwtSecret;

    @Value("${farmers.market.jwt.expiration-ms}")
    private int jwtExpirationMs;


    /**
     * Extracts the username from the given JWT token.
     *
     * @param token the JWT token from which to extract the username.
     * @return the username stored in the token's subject.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }


    /**
     * Extracts the expiration date from the given JWT token.
     *
     * @param token the JWT token from which to extract the expiration date.
     * @return the expiration {@link Date} of the token.
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }


    /**
     * Extracts a specific claim from the JWT token using a provided claims resolver function.
     * This is a generic method that can retrieve any claim from the token.
     *
     * @param <T>            the type of the claim to be returned.
     * @param token          the JWT token from which to extract the claim.
     * @param claimsResolver a {@link Function} that resolves the desired claim from the {@link Claims}.
     * @return the extracted claim.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }


    /**
     * Parses the JWT token and returns all of its claims.
     * This private method is a helper for extracting token data.
     *
     * @param token the JWT token to parse.
     * @return a {@link Claims} object containing all claims from the token.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
    }


    /**
     * Checks if the JWT token has expired.
     *
     * @param token the JWT token to check.
     * @return {@code true} if the token's expiration date is before the current date, {@code false} otherwise.
     */
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }


    /**
     * Generates a new JWT token for the given user.
     *
     * @param userDetails the {@link UserDetails} of the user for whom the token is being generated.
     * @return a JWT token as a {@link String}.
     */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername());
    }


    /**
     * Creates a new JWT token with the specified claims and subject, then signs it.
     * This is a helper method for token generation.
     *
     * @param claims  a {@link Map} of claims to include in the token's payload.
     * @param subject the subject of the token (typically the username).
     * @return the compact, URL-safe JWT string.
     */
    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }


    /**
     * Validates the JWT token.
     * This method checks if the username in the token matches the username in the provided {@link UserDetails}
     * and if the token is not expired.
     *
     * @param token       the JWT token to validate.
     * @param userDetails the {@link UserDetails} of the user to validate against.
     * @return {@code true} if the token is valid, {@code false} otherwise.
     */
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }


    /**
     * Decodes the base64-encoded JWT secret and returns it as a {@link Key} object.
     * This key is used for signing and verifying JWT tokens.
     *
     * @return the signing {@link Key}.
     */
    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
