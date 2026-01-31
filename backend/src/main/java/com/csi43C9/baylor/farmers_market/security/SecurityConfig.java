package com.csi43C9.baylor.farmers_market.security;

import com.csi43C9.baylor.farmers_market.security.jwt.AuthEntryPointJwt;
import com.csi43C9.baylor.farmers_market.security.jwt.JwtAuthFilter;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuration class for Spring Security.
 *
 * <p>This class sets up the security configurations for the application,
 * including enabling web security and method security, configuring JWT
 * authentication, defining password encoding, and setting authorization
 * rules for different API endpoints. It integrates {@link JwtAuthFilter}
 * and {@link AuthEntryPointJwt} into the security chain.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@AllArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final JwtAuthFilter jwtAuthFilter;


    /**
     * Provides a {@link PasswordEncoder} bean for the application.
     * This is used to encode passwords for storage and to verify them during authentication.
     *
     * @return a {@link BCryptPasswordEncoder} instance.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }


    /**
     * Provides the {@link AuthenticationManager} bean, which is the main Spring Security interface for authenticating a user.
     *
     * @param authenticationConfiguration the {@link AuthenticationConfiguration} from which to get the manager.
     * @return the configured {@link AuthenticationManager}.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) {
        return authenticationConfiguration.getAuthenticationManager();
    }


    /**
     * Configures the main security filter chain for the application.
     * This method defines the security rules for HTTP requests, including CSRF protection,
     * exception handling, session management, and request authorization. It also adds the
     * {@link JwtAuthFilter} to the filter chain.
     *
     * @param http the {@link HttpSecurity} builder to configure.
     * @return the built {@link SecurityFilterChain}.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth ->
                        auth.requestMatchers("/api/auth/**").permitAll()
                                .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
