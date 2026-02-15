package com.csi43C9.baylor.farmers_market.security;

import com.csi43C9.baylor.farmers_market.entity.User;
import com.csi43C9.baylor.farmers_market.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link UserDetailsServiceImpl}.
 */
@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    /**
     * Verifies that the service correctly loads a user by username
     * from the repository and returns a UserDetails object.
     */
    @Test
    void testLoadUserByUsernameUserFound() {
        // 1. Arrange: Create a fake user with a BCrypt hashed password
        String username = "user";
        String rawPassword = "password";
        String encodedPassword = new BCryptPasswordEncoder().encode(rawPassword);

        User mockUser = new User();
        mockUser.setEmail(username);
        mockUser.setPasswordHash(encodedPassword);

        // Stub the repository to return our mockUser when findByUsername is called
        when(userRepository.findByEmail(username)).thenReturn(Optional.of(mockUser));

        // 2. Act
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        // 3. Assert
        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo(username);

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        assertThat(encoder.matches(rawPassword, userDetails.getPassword())).isTrue();
    }

    /**
     * Verifies that the service throws a UsernameNotFoundException
     */
    @Test
    void testLoadUserByUsernameUserNotFound() {
        String username = "nonexistent-user";

        // Stub the repository to return an empty Optional
        when(userRepository.findByEmail(username)).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> userDetailsService.loadUserByUsername(username));
    }

    /**
     * Verifies that the service throws a UsernameNotFoundException with the correct message
     */
    @Test
    void testLoadUserByUsernameUserNotFoundMessage() {
        String username = "nonexistent-user";
        when(userRepository.findByEmail(username)).thenReturn(Optional.empty());

        UsernameNotFoundException exception = assertThrows(UsernameNotFoundException.class, () -> userDetailsService.loadUserByUsername(username));

        assertThat(exception.getMessage()).isEqualTo("User not found with username: " + username);
    }
}
