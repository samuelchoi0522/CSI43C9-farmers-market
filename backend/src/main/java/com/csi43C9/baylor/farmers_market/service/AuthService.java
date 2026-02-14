package com.csi43C9.baylor.farmers_market.service;

import com.csi43C9.baylor.farmers_market.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
}
