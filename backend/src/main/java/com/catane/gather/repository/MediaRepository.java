package com.catane.gather.repository;

import com.catane.gather.entity.Media;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaRepository extends JpaRepository<Media, Long> {
    List<Media> findByGatherIdOrderByOrderIndexAscUploadedAtDesc(Long gatherId);
    long countByGatherId(Long gatherId);
    void deleteByGatherId(Long gatherId);
}

