package com.csi43C9.baylor.farmers_market.security;

import com.csi43C9.baylor.farmers_market.repository.UserRepository;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import com.csi43C9.baylor.farmers_market.entity.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Custom implementation of Spring Security's {@link UserDetailsService}.
 *
 * <p>This service is responsible for loading user-specific data during the
 * authentication process. It retrieves a user's details (like username,
 * password, and authorities) based on their username. Currently, it uses
 * a hardcoded user for demonstration but is intended to fetch
 * user data from a persistent store (e.g., a database).
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository userRepository;

    /**
     * Locates the user based on the username.
     * In the actual implementation, the search may be case-sensitive or case-insensitive depending on how the
     * implementation instance is configured. In this case, the lookup is case-sensitive.
     *
     * @param email the username identifying the user whose data is required.
     * @return a fully populated user record (never {@code null}).
     * @throws UsernameNotFoundException if the user could not be found or the user has no GrantedAuthority.
     */
    @Override
    @NonNull
    public UserDetails loadUserByUsername(@NonNull String email) throws UsernameNotFoundException {
        // Attempt to find the user by email address
        User user = userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + email));

        // Create a Spring Security user object from the retrieved user record
        return new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPasswordHash(), List.of(new SimpleGrantedAuthority("ROLE_USER")));
    }
}
