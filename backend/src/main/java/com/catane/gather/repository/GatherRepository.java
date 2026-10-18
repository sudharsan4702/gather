package com.catane.gather.repository;

import com.catane.gather.entity.Gather;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GatherRepository extends JpaRepository<Gather, Long> {
    List<Gather> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Gather> findBySlug(String slug);
    boolean existsBySlug(String slug);
    Optional<Gather> findByIdAndUserId(Long id, Long userId);
}
