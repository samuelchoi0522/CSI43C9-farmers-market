package com.csi43C9.baylor.farmers_market.security;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

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
