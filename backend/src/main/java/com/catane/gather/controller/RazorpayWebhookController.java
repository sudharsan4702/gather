package com.catane.gather.controller;

import com.catane.gather.entity.CreditTransaction;
import com.catane.gather.entity.Gather;
import com.catane.gather.entity.Payment;
import com.catane.gather.entity.User;
import com.catane.gather.repository.CreditTransactionRepository;
import com.catane.gather.repository.GatherRepository;
import com.catane.gather.repository.PaymentRepository;
import com.catane.gather.repository.UserRepository;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/webhooks")
public class RazorpayWebhookController {

    private static final Logger log = LoggerFactory.getLogger(RazorpayWebhookController.class);

    private final PaymentRepository paymentRepository;
    private final GatherRepository gatherRepository;
    private final UserRepository userRepository;
    private final CreditTransactionRepository creditTransactionRepository;

    @Value("${razorpay.webhook.secret:${razorpay.key-secret:}}")
    private String webhookSecret;

    public RazorpayWebhookController(PaymentRepository paymentRepository,
                                     GatherRepository gatherRepository,
                                     UserRepository userRepository,
                                     CreditTransactionRepository creditTransactionRepository) {
        this.paymentRepository = paymentRepository;
        this.gatherRepository = gatherRepository;
        this.userRepository = userRepository;
        this.creditTransactionRepository = creditTransactionRepository;
    }

    @PostMapping("/razorpay")
    @Transactional
    public ResponseEntity<String> handleRazorpayWebhook(@RequestBody String payload,
                                                        @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        if (signature == null || signature.isBlank()) {
            log.warn("Rejected webhook without signature header");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing signature");
        }

        try {
            boolean isValid = Utils.verifyWebhookSignature(payload, signature, webhookSecret);
            if (!isValid) {
                log.error("Invalid webhook cryptographic signature");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid signature");
            }
        } catch (Exception e) {
            log.error("Webhook signature verification error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature verification error");
        }

        try {
            JSONObject json = new JSONObject(payload);
            String event = json.optString("event");
            log.info("Processing Razorpay webhook event: {}", event);

            if ("order.paid".equalsIgnoreCase(event) || "payment.captured".equalsIgnoreCase(event)) {
                JSONObject payloadObj = json.getJSONObject("payload");
                JSONObject paymentEntity = payloadObj.getJSONObject("payment").getJSONObject("entity");
                String orderId = paymentEntity.optString("order_id");
                String paymentId = paymentEntity.optString("id");

                if (orderId != null && !orderId.isBlank()) {
                    fulfillPaymentRecord(orderId, paymentId);
                }
            }

            return ResponseEntity.ok("Webhook processed successfully");
        } catch (Exception e) {
            log.error("Failed to process webhook payload: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Webhook processing failed");
        }
    }

    private void fulfillPaymentRecord(String orderId, String paymentId) {
        Optional<Payment> paymentOpt = paymentRepository.findByRazorpayOrderId(orderId);
        if (paymentOpt.isEmpty()) {
            log.warn("No pending payment found for order: {}", orderId);
            return;
        }

        Payment payment = paymentOpt.get();
        if ("CONFIRMED".equalsIgnoreCase(payment.getStatus())) {
            log.info("Payment for order {} already confirmed (idempotent skip)", orderId);
            return;
        }

        payment.setRazorpayPaymentId(paymentId);
        payment.setStatus("CONFIRMED");
        paymentRepository.save(payment);

        if ("CREDIT_PACK".equalsIgnoreCase(payment.getPaymentType())) {
            User user = payment.getUser();
            if (user != null) {
                int creditsToAdd = payment.getCreditsPurchased() != null ? payment.getCreditsPurchased() : 1;
                userRepository.addCreditsAtomically(user.getId(), creditsToAdd);

                User refreshed = userRepository.findById(user.getId()).orElse(user);
                CreditTransaction tx = new CreditTransaction(
                        refreshed,
                        creditsToAdd,
                        refreshed.getCreditsBalance(),
                        "PURCHASE",
                        null,
                        payment,
                        "Webhook fulfilled " + creditsToAdd + " credits (Order: " + orderId + ")"
                );
                creditTransactionRepository.save(tx);
                log.info("Webhook successfully credited {} passes to user {}", creditsToAdd, user.getEmail());
            }
        } else if (payment.getGather() != null) {
            Gather gather = payment.getGather();
            gather.setStatus("LIVE");
            gatherRepository.save(gather);
            log.info("Webhook successfully set gather {} (slug: {}) to LIVE", gather.getId(), gather.getSlug());
        }
    }
}
