package com.csi43C9.baylor.farmers_market.security;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

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
public class UserDetailsServiceImpl implements UserDetailsService {


    /**
     * Locates the user based on the username.
     * In the actual implementation, the search may be case-sensitive or case-insensitive depending on how the
     * implementation instance is configured. In this case, the lookup is case-sensitive.
     *
     * @param username the username identifying the user whose data is required.
     * @return a fully populated user record (never {@code null}).
     * @throws UsernameNotFoundException if the user could not be found or the user has no GrantedAuthority.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // TODO: fetch the user from the database here.
        if ("user".equals(username)) {
            return new User(
                    "user",
                    new BCryptPasswordEncoder().encode("password"),
                    new ArrayList<>() // No authorities for now
            );
        } else {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
    }
}
