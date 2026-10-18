package com.catane.gather.repository;

import com.catane.gather.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByGatherIdOrderByPublishedAtDesc(Long gatherId);
    void deleteByGatherId(Long gatherId);
}
