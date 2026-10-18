package com.catane.gather.repository;

import com.catane.gather.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Modifying
    @Query("UPDATE User u SET u.creditsBalance = u.creditsBalance - :amount WHERE u.id = :userId AND u.creditsBalance >= :amount")
    int deductCreditsAtomically(@Param("userId") Long userId, @Param("amount") int amount);

    @Modifying
    @Query("UPDATE User u SET u.creditsBalance = u.creditsBalance + :amount WHERE u.id = :userId")
    int addCreditsAtomically(@Param("userId") Long userId, @Param("amount") int amount);
}
