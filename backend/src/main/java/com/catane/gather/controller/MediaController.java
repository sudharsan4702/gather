package com.catane.gather.controller;

import com.catane.gather.dto.MediaDto;
import com.catane.gather.repository.UserRepository;
import com.catane.gather.service.MediaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;

@RestController
public class MediaController {

    private final MediaService mediaService;
    private final UserRepository userRepository;

    public MediaController(MediaService mediaService, UserRepository userRepository) {
        this.mediaService = mediaService;
        this.userRepository = userRepository;
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"))
                .getId();
    }

    @PostMapping("/api/organiser/gathers/{id}/media")
    public ResponseEntity<MediaDto> addMedia(@PathVariable Long id,
                                              @RequestBody Map<String, String> payload,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        String fileUrl = payload.get("fileUrl");
        String fileName = payload.get("fileName");

        MediaDto response = mediaService.addMediaUrl(userId, id, fileUrl, fileName);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/public/gathers/{id}/media")
    public ResponseEntity<?> getPublicMedia(@PathVariable Long id,
                                            @RequestParam(required = false) String passcode,
                                            @RequestParam(required = false) String guestName) {
        try {
            List<MediaDto> mediaList = mediaService.getPublicGatherMedia(id, passcode, guestName);
            return ResponseEntity.ok(mediaList);
        } catch (SecurityException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("locked", true);
            err.put("policy", "PASSCODE");
            err.put("message", "This photo album is protected with a passcode.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(err);
        }
    }

    @GetMapping("/api/organiser/gathers/{id}/media")
    public ResponseEntity<List<MediaDto>> getOrganiserMedia(@PathVariable Long id,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(mediaService.getGatherMedia(id));
    }

    @DeleteMapping("/api/organiser/gathers/{id}/media/{mediaId}")
    public ResponseEntity<Void> deleteMedia(@PathVariable Long id,
                                             @PathVariable Long mediaId,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        mediaService.deleteMedia(userId, id, mediaId);
        return ResponseEntity.noContent().build();
    }
}
