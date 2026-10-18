package com.catane.gather.repository;

import com.catane.gather.entity.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VenueRepository extends JpaRepository<Venue, Long> {
    Optional<Venue> findByGatherId(Long gatherId);
    void deleteByGatherId(Long gatherId);
}
