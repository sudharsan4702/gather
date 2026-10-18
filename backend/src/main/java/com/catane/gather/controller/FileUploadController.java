package com.catane.gather.controller;

import com.catane.gather.dto.MediaDto;
import com.catane.gather.entity.Gather;
import com.catane.gather.repository.GatherRepository;
import com.catane.gather.repository.UserRepository;
import com.catane.gather.service.MediaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
public class FileUploadController {

    public static final int MAX_PHOTOS_PER_GATHER = 20;
    private static final long MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB safety ceiling
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".webp", ".gif"
    );

    @org.springframework.beans.factory.annotation.Value("${gather.upload.base-url:}")
    private String uploadBaseUrl;

    private final Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
    private final UserRepository userRepository;
    private final GatherRepository gatherRepository;
    private final MediaService mediaService;
    private final com.catane.gather.repository.MediaRepository mediaRepository;

    public FileUploadController(UserRepository userRepository,
                                GatherRepository gatherRepository,
                                MediaService mediaService,
                                com.catane.gather.repository.MediaRepository mediaRepository) {
        this.userRepository = userRepository;
        this.gatherRepository = gatherRepository;
        this.mediaService = mediaService;
        this.mediaRepository = mediaRepository;
        try {
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload folder", e);
        }
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"))
                .getId();
    }

    private String validateAndStoreFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds 10MB limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file type. Only JPEG, PNG, WEBP, and GIF are supported.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Invalid file extension. Only .jpg, .jpeg, .png, .webp, and .gif are allowed.");
        }

        // Generate cryptographic random UUID filename to completely prevent directory traversal and collision
        String safeFileName = UUID.randomUUID() + extension;
        Path destination = uploadDir.resolve(safeFileName).normalize();

        // Enforce strict sandbox boundary check
        if (!destination.startsWith(uploadDir)) {
            throw new SecurityException("Illegal file destination outside uploads sandbox");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
        }

        // Return path: use uploadBaseUrl if specified, otherwise return /uploads/filename
        if (uploadBaseUrl != null && !uploadBaseUrl.isBlank()) {
            return uploadBaseUrl.replaceAll("/$", "") + "/uploads/" + safeFileName;
        }
        return "/uploads/" + safeFileName;
    }

    /**
     * General image upload (for cover photos, event essentials, etc.)
     */
    @PostMapping("/api/organiser/upload")
    public ResponseEntity<?> uploadSingleImage(@RequestParam("file") MultipartFile file,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        try {
            String fileUrl = validateAndStoreFile(file);
            Map<String, String> result = new HashMap<>();
            result.put("url", fileUrl);
            result.put("fileName", file.getOriginalFilename() != null ? file.getOriginalFilename() : "Uploaded Image");
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Upload failed: " + e.getMessage()));
        }
    }

    /**
     * Batch or single image upload for Gather Media Scrapbook
     */
    @PostMapping("/api/organiser/gathers/{id}/media/upload")
    public ResponseEntity<?> uploadGatherMedia(@PathVariable Long id,
                                               @RequestParam("files") List<MultipartFile> files,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        Gather gather = gatherRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        long existingCount = mediaRepository.countByGatherId(gather.getId());
        if (existingCount >= MAX_PHOTOS_PER_GATHER) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "This event has reached the maximum limit of " + MAX_PHOTOS_PER_GATHER + " photos. Please remove existing photos to upload new ones."
            ));
        }

        if (existingCount + files.size() > MAX_PHOTOS_PER_GATHER) {
            long remaining = MAX_PHOTOS_PER_GATHER - existingCount;
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "You can only upload " + remaining + " more photo" + (remaining == 1 ? "" : "s") + " (maximum " + MAX_PHOTOS_PER_GATHER + " photos per event)."
            ));
        }

        List<MediaDto> savedMediaList = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (MultipartFile file : files) {
            try {
                String fileUrl = validateAndStoreFile(file);
                String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "Event Photo";
                MediaDto mediaDto = mediaService.addMediaUrl(userId, gather.getId(), fileUrl, fileName);
                savedMediaList.add(mediaDto);
            } catch (Exception e) {
                errors.add("Failed to upload " + file.getOriginalFilename() + ": " + e.getMessage());
            }
        }

        if (savedMediaList.isEmpty() && !errors.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("errors", errors));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("media", savedMediaList);
        if (!errors.isEmpty()) {
            response.put("warnings", errors);
        }
        return ResponseEntity.ok(response);
    }
}
