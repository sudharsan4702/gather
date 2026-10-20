package com.catane.gather.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final HttpClient httpClient;

    @Value("${resend.api-key:${RESEND_API_KEY:}}")
    private String resendApiKey;

    @Value("${resend.from-email:${RESEND_FROM_EMAIL:Catane Gather <onboarding@resend.dev>}}")
    private String resendFromEmail;

    @Value("${gather.mail.from:noreply@catanegather.com}")
    private String mailFrom;

    @Value("${gather.mail.sender-name:Catane Gather}")
    private String senderName;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public void sendOtpEmail(String toEmail, String otp, String purposeLabel) {
        String subject = "Catane Gather: Your " + purposeLabel + " Code is " + otp;
        String htmlContent = buildOtpHtmlTemplate(otp, purposeLabel);

        // 1. Priority: If RESEND_API_KEY is configured, send via Resend HTTPS (bypasses Render SMTP port blocks)
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            boolean sent = sendViaResend(toEmail, subject, htmlContent, purposeLabel, otp);
            if (sent) {
                return;
            }
            log.warn("Resend delivery failed. Falling back to SMTP...");
        }

        // 2. Existing SMTP fallback: JavaMailSender
        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Fallback OTP for [{}] ({}) is: {}", toEmail, purposeLabel, otp);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(new InternetAddress(mailFrom, senderName));
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Successfully sent {} OTP email via SMTP to {}", purposeLabel, toEmail);
        } catch (Exception e) {
            log.error("Failed to send SMTP email to {}: {}. [DEV FALLBACK] OTP code is: {}", toEmail, e.getMessage(), otp);
            // In dev mode, if SMTP credentials are placeholder or rejected by host, log clearly
            // We do not rethrow so user can test even with mock credentials, or we can check if requested
        }
    }

    private boolean sendViaResend(String toEmail, String subject, String htmlContent, String purposeLabel, String otp) {
        try {
            JSONObject body = new JSONObject();
            body.put("from", resendFromEmail);

            JSONArray toArray = new JSONArray();
            toArray.put(toEmail);
            body.put("to", toArray);

            body.put("subject", subject);
            body.put("html", htmlContent);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body.toString(), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Successfully sent {} OTP email to {} via Resend HTTPS (status {})", purposeLabel, toEmail, response.statusCode());
                return true;
            } else {
                log.error("Resend API rejected email to {}. HTTP {}: {}. [DEV FALLBACK] OTP code is: {}",
                        toEmail, response.statusCode(), response.body(), otp);
                return false;
            }
        } catch (Exception e) {
            log.error("Error communicating with Resend API for {}: {}. [DEV FALLBACK] OTP code is: {}",
                    toEmail, e.getMessage(), otp);
            return false;
        }
    }

    private String buildOtpHtmlTemplate(String otp, String purposeLabel) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head><meta charset='UTF-8'></head>"
                + "<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;\">"
                + "  <div style=\"max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);\">"
                + "    <div style=\"background-color: #0f172a; padding: 24px; text-align: center;\">"
                + "      <h1 style=\"color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;\">CATANE GATHER</h1>"
                + "      <p style=\"color: #94a3b8; margin: 4px 0 0 0; font-size: 13px;\">Celebrate moments together</p>"
                + "    </div>"
                + "    <div style=\"padding: 32px 28px;\">"
                + "      <h2 style=\"font-size: 18px; color: #1e293b; margin-top: 0; margin-bottom: 8px;\">" + purposeLabel + " Verification</h2>"
                + "      <p style=\"color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 24px;\">"
                + "        Use the one-time verification code below to complete your " + purposeLabel.toLowerCase() + ". This code is valid for <strong>10 minutes</strong>."
                + "      </p>"
                + "      <div style=\"text-align: center; margin: 28px 0;\">"
                + "        <div style=\"display: inline-block; background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 14px 28px; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0f172a;\">"
                + "          " + otp
                + "        </div>"
                + "      </div>"
                + "      <p style=\"color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 24px;\">"
                + "        If you did not request this code, no action is needed. Please do not share this code with anyone."
                + "      </p>"
                + "    </div>"
                + "    <div style=\"background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center;\">"
                + "      <p style=\"color: #94a3b8; font-size: 11px; margin: 0;\">© " + java.time.Year.now().getValue() + " Catane Gather. All rights reserved.</p>"
                + "    </div>"
                + "  </div>"
                + "</body>"
                + "</html>";
    }
}
