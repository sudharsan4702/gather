package com.catane.gather.controller;

import com.catane.gather.repository.UserRepository;
import com.catane.gather.service.CreditService;
import com.catane.gather.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/organiser/gathers")
public class PaymentController {

    private final PaymentService paymentService;
    private final CreditService creditService;
    private final UserRepository userRepository;

    public PaymentController(PaymentService paymentService, CreditService creditService, UserRepository userRepository) {
        this.paymentService = paymentService;
        this.creditService = creditService;
        this.userRepository = userRepository;
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"))
                .getId();
    }

    @PostMapping("/{id}/publish-with-credit")
    public ResponseEntity<Map<String, Object>> publishWithCredit(@PathVariable Long id,
                                                                 @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        Map<String, Object> response = creditService.publishGatherWithCredit(userId, id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/checkout")
    public ResponseEntity<Map<String, Object>> createCheckoutOrder(@PathVariable Long id,
                                                                     @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        Map<String, Object> order = paymentService.createOrder(userId, id);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{id}/verify-payment")
    public ResponseEntity<Map<String, Object>> verifyPayment(@PathVariable Long id,
                                                              @RequestBody Map<String, String> payload,
                                                              @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        String paymentId = payload.get("razorpayPaymentId");
        String orderId = payload.get("razorpayOrderId");
        String signature = payload.get("razorpaySignature");

        Map<String, Object> response = paymentService.verifyPayment(userId, id, paymentId, orderId, signature);
        return ResponseEntity.ok(response);
    }
}
