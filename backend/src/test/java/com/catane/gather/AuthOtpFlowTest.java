package com.catane.gather;

import com.catane.gather.dto.AuthResponse;
import com.catane.gather.dto.LoginRequest;
import com.catane.gather.dto.OtpSignUpRequest;
import com.catane.gather.dto.ResetPasswordRequest;
import com.catane.gather.entity.OtpPurpose;
import com.catane.gather.entity.OtpVerification;
import com.catane.gather.repository.OtpVerificationRepository;
import com.catane.gather.repository.UserRepository;
import com.catane.gather.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AuthOtpFlowTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpVerificationRepository otpRepository;

    @BeforeEach
    void setUp() {
        cleanUser("testuser@example.com");
        cleanUser("resetuser@example.com");
    }

    private void cleanUser(String email) {
        otpRepository.deleteByEmailAndPurpose(email, OtpPurpose.SIGNUP);
        otpRepository.deleteByEmailAndPurpose(email, OtpPurpose.FORGOT_PASSWORD);
        userRepository.findByEmail(email).ifPresent(userRepository::delete);
    }

    @Test
    void testSignupWithOtpFlow() {
        String email = "testuser@example.com";

        // Step 1: Request OTP for Signup
        authService.sendSignupOtp(email);

        OtpVerification otpRecord = otpRepository.findTopByEmailAndPurposeOrderByIdDesc(email, OtpPurpose.SIGNUP)
                .orElseThrow(() -> new AssertionError("OTP not generated"));
        assertNotNull(otpRecord.getOtp());
        assertEquals(6, otpRecord.getOtp().length());

        // Step 2: Try signup with wrong OTP
        OtpSignUpRequest invalidReq = new OtpSignUpRequest("Test User", email, "secret123", "000000");
        assertThrows(IllegalArgumentException.class, () -> authService.signUpWithOtp(invalidReq));

        // Step 3: Signup with valid OTP
        OtpSignUpRequest validReq = new OtpSignUpRequest("Test User", email, "secret123", otpRecord.getOtp());
        AuthResponse response = authService.signUpWithOtp(validReq);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals(email, response.getEmail());
        assertTrue(userRepository.existsByEmail(email));

        // Verify OTP was consumed
        assertTrue(otpRepository.findTopByEmailAndPurposeOrderByIdDesc(email, OtpPurpose.SIGNUP).isEmpty());
    }

    @Test
    void testForgotPasswordAndResetFlow() {
        String email = "resetuser@example.com";

        // Create an initial user via signup
        authService.sendSignupOtp(email);
        OtpVerification signupOtp = otpRepository.findTopByEmailAndPurposeOrderByIdDesc(email, OtpPurpose.SIGNUP).get();
        authService.signUpWithOtp(new OtpSignUpRequest("Reset User", email, "oldPassword123", signupOtp.getOtp()));

        // Step 1: Request Forgot Password OTP
        authService.sendForgotPasswordOtp(email);
        OtpVerification resetOtp = otpRepository.findTopByEmailAndPurposeOrderByIdDesc(email, OtpPurpose.FORGOT_PASSWORD)
                .orElseThrow(() -> new AssertionError("Reset OTP not generated"));
        assertNotNull(resetOtp.getOtp());

        // Step 2: Reset password with valid OTP
        ResetPasswordRequest resetReq = new ResetPasswordRequest(email, resetOtp.getOtp(), "newPassword456");
        authService.resetPassword(resetReq);

        // Step 3: Old password should fail
        assertThrows(Exception.class, () -> authService.login(new LoginRequest(email, "oldPassword123")));

        // Step 4: New password should succeed
        AuthResponse loginResponse = authService.login(new LoginRequest(email, "newPassword456"));
        assertNotNull(loginResponse);
        assertNotNull(loginResponse.getToken());
        assertEquals(email, loginResponse.getEmail());
    }
}
