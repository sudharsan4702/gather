package com.catane.gather.repository;

import com.catane.gather.entity.RSVP;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RSVPRepository extends JpaRepository<RSVP, Long> {
    List<RSVP> findByGatherIdOrderBySubmittedAtDesc(Long gatherId);
    long countByGatherId(Long gatherId);
    long countByGatherIdAndAttendance(Long gatherId, String attendance);
    boolean existsByGatherIdAndGuestNameIgnoreCase(Long gatherId, String guestName);
    void deleteByGatherId(Long gatherId);
}
