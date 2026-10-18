package com.catane.gather.controller;

import com.catane.gather.dto.*;
import com.catane.gather.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup/send-otp")
    public ResponseEntity<MessageResponse> sendSignupOtp(@Valid @RequestBody EmailRequest request) {
        authService.sendSignupOtp(request.getEmail());
        return ResponseEntity.ok(new MessageResponse("Verification code sent to " + request.getEmail()));
    }

    @PostMapping("/signup/verify")
    public ResponseEntity<AuthResponse> signUpWithOtp(@Valid @RequestBody OtpSignUpRequest request) {
        AuthResponse response = authService.signUpWithOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<MessageResponse> sendForgotPasswordOtp(@Valid @RequestBody EmailRequest request) {
        authService.sendForgotPasswordOtp(request.getEmail());
        return ResponseEntity.ok(new MessageResponse("Password reset code sent to " + request.getEmail()));
    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<MessageResponse> verifyForgotPasswordOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyForgotPasswordOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(new MessageResponse("Verification code confirmed"));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(new MessageResponse("Password reset successfully. You can now sign in with your new password."));
    }

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signUp(@Valid @RequestBody SignUpRequest request) {
        AuthResponse response = authService.signUp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        UserResponse userResponse = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(userResponse);
    }
}
