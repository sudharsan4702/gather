package com.catane.gather.controller;

import com.catane.gather.repository.UserRepository;
import com.catane.gather.service.CreditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/organiser/credits")
public class CreditController {

    private final CreditService creditService;
    private final UserRepository userRepository;

    public CreditController(CreditService creditService, UserRepository userRepository) {
        this.creditService = creditService;
        this.userRepository = userRepository;
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"))
                .getId();
    }

    @GetMapping("/balance")
    public ResponseEntity<Map<String, Object>> getBalance(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        Map<String, Object> data = creditService.getCreditBalanceAndHistory(userId);
        return ResponseEntity.ok(data);
    }

    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createCreditOrder(@RequestBody Map<String, Object> payload,
                                                                 @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        int quantity = 1;
        if (payload.containsKey("quantity")) {
            quantity = Integer.parseInt(payload.get("quantity").toString());
        }
        Map<String, Object> order = creditService.createCreditOrder(userId, quantity);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<Map<String, Object>> verifyCreditPayment(@RequestBody Map<String, String> payload,
                                                                   @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        String paymentId = payload.get("razorpayPaymentId");
        String orderId = payload.get("razorpayOrderId");
        String signature = payload.get("razorpaySignature");

        Map<String, Object> response = creditService.verifyCreditPayment(userId, paymentId, orderId, signature);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/publish-gather/{gatherId}")
    public ResponseEntity<Map<String, Object>> publishWithCredit(@PathVariable Long gatherId,
                                                                 @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        Map<String, Object> response = creditService.publishGatherWithCredit(userId, gatherId);
        return ResponseEntity.ok(response);
    }
}
