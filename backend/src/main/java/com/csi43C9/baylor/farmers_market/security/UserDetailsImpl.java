package com.csi43C9.baylor.farmers_market.security;

import com.csi43C9.baylor.farmers_market.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.jspecify.annotations.NullMarked;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

/**
 * Implementation of Spring Security's {@link UserDetails} interface.
 */
@Getter
@AllArgsConstructor
public class UserDetailsImpl implements UserDetails {
    private final UUID id;
    private final String username;
    private final String password;

    /**
     * Builds a {@link UserDetailsImpl} from a {@link User} entity.
     * @param user the user entity to build from
     * @return a new {@link UserDetailsImpl} instance
     */
    public static UserDetailsImpl build(User user) {
        return new UserDetailsImpl(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash()
        );
    }

    /**
     * Returns an empty collection of authorities, since this application does not use roles.
     * @return an empty collection
     */
    @Override
    @NullMarked
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList(); // Add roles here if needed later
    }

    // Standard boilerplate overrides
    @Override public boolean isAccountNonExpired() { return true; }
}