package com.catane.gather.repository;

import com.catane.gather.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByGatherId(Long gatherId);
    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);
    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Payment p SET p.gather = null WHERE p.gather.id = :gatherId")
    void unlinkGather(@org.springframework.data.repository.query.Param("gatherId") Long gatherId);
}
