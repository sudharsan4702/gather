package com.catane.gather.repository;

import com.catane.gather.entity.InformationBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InformationBlockRepository extends JpaRepository<InformationBlock, Long> {
    List<InformationBlock> findByGatherIdOrderByOrderIndexAsc(Long gatherId);
    void deleteByGatherId(Long gatherId);
}
