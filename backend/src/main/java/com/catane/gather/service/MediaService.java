package com.catane.gather.service;

import com.catane.gather.dto.MediaDto;
import com.catane.gather.entity.Gather;
import com.catane.gather.entity.Media;
import com.catane.gather.repository.GatherRepository;
import com.catane.gather.repository.MediaRepository;
import com.catane.gather.repository.RSVPRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MediaService {

    private final MediaRepository mediaRepository;
    private final GatherRepository gatherRepository;
    private final RSVPRepository rsvpRepository;

    public MediaService(MediaRepository mediaRepository,
                        GatherRepository gatherRepository,
                        RSVPRepository rsvpRepository) {
        this.mediaRepository = mediaRepository;
        this.gatherRepository = gatherRepository;
        this.rsvpRepository = rsvpRepository;
    }

    public static final int MAX_PHOTOS_PER_GATHER = 20;

    @Transactional
    public MediaDto addMediaUrl(Long userId, Long gatherId, String fileUrl, String fileName) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        long currentCount = mediaRepository.countByGatherId(gatherId);
        if (currentCount >= MAX_PHOTOS_PER_GATHER) {
            throw new IllegalArgumentException("Maximum limit of " + MAX_PHOTOS_PER_GATHER + " photos reached for this event.");
        }

        Media media = new Media();
        media.setGather(gather);
        media.setFileUrl(fileUrl.trim());
        media.setFileName(fileName != null ? fileName.trim() : "Event Photo");
        media.setFileType("IMAGE");

        Media saved = mediaRepository.save(media);
        return mapToDto(saved);
    }

    public List<MediaDto> getGatherMedia(Long gatherId) {
        return mediaRepository.findByGatherIdOrderByOrderIndexAscUploadedAtDesc(gatherId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<MediaDto> getPublicGatherMedia(Long gatherId, String passcode, String guestName) {
        Gather gather = gatherRepository.findById(gatherId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found"));

        String policy = gather.getPhotoAccessPolicy() != null ? gather.getPhotoAccessPolicy() : "PUBLIC";

        if ("PASSCODE".equalsIgnoreCase(policy)) {
            String requiredCode = gather.getPhotoPasscode();
            boolean match = (requiredCode != null && !requiredCode.trim().isEmpty() &&
                    passcode != null && passcode.trim().equals(requiredCode.trim()));
            if (!match) {
                throw new SecurityException("PHOTO_LOCKED:PASSCODE_REQUIRED");
            }
        }

        return getGatherMedia(gatherId);
    }

    @Transactional
    public void deleteMedia(Long userId, Long gatherId, Long mediaId) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        Media media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new IllegalArgumentException("Media item not found"));

        if (!media.getGather().getId().equals(gather.getId())) {
            throw new IllegalArgumentException("Unauthorized deletion request");
        }

        mediaRepository.delete(media);
    }

    public MediaDto mapToDto(Media media) {
        MediaDto dto = new MediaDto();
        dto.setId(media.getId());
        dto.setFileUrl(media.getFileUrl());
        dto.setFileName(media.getFileName());
        dto.setFileType(media.getFileType());
        dto.setOrderIndex(media.getOrderIndex());
        dto.setUploadedAt(media.getUploadedAt());
        return dto;
    }
}
