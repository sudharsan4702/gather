package com.catane.gather.repository;

import com.catane.gather.entity.OtpPurpose;
import com.catane.gather.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findTopByEmailAndPurposeOrderByIdDesc(String email, OtpPurpose purpose);

    @Modifying
    @Query("DELETE FROM OtpVerification o WHERE o.email = :email AND o.purpose = :purpose")
    void deleteByEmailAndPurpose(String email, OtpPurpose purpose);

    @Modifying
    @Query("DELETE FROM OtpVerification o WHERE o.expiresAt < :now")
    void deleteByExpiresAtBefore(LocalDateTime now);
}
