package com.catane.gather.controller;

import com.catane.gather.dto.RsvpDto;
import com.catane.gather.dto.RsvpSummaryDto;
import com.catane.gather.repository.UserRepository;
import com.catane.gather.service.RsvpService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
public class RsvpController {

    private final RsvpService rsvpService;
    private final UserRepository userRepository;

    public RsvpController(RsvpService rsvpService, UserRepository userRepository) {
        this.rsvpService = rsvpService;
        this.userRepository = userRepository;
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"))
                .getId();
    }

    @PostMapping("/api/public/gathers/{slug}/rsvp")
    public ResponseEntity<RsvpDto> submitPublicRsvp(@PathVariable String slug,
                                                      @Valid @RequestBody RsvpDto dto) {
        RsvpDto response = rsvpService.submitRsvp(slug, dto);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/organiser/gathers/{id}/rsvps")
    public ResponseEntity<RsvpSummaryDto> getGatherRsvps(@PathVariable Long id,
                                                          @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        RsvpSummaryDto summary = rsvpService.getGatherRsvps(userId, id);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/api/organiser/gathers/{id}/rsvps/export")
    public ResponseEntity<String> exportRsvpsCsv(@PathVariable Long id,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        String csvData = rsvpService.exportRsvpsCsv(userId, id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"rsvps_gather_" + id + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }
}
