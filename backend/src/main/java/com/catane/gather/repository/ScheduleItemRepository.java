package com.catane.gather.repository;

import com.catane.gather.entity.ScheduleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleItemRepository extends JpaRepository<ScheduleItem, Long> {
    List<ScheduleItem> findByGatherIdOrderByEventDateAscStartTimeAsc(Long gatherId);
    void deleteByGatherId(Long gatherId);
}
