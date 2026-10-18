package com.catane.gather.service;

import com.catane.gather.entity.OtpPurpose;
import com.catane.gather.entity.OtpVerification;
import com.catane.gather.repository.OtpVerificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OtpService {

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int RESEND_COOLDOWN_SECONDS = 45;
    private static final int MAX_ATTEMPTS = 5;

    private final OtpVerificationRepository otpRepository;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(OtpVerificationRepository otpRepository, EmailService emailService) {
        this.otpRepository = otpRepository;
        this.emailService = emailService;
    }

    @Transactional
    public void generateAndSendOtp(String email, OtpPurpose purpose) {
        String normalizedEmail = email.toLowerCase().trim();

        // Check for resend cooldown
        Optional<OtpVerification> existingOtpOpt = otpRepository.findTopByEmailAndPurposeOrderByIdDesc(normalizedEmail, purpose);
        if (existingOtpOpt.isPresent()) {
            OtpVerification existing = existingOtpOpt.get();
            long secondsSinceCreated = Duration.between(existing.getCreatedAt(), LocalDateTime.now()).getSeconds();
            if (secondsSinceCreated < RESEND_COOLDOWN_SECONDS) {
                long waitTime = RESEND_COOLDOWN_SECONDS - secondsSinceCreated;
                throw new IllegalArgumentException("Please wait " + waitTime + " seconds before requesting another code.");
            }
            // Clean previous OTPs for this email and purpose
            otpRepository.deleteByEmailAndPurpose(normalizedEmail, purpose);
        }

        // Generate 6 digit secure OTP
        int code = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(code);

        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);
        OtpVerification otpVerification = new OtpVerification(normalizedEmail, otp, purpose, expiresAt);
        otpRepository.save(otpVerification);

        String label = (purpose == OtpPurpose.SIGNUP) ? "Sign Up" : "Password Reset";
        emailService.sendOtpEmail(normalizedEmail, otp, label);
    }

    @Transactional
    public void verifyOtp(String email, OtpPurpose purpose, String userOtp) {
        String normalizedEmail = email.toLowerCase().trim();

        OtpVerification otpRecord = otpRepository.findTopByEmailAndPurposeOrderByIdDesc(normalizedEmail, purpose)
                .orElseThrow(() -> new IllegalArgumentException("No verification code found for this email. Please request a code."));

        if (LocalDateTime.now().isAfter(otpRecord.getExpiresAt())) {
            otpRepository.delete(otpRecord);
            throw new IllegalArgumentException("The verification code has expired. Please request a new one.");
        }

        if (otpRecord.getAttempts() >= MAX_ATTEMPTS) {
            otpRepository.delete(otpRecord);
            throw new IllegalArgumentException("Too many incorrect attempts. Please request a new code.");
        }

        if (!otpRecord.getOtp().equals(userOtp.trim())) {
            otpRecord.setAttempts(otpRecord.getAttempts() + 1);
            otpRepository.save(otpRecord);
            int remaining = MAX_ATTEMPTS - otpRecord.getAttempts();
            throw new IllegalArgumentException("Invalid verification code. " + (remaining > 0 ? remaining + " attempt(s) remaining." : "Please request a new code."));
        }

        otpRecord.setVerified(true);
        otpRepository.save(otpRecord);
    }

    @Transactional
    public void consumeOtp(String email, OtpPurpose purpose) {
        String normalizedEmail = email.toLowerCase().trim();
        otpRepository.deleteByEmailAndPurpose(normalizedEmail, purpose);
    }
}
