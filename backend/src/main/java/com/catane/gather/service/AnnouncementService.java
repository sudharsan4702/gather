package com.catane.gather.service;

import com.catane.gather.dto.AnnouncementDto;
import com.catane.gather.entity.Announcement;
import com.catane.gather.entity.Gather;
import com.catane.gather.repository.AnnouncementRepository;
import com.catane.gather.repository.GatherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final GatherRepository gatherRepository;

    public AnnouncementService(AnnouncementRepository announcementRepository, GatherRepository gatherRepository) {
        this.announcementRepository = announcementRepository;
        this.gatherRepository = gatherRepository;
    }

    @Transactional
    public AnnouncementDto createAnnouncement(Long userId, Long gatherId, AnnouncementDto dto) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        Announcement announcement = new Announcement();
        announcement.setGather(gather);
        announcement.setTitle(dto.getTitle().trim());
        String msg = dto.getMessage() != null && !dto.getMessage().trim().isEmpty() 
                ? dto.getMessage() 
                : dto.getContent();
        if (msg == null || msg.trim().isEmpty()) {
            throw new IllegalArgumentException("Announcement message cannot be empty");
        }
        announcement.setMessage(msg.trim());

        Announcement saved = announcementRepository.save(announcement);
        return mapToDto(saved);
    }

    public List<AnnouncementDto> getGatherAnnouncements(Long gatherId) {
        return announcementRepository.findByGatherIdOrderByPublishedAtDesc(gatherId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<AnnouncementDto> getGatherAnnouncementsBySlugOrId(String identifier) {
        try {
            Long id = Long.parseLong(identifier);
            return getGatherAnnouncements(id);
        } catch (NumberFormatException e) {
            Gather gather = gatherRepository.findBySlug(identifier)
                    .orElseThrow(() -> new IllegalArgumentException("Gather not found"));
            return getGatherAnnouncements(gather.getId());
        }
    }

    @Transactional
    public void deleteAnnouncement(Long userId, Long gatherId, Long announcementId) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new IllegalArgumentException("Announcement not found"));

        if (!announcement.getGather().getId().equals(gather.getId())) {
            throw new IllegalArgumentException("Unauthorized deletion request");
        }

        announcementRepository.delete(announcement);
    }

    public AnnouncementDto mapToDto(Announcement announcement) {
        AnnouncementDto dto = new AnnouncementDto();
        dto.setId(announcement.getId());
        dto.setTitle(announcement.getTitle());
        dto.setMessage(announcement.getMessage());
        dto.setPublishedAt(announcement.getPublishedAt());
        return dto;
    }
}
