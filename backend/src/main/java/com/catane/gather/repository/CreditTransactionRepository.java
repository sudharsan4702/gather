package com.catane.gather.repository;

import com.catane.gather.entity.CreditTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, Long> {

    @Query("SELECT ct FROM CreditTransaction ct WHERE ct.user.id = :userId ORDER BY ct.createdAt DESC")
    List<CreditTransaction> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE CreditTransaction ct SET ct.gather = null WHERE ct.gather.id = :gatherId")
    void unlinkGather(@Param("gatherId") Long gatherId);
}
