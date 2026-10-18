package com.catane.gather.controller;

import com.catane.gather.dto.AnnouncementDto;
import com.catane.gather.repository.UserRepository;
import com.catane.gather.service.AnnouncementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final UserRepository userRepository;

    public AnnouncementController(AnnouncementService announcementService, UserRepository userRepository) {
        this.announcementService = announcementService;
        this.userRepository = userRepository;
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"))
                .getId();
    }

    @PostMapping("/api/organiser/gathers/{id}/announcements")
    public ResponseEntity<AnnouncementDto> createAnnouncement(@PathVariable Long id,
                                                               @Valid @RequestBody AnnouncementDto dto,
                                                               @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        AnnouncementDto response = announcementService.createAnnouncement(userId, id, dto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/public/gathers/{identifier}/announcements")
    public ResponseEntity<List<AnnouncementDto>> getPublicAnnouncements(@PathVariable String identifier) {
        List<AnnouncementDto> announcements = announcementService.getGatherAnnouncementsBySlugOrId(identifier);
        return ResponseEntity.ok(announcements);
    }

    @DeleteMapping("/api/organiser/gathers/{id}/announcements/{announcementId}")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable Long id,
                                                    @PathVariable Long announcementId,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        announcementService.deleteAnnouncement(userId, id, announcementId);
        return ResponseEntity.noContent().build();
    }
}
