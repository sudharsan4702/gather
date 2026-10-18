package com.catane.gather.service;

import com.catane.gather.dto.*;
import com.catane.gather.entity.OtpPurpose;
import com.catane.gather.entity.User;
import com.catane.gather.repository.UserRepository;
import com.catane.gather.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final OtpService otpService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       OtpService otpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.otpService = otpService;
    }

    public void sendSignupOtp(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }
        otpService.generateAndSendOtp(normalizedEmail, OtpPurpose.SIGNUP);
    }

    @Transactional
    public AuthResponse signUpWithOtp(OtpSignUpRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        // Verify OTP code
        otpService.verifyOtp(normalizedEmail, OtpPurpose.SIGNUP, request.getOtp());

        // Create and persist user
        User user = new User(
                request.getName().trim(),
                normalizedEmail,
                passwordEncoder.encode(request.getPassword())
        );

        User savedUser = userRepository.save(user);

        // Consume OTP record after successful registration
        otpService.consumeOtp(normalizedEmail, OtpPurpose.SIGNUP);

        String token = tokenProvider.generateToken(savedUser.getEmail());
        return new AuthResponse(token, savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getCreditsBalance());
    }

    public void sendForgotPasswordOtp(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        java.util.Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isPresent()) {
            otpService.generateAndSendOtp(userOpt.get().getEmail(), OtpPurpose.FORGOT_PASSWORD);
        } else {
            // Return silently so external attackers cannot enumerate registered email addresses
            org.slf4j.LoggerFactory.getLogger(AuthService.class).info("Forgot password requested for non-existent email: {}", normalizedEmail);
        }
    }

    public void verifyForgotPasswordOtp(String email, String otp) {
        String normalizedEmail = email.toLowerCase().trim();
        otpService.verifyOtp(normalizedEmail, OtpPurpose.FORGOT_PASSWORD, otp);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        // Verify OTP code
        otpService.verifyOtp(normalizedEmail, OtpPurpose.FORGOT_PASSWORD, request.getOtp());

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email address"));

        // Update with newly encoded password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Consume OTP record
        otpService.consumeOtp(normalizedEmail, OtpPurpose.FORGOT_PASSWORD);
    }

    public AuthResponse signUp(SignUpRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        User user = new User(
                request.getName().trim(),
                request.getEmail().toLowerCase().trim(),
                passwordEncoder.encode(request.getPassword())
        );

        User savedUser = userRepository.save(user);
        String token = tokenProvider.generateToken(savedUser.getEmail());

        return new AuthResponse(token, savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getCreditsBalance());
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        String token = tokenProvider.generateToken(user.getEmail());

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getCreditsBalance());
    }

    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getCreditsBalance(), user.getCreatedAt());
    }
}

