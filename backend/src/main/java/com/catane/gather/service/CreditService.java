package com.catane.gather.service;

import com.catane.gather.entity.CreditTransaction;
import com.catane.gather.entity.Gather;
import com.catane.gather.entity.Payment;
import com.catane.gather.entity.User;
import com.catane.gather.repository.CreditTransactionRepository;
import com.catane.gather.repository.GatherRepository;
import com.catane.gather.repository.PaymentRepository;
import com.catane.gather.repository.UserRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CreditService {

    private final UserRepository userRepository;
    private final GatherRepository gatherRepository;
    private final PaymentRepository paymentRepository;
    private final CreditTransactionRepository creditTransactionRepository;

    @Value("${razorpay.key-id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret:}")
    private String razorpayKeySecret;

    public CreditService(UserRepository userRepository,
                         GatherRepository gatherRepository,
                         PaymentRepository paymentRepository,
                         CreditTransactionRepository creditTransactionRepository) {
        this.userRepository = userRepository;
        this.gatherRepository = gatherRepository;
        this.paymentRepository = paymentRepository;
        this.creditTransactionRepository = creditTransactionRepository;
    }

    public int calculateBundlePrice(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }
        if (quantity == 1) return 99;
        if (quantity == 5) return 449; // Save ₹46
        if (quantity == 10) return 799; // Save ₹191

        if (quantity >= 10) {
            return quantity * 79;
        } else if (quantity >= 5) {
            return quantity * 89;
        } else {
            return quantity * 99;
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCreditBalanceAndHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<CreditTransaction> transactions = creditTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);

        List<Map<String, Object>> txHistory = transactions.stream().map(tx -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", tx.getId());
            item.put("amount", tx.getAmount());
            item.put("balanceAfter", tx.getBalanceAfter());
            item.put("type", tx.getType());
            item.put("description", tx.getDescription());
            item.put("createdAt", tx.getCreatedAt().toString());
            if (tx.getGather() != null) {
                item.put("gatherId", tx.getGather().getId());
                item.put("gatherTitle", tx.getGather().getTitle());
                item.put("slug", tx.getGather().getSlug());
            }
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("creditsBalance", user.getCreditsBalance());
        response.put("transactions", txHistory);
        return response;
    }

    @Transactional
    public Map<String, Object> createCreditOrder(Long userId, int quantity) {
        if (quantity < 1 || quantity > 500) {
            throw new IllegalArgumentException("Quantity must be between 1 and 500 credits");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        int totalInr = calculateBundlePrice(quantity);
        int amountInPaise = totalInr * 100;
        String razorpayOrderId = "order_credit_mock_" + System.currentTimeMillis();

        try {
            RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "credit_rcpt_u" + userId + "_" + System.currentTimeMillis());
            orderRequest.put("notes", new JSONObject()
                    .put("userId", userId)
                    .put("creditsQuantity", quantity)
                    .put("type", "CREDIT_PACK"));

            Order order = razorpay.orders.create(orderRequest);
            razorpayOrderId = order.get("id");
        } catch (Exception ex) {
            System.err.println("Razorpay credit order creation fallback: " + ex.getMessage());
        }

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setCreditsPurchased(quantity);
        payment.setAmountInInr(totalInr);
        payment.setCurrency("INR");
        payment.setPaymentType("CREDIT_PACK");
        payment.setRazorpayOrderId(razorpayOrderId);
        payment.setStatus("PENDING");

        paymentRepository.save(payment);

        Map<String, Object> response = new HashMap<>();
        response.put("orderId", razorpayOrderId);
        response.put("keyId", razorpayKeyId);
        response.put("amount", amountInPaise);
        response.put("totalInr", totalInr);
        response.put("quantity", quantity);
        response.put("currency", "INR");
        return response;
    }

    @Transactional
    public Map<String, Object> verifyCreditPayment(Long userId, String paymentId, String orderId, String signature) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Payment payment = paymentRepository.findByRazorpayOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found for order: " + orderId));

        if (!payment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Access denied for this payment record");
        }

        // Idempotency check: prevent replay attacks from repeatedly incrementing credits
        if ("CONFIRMED".equalsIgnoreCase(payment.getStatus())) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("message", "Payment already processed previously.");
            response.put("creditsAdded", 0);
            response.put("newBalance", user.getCreditsBalance());
            return response;
        }

        boolean isValid = false;
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);
            isValid = Utils.verifyPaymentSignature(options, razorpayKeySecret);
        } catch (Exception ex) {
            // Strict test mock fallback: ONLY allowed when in local test environment with explicit mock payment ID
            if (paymentId != null && paymentId.startsWith("pay_mock_") && "samplekeysecret123".equals(razorpayKeySecret)) {
                isValid = true;
            } else {
                isValid = false;
            }
        }

        if (!isValid) {
            payment.setStatus("FAILED");
            paymentRepository.save(payment);
            throw new IllegalArgumentException("Payment verification failed! Invalid cryptographic signature.");
        }

        payment.setRazorpayPaymentId(paymentId);
        payment.setRazorpaySignature(signature);
        payment.setStatus("CONFIRMED");
        paymentRepository.save(payment);

        int creditsToAdd = payment.getCreditsPurchased() != null ? payment.getCreditsPurchased() : 1;
        userRepository.addCreditsAtomically(userId, creditsToAdd);

        // Fetch refreshed balance
        User updatedUser = userRepository.findById(userId).orElseThrow();
        int newBalance = updatedUser.getCreditsBalance();

        CreditTransaction tx = new CreditTransaction(
                updatedUser,
                creditsToAdd,
                newBalance,
                "PURCHASE",
                null,
                payment,
                "Purchased " + creditsToAdd + " event credit" + (creditsToAdd > 1 ? "s" : "")
        );
        creditTransactionRepository.save(tx);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Credits added successfully!");
        response.put("creditsAdded", creditsToAdd);
        response.put("newBalance", newBalance);
        return response;
    }

    @Transactional
    public Map<String, Object> publishGatherWithCredit(Long userId, Long gatherId) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        if ("COMPLETED".equalsIgnoreCase(gather.getStatus()) || "ARCHIVED".equalsIgnoreCase(gather.getStatus())) {
            throw new IllegalStateException("Concluded celebrations cannot be republished. Please duplicate this event to create a fresh draft.");
        }

        if (gather.getEventDate() != null && gather.getEventDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Your event date has already passed. Please update to an upcoming date before publishing.");
        }

        if ("LIVE".equalsIgnoreCase(gather.getStatus())) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "SUCCESS");
            response.put("message", "Gather is already published and live!");
            response.put("slug", gather.getSlug());
            response.put("publicUrl", "/g/" + gather.getSlug());
            return response;
        }

        int affectedRows = userRepository.deductCreditsAtomically(userId, 1);
        if (affectedRows == 0) {
            throw new IllegalStateException("Insufficient event credits. Please top up your wallet to publish.");
        }

        gather.setStatus("LIVE");
        gatherRepository.save(gather);

        User updatedUser = userRepository.findById(userId).orElseThrow();
        int newBalance = updatedUser.getCreditsBalance();

        CreditTransaction tx = new CreditTransaction(
                updatedUser,
                -1,
                newBalance,
                "EVENT_PUBLISH",
                gather,
                null,
                "Published gathering: " + (gather.getTitle() != null ? gather.getTitle() : "Event #" + gather.getId())
        );
        creditTransactionRepository.save(tx);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "SUCCESS");
        response.put("message", "Gather published successfully with 1 credit!");
        response.put("slug", gather.getSlug());
        response.put("publicUrl", "/g/" + gather.getSlug());
        response.put("remainingCredits", newBalance);
        return response;
    }
}
