package com.csi43C9.baylor.farmers_market.security.jwt;

import com.csi43C9.baylor.farmers_market.security.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter for processing JSON Web Token (JWT) authentication in incoming requests.
 *
 * <p>This filter intercepts HTTP requests, extracts JWTs from the Authorization header,
 * validates them using {@link JwtUtil}, and sets up the Spring Security authentication
 * context if the token is valid. This ensures that later security checks
 * are aware of the authenticated user.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsServiceImpl userDetailsService;


    /**
     * The core logic of the JWT authentication filter.
     * This method intercepts incoming requests, parses the JWT from the Authorization header,
     * validates it, and sets the user's authentication in the {@link SecurityContextHolder} if the token is valid.
     *
     * @param request     the {@link HttpServletRequest} to process.
     * @param response    the {@link HttpServletResponse} to use.
     * @param filterChain the {@link FilterChain} to pass the request along to the next filter.
     * @throws ServletException if a servlet-related exception occurs.
     * @throws IOException      if an I/O error occurs during processing.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            if (jwt != null) {
                String username = jwtUtil.extractUsername(jwt);

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                    if (jwtUtil.validateToken(jwt, userDetails)) {
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e);
        }

        filterChain.doFilter(request, response);
    }


    /**
     * Extracts the JWT from the "Authorization" header of the incoming HTTP request.
     * The token is expected to be in the "Bearer [token]" format.
     *
     * @param request the {@link HttpServletRequest} from which to extract the token.
     * @return the JWT as a {@link String}, or {@code null} if the header is not found or is malformed.
     */
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
}
