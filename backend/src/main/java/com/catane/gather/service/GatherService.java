package com.catane.gather.service;

import com.catane.gather.dto.*;
import com.catane.gather.entity.*;
import com.catane.gather.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GatherService {

    private final GatherRepository gatherRepository;
    private final UserRepository userRepository;
    private final VenueRepository venueRepository;
    private final ScheduleItemRepository scheduleItemRepository;
    private final InformationBlockRepository informationBlockRepository;
    private final RSVPRepository rsvpRepository;
    private final AnnouncementRepository announcementRepository;
    private final MediaRepository mediaRepository;
    private final CreditTransactionRepository creditTransactionRepository;
    private final PaymentRepository paymentRepository;

    public GatherService(GatherRepository gatherRepository,
                         UserRepository userRepository,
                         VenueRepository venueRepository,
                         ScheduleItemRepository scheduleItemRepository,
                         InformationBlockRepository informationBlockRepository,
                         RSVPRepository rsvpRepository,
                         AnnouncementRepository announcementRepository,
                         MediaRepository mediaRepository,
                         CreditTransactionRepository creditTransactionRepository,
                         PaymentRepository paymentRepository) {
        this.gatherRepository = gatherRepository;
        this.userRepository = userRepository;
        this.venueRepository = venueRepository;
        this.scheduleItemRepository = scheduleItemRepository;
        this.informationBlockRepository = informationBlockRepository;
        this.rsvpRepository = rsvpRepository;
        this.announcementRepository = announcementRepository;
        this.mediaRepository = mediaRepository;
        this.creditTransactionRepository = creditTransactionRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public GatherResponse createGather(Long userId, CreateGatherRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Gather gather = new Gather();
        gather.setTitle(request.getTitle().trim());
        gather.setType(request.getType() != null ? request.getType() : "Other");
        gather.setDescription(request.getDescription());
        gather.setCoverImageUrl(request.getCoverImageUrl());
        gather.setEventDate(request.getEventDate());
        gather.setStartTime(request.getStartTime());
        gather.setEndTime(request.getEndTime());
        gather.setUser(user);
        gather.setSlug(generateUniqueSlug(request.getTitle()));

        Gather savedGather = gatherRepository.save(gather);

        // Atomically seed blueprint venue if provided
        if (request.getVenue() != null) {
            Venue venue = new Venue();
            venue.setGather(savedGather);
            venue.setVenueName(request.getVenue().getVenueName());
            venue.setAddress(request.getVenue().getAddress());
            venue.setMapUrl(request.getVenue().getMapUrl());
            venue.setDirections(request.getVenue().getDirections());
            venue.setParkingInfo(request.getVenue().getParkingInfo());
            venueRepository.save(venue);
        }

        // Atomically seed blueprint schedule items if provided
        if (request.getScheduleItems() != null && !request.getScheduleItems().isEmpty()) {
            int order = 0;
            for (ScheduleItemDto sDto : request.getScheduleItems()) {
                ScheduleItem item = new ScheduleItem();
                item.setGather(savedGather);
                item.setTitle(sDto.getTitle().trim());
                item.setEventDate(sDto.getEventDate() != null ? sDto.getEventDate() : savedGather.getEventDate());
                item.setStartTime(sDto.getStartTime());
                item.setEndTime(sDto.getEndTime());
                item.setDescription(sDto.getDescription());
                item.setLocation(sDto.getLocation());
                item.setDressCode(sDto.getDressCode());
                item.setOrderIndex(sDto.getOrderIndex() != null ? sDto.getOrderIndex() : order++);
                scheduleItemRepository.save(item);
            }
        }

        // Atomically seed blueprint information notes if provided
        if (request.getInformationBlocks() != null && !request.getInformationBlocks().isEmpty()) {
            int order = 0;
            for (InformationBlockDto bDto : request.getInformationBlocks()) {
                InformationBlock block = new InformationBlock();
                block.setGather(savedGather);
                block.setTitle(bDto.getTitle().trim());
                block.setContent(bDto.getContent().trim());
                block.setOrderIndex(bDto.getOrderIndex() != null ? bDto.getOrderIndex() : order++);
                informationBlockRepository.save(block);
            }
        }

        return mapToResponse(savedGather);
    }

    public List<GatherResponse> getUserGathers(Long userId) {
        return gatherRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public GatherResponse getGatherById(Long userId, Long gatherId) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));
        return mapToResponse(gather);
    }

    public String resolveEffectiveStatus(Gather gather) {
        String current = gather.getStatus() != null ? gather.getStatus().toUpperCase() : "DRAFT";
        if ("LIVE".equals(current) || "PUBLISHED".equals(current)) {
            // After 14 days grace period past the celebration date, automatically mark as COMPLETED keepsake
            if (gather.getEventDate() != null && LocalDate.now().isAfter(gather.getEventDate().plusDays(14))) {
                return "COMPLETED";
            }
        }
        return current;
    }

    private void assertGatherNotConcluded(Gather gather) {
        String effectiveStatus = resolveEffectiveStatus(gather);
        if ("COMPLETED".equalsIgnoreCase(effectiveStatus) || "ARCHIVED".equalsIgnoreCase(effectiveStatus)) {
            throw new IllegalStateException("This celebration has concluded and is preserved as a read-only memory keepsake. To host a new event, please duplicate this event or create a new one.");
        }
    }

    @Transactional
    public GatherResponse updateGatherDetails(Long userId, Long gatherId, CreateGatherRequest request) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        assertGatherNotConcluded(gather);

        // Anti-reuse check: For published events whose date has passed, block moving the date into the future to recycle an event slot
        String effectiveStatus = resolveEffectiveStatus(gather);
        if ("LIVE".equalsIgnoreCase(effectiveStatus) || "PUBLISHED".equalsIgnoreCase(effectiveStatus)) {
            if (gather.getEventDate() != null && LocalDate.now().isAfter(gather.getEventDate())) {
                if (request.getEventDate() != null && !request.getEventDate().equals(gather.getEventDate())) {
                    throw new IllegalArgumentException("The original celebration date has already passed. Concluded events cannot be rescheduled into future dates. Please duplicate this event to create a new celebration.");
                }
            }
        }

        gather.setTitle(request.getTitle().trim());
        if (request.getType() != null) gather.setType(request.getType());
        gather.setDescription(request.getDescription());
        if (request.getCoverImageUrl() != null) gather.setCoverImageUrl(request.getCoverImageUrl());
        gather.setEventDate(request.getEventDate());
        gather.setStartTime(request.getStartTime());
        gather.setEndTime(request.getEndTime());
        if (request.getPhotoAccessPolicy() != null) gather.setPhotoAccessPolicy(request.getPhotoAccessPolicy());
        if (request.getPhotoPasscode() != null) gather.setPhotoPasscode(request.getPhotoPasscode().trim());

        Gather updated = gatherRepository.save(gather);
        return mapToResponse(updated);
    }

    @Transactional
    public VenueDto updateVenue(Long userId, Long gatherId, VenueDto venueDto) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        assertGatherNotConcluded(gather);

        Venue venue = venueRepository.findByGatherId(gatherId).orElse(new Venue());
        venue.setGather(gather);
        venue.setVenueName(venueDto.getVenueName());
        venue.setAddress(venueDto.getAddress());
        venue.setMapUrl(venueDto.getMapUrl());
        venue.setDirections(venueDto.getDirections());
        venue.setParkingInfo(venueDto.getParkingInfo());

        Venue saved = venueRepository.save(venue);
        return mapVenueToDto(saved);
    }

    @Transactional
    public ScheduleItemDto addScheduleItem(Long userId, Long gatherId, ScheduleItemDto dto) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        assertGatherNotConcluded(gather);

        ScheduleItem item = new ScheduleItem();
        item.setGather(gather);
        item.setTitle(dto.getTitle().trim());
        item.setEventDate(dto.getEventDate());
        item.setStartTime(dto.getStartTime());
        item.setEndTime(dto.getEndTime());
        item.setDescription(dto.getDescription());
        item.setLocation(dto.getLocation());
        item.setDressCode(dto.getDressCode());
        item.setOrderIndex(dto.getOrderIndex() != null ? dto.getOrderIndex() : 0);

        ScheduleItem saved = scheduleItemRepository.save(item);
        return mapScheduleToDto(saved);
    }

    @Transactional
    public void deleteScheduleItem(Long userId, Long gatherId, Long itemId) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        assertGatherNotConcluded(gather);

        ScheduleItem item = scheduleItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule item not found"));

        if (!item.getGather().getId().equals(gather.getId())) {
            throw new IllegalArgumentException("Unauthorized deletion request");
        }

        scheduleItemRepository.delete(item);
    }

    @Transactional
    public ScheduleItemDto updateScheduleItem(Long userId, Long gatherId, Long itemId, ScheduleItemDto dto) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        assertGatherNotConcluded(gather);

        ScheduleItem item = scheduleItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule item not found"));

        if (!item.getGather().getId().equals(gather.getId())) {
            throw new IllegalArgumentException("Unauthorized update request");
        }

        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            item.setTitle(dto.getTitle().trim());
        }
        if (dto.getEventDate() != null) {
            item.setEventDate(dto.getEventDate());
        }
        if (dto.getStartTime() != null) {
            item.setStartTime(dto.getStartTime());
        }
        item.setEndTime(dto.getEndTime());
        item.setDescription(dto.getDescription());
        item.setLocation(dto.getLocation());
        item.setDressCode(dto.getDressCode());
        if (dto.getOrderIndex() != null) {
            item.setOrderIndex(dto.getOrderIndex());
        }

        ScheduleItem saved = scheduleItemRepository.save(item);
        return mapScheduleToDto(saved);
    }

    @Transactional
    public InformationBlockDto addInformationBlock(Long userId, Long gatherId, InformationBlockDto dto) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        assertGatherNotConcluded(gather);

        InformationBlock block = new InformationBlock();
        block.setGather(gather);
        block.setTitle(dto.getTitle().trim());
        block.setContent(dto.getContent().trim());
        block.setOrderIndex(dto.getOrderIndex() != null ? dto.getOrderIndex() : 0);

        InformationBlock saved = informationBlockRepository.save(block);
        return mapInfoBlockToDto(saved);
    }

    @Transactional
    public InformationBlockDto updateInformationBlock(Long userId, Long gatherId, Long blockId, InformationBlockDto dto) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        assertGatherNotConcluded(gather);

        InformationBlock block = informationBlockRepository.findById(blockId)
                .orElseThrow(() -> new IllegalArgumentException("Information block not found"));

        if (!block.getGather().getId().equals(gather.getId())) {
            throw new IllegalArgumentException("Unauthorized update request");
        }

        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            block.setTitle(dto.getTitle().trim());
        }
        if (dto.getContent() != null && !dto.getContent().isBlank()) {
            block.setContent(dto.getContent().trim());
        }
        if (dto.getOrderIndex() != null) {
            block.setOrderIndex(dto.getOrderIndex());
        }

        InformationBlock saved = informationBlockRepository.save(block);
        return mapInfoBlockToDto(saved);
    }

    @Transactional
    public void deleteInformationBlock(Long userId, Long gatherId, Long blockId) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        assertGatherNotConcluded(gather);

        InformationBlock block = informationBlockRepository.findById(blockId)
                .orElseThrow(() -> new IllegalArgumentException("Information block not found"));

        if (!block.getGather().getId().equals(gather.getId())) {
            throw new IllegalArgumentException("Unauthorized deletion request");
        }

        informationBlockRepository.delete(block);
    }

    @Transactional
    public GatherResponse updateTheme(Long userId, Long gatherId, String themeId, String accentColor, String fontFamily) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        assertGatherNotConcluded(gather);

        if (themeId != null) gather.setThemeId(themeId);
        if (accentColor != null) gather.setAccentColor(accentColor);
        if (fontFamily != null) gather.setFontFamily(fontFamily);

        Gather updated = gatherRepository.save(gather);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteGather(Long userId, Long gatherId) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        // Unlink financial and audit ledger records without deleting historical payment data
        creditTransactionRepository.unlinkGather(gatherId);
        paymentRepository.unlinkGather(gatherId);

        // Delete associated event artifacts
        venueRepository.deleteByGatherId(gatherId);
        scheduleItemRepository.deleteByGatherId(gatherId);
        informationBlockRepository.deleteByGatherId(gatherId);
        rsvpRepository.deleteByGatherId(gatherId);
        announcementRepository.deleteByGatherId(gatherId);
        mediaRepository.deleteByGatherId(gatherId);

        // Finally delete the gather entity
        gatherRepository.delete(gather);
    }

    @Transactional
    public GatherResponse concludeGather(Long userId, Long gatherId) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        String currentStatus = gather.getStatus() != null ? gather.getStatus().toUpperCase() : "DRAFT";
        if (!"LIVE".equals(currentStatus) && !"PUBLISHED".equals(currentStatus)) {
            throw new IllegalStateException("Only published celebrations can be concluded.");
        }

        gather.setStatus("COMPLETED");
        Gather saved = gatherRepository.save(gather);
        return mapToResponse(saved);
    }

    @Transactional
    public GatherResponse duplicateGather(Long userId, Long gatherId) {
        Gather source = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        User user = source.getUser();

        Gather copy = new Gather();
        String baseTitle = source.getTitle() != null ? source.getTitle().trim() : "Event";
        String copyTitle = baseTitle.toLowerCase().endsWith("(copy)") ? baseTitle : baseTitle + " (Copy)";
        copy.setTitle(copyTitle);
        copy.setType(source.getType() != null ? source.getType() : "Other");
        copy.setDescription(source.getDescription());
        copy.setCoverImageUrl(source.getCoverImageUrl());

        // Default eventDate: if source date is in the past or null, default to 1 week from today
        LocalDate nextDate = source.getEventDate();
        if (nextDate == null || nextDate.isBefore(LocalDate.now())) {
            nextDate = LocalDate.now().plusWeeks(1);
        }
        copy.setEventDate(nextDate);
        copy.setStartTime(source.getStartTime());
        copy.setEndTime(source.getEndTime());
        copy.setThemeId(source.getThemeId() != null ? source.getThemeId() : "ELEGANT");
        copy.setAccentColor(source.getAccentColor() != null ? source.getAccentColor() : "#6366f1");
        copy.setFontFamily(source.getFontFamily() != null ? source.getFontFamily() : "Inter");
        copy.setPhotoAccessPolicy(source.getPhotoAccessPolicy() != null ? source.getPhotoAccessPolicy() : "PUBLIC");
        copy.setPhotoPasscode(source.getPhotoPasscode());
        copy.setUser(user);
        copy.setStatus("DRAFT"); // Always fresh DRAFT requiring credit to publish
        copy.setSlug(generateUniqueSlug(copyTitle));

        Gather saved = gatherRepository.save(copy);

        // Clone Venue if present
        venueRepository.findByGatherId(source.getId()).ifPresent(srcVenue -> {
            Venue newVenue = new Venue();
            newVenue.setGather(saved);
            newVenue.setVenueName(srcVenue.getVenueName());
            newVenue.setAddress(srcVenue.getAddress());
            newVenue.setMapUrl(srcVenue.getMapUrl());
            newVenue.setDirections(srcVenue.getDirections());
            newVenue.setParkingInfo(srcVenue.getParkingInfo());
            venueRepository.save(newVenue);
        });

        // Clone Schedule Items if present
        List<ScheduleItem> items = scheduleItemRepository.findByGatherIdOrderByEventDateAscStartTimeAsc(source.getId());
        for (ScheduleItem it : items) {
            ScheduleItem newItem = new ScheduleItem();
            newItem.setGather(saved);
            newItem.setTitle(it.getTitle());
            newItem.setEventDate(saved.getEventDate());
            newItem.setStartTime(it.getStartTime());
            newItem.setEndTime(it.getEndTime());
            newItem.setDescription(it.getDescription());
            newItem.setLocation(it.getLocation());
            newItem.setDressCode(it.getDressCode());
            newItem.setOrderIndex(it.getOrderIndex());
            scheduleItemRepository.save(newItem);
        }

        // Clone Information Blocks if present
        List<InformationBlock> blocks = informationBlockRepository.findByGatherIdOrderByOrderIndexAsc(source.getId());
        for (InformationBlock b : blocks) {
            InformationBlock newBlock = new InformationBlock();
            newBlock.setGather(saved);
            newBlock.setTitle(b.getTitle());
            newBlock.setContent(b.getContent());
            newBlock.setOrderIndex(b.getOrderIndex());
            informationBlockRepository.save(newBlock);
        }

        return mapToResponse(saved);
    }

    @Transactional
    public GatherResponse getPublicGatherBySlug(String slug) {
        Gather gather = gatherRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found"));

        if ("DRAFT".equals(gather.getStatus())) {
            throw new IllegalArgumentException("This Gather is not publicly accessible");
        }

        gather.setPageViews(gather.getPageViews() + 1);
        gatherRepository.save(gather);

        GatherResponse response = mapToResponse(gather);
        response.setPhotoPasscode(null); // Never leak the actual passcode to public visitors
        return response;
    }

    private GatherResponse mapToResponse(Gather gather) {
        GatherResponse res = new GatherResponse();
        res.setId(gather.getId());
        res.setTitle(gather.getTitle());
        res.setType(gather.getType());
        res.setDescription(gather.getDescription());
        res.setCoverImageUrl(gather.getCoverImageUrl());
        res.setEventDate(gather.getEventDate());
        res.setStartTime(gather.getStartTime());
        res.setEndTime(gather.getEndTime());
        res.setSlug(gather.getSlug());

        String effectiveStatus = resolveEffectiveStatus(gather);
        if ("COMPLETED".equalsIgnoreCase(effectiveStatus) && !"COMPLETED".equalsIgnoreCase(gather.getStatus())) {
            gather.setStatus("COMPLETED");
            gatherRepository.save(gather);
        }
        res.setStatus(effectiveStatus);

        boolean isConcluded = "COMPLETED".equalsIgnoreCase(effectiveStatus)
                || (gather.getEventDate() != null && LocalDate.now().isAfter(gather.getEventDate()));
        res.setConcluded(isConcluded);

        res.setThemeId(gather.getThemeId());
        res.setAccentColor(gather.getAccentColor());
        res.setFontFamily(gather.getFontFamily());
        res.setPageViews(gather.getPageViews());
        res.setCreatedAt(gather.getCreatedAt());

        res.setPhotoAccessPolicy(gather.getPhotoAccessPolicy() != null ? gather.getPhotoAccessPolicy() : "PUBLIC");
        res.setPhotoPasscode(gather.getPhotoPasscode());
        res.setHasPhotoPasscode(gather.getPhotoPasscode() != null && !gather.getPhotoPasscode().trim().isEmpty());

        venueRepository.findByGatherId(gather.getId())
                .ifPresent(v -> res.setVenue(mapVenueToDto(v)));

        res.setSchedule(scheduleItemRepository.findByGatherIdOrderByEventDateAscStartTimeAsc(gather.getId())
                .stream().map(this::mapScheduleToDto).collect(Collectors.toList()));

        res.setInformationBlocks(informationBlockRepository.findByGatherIdOrderByOrderIndexAsc(gather.getId())
                .stream().map(this::mapInfoBlockToDto).collect(Collectors.toList()));

        res.setAnnouncements(announcementRepository.findByGatherIdOrderByPublishedAtDesc(gather.getId())
                .stream().map(this::mapAnnouncementToDto).collect(Collectors.toList()));

        return res;
    }

    private AnnouncementDto mapAnnouncementToDto(Announcement a) {
        AnnouncementDto dto = new AnnouncementDto();
        dto.setId(a.getId());
        dto.setTitle(a.getTitle());
        dto.setMessage(a.getMessage());
        dto.setPublishedAt(a.getPublishedAt());
        return dto;
    }

    private VenueDto mapVenueToDto(Venue v) {
        return new VenueDto(v.getId(), v.getVenueName(), v.getAddress(), v.getMapUrl(), v.getDirections(), v.getParkingInfo());
    }

    private ScheduleItemDto mapScheduleToDto(ScheduleItem item) {
        ScheduleItemDto dto = new ScheduleItemDto();
        dto.setId(item.getId());
        dto.setTitle(item.getTitle());
        dto.setEventDate(item.getEventDate());
        dto.setStartTime(item.getStartTime());
        dto.setEndTime(item.getEndTime());
        dto.setDescription(item.getDescription());
        dto.setLocation(item.getLocation());
        dto.setDressCode(item.getDressCode());
        dto.setOrderIndex(item.getOrderIndex());
        return dto;
    }

    private InformationBlockDto mapInfoBlockToDto(InformationBlock block) {
        InformationBlockDto dto = new InformationBlockDto();
        dto.setId(block.getId());
        dto.setTitle(block.getTitle());
        dto.setContent(block.getContent());
        dto.setOrderIndex(block.getOrderIndex());
        return dto;
    }

    private static final String NANO_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
    private static final int NANO_LENGTH = 6;
    private static final java.security.SecureRandom SECURE_RANDOM = new java.security.SecureRandom();

    private String generateUniqueSlug(String title) {
        String base = sanitizeTitle(title);
        String candidate;
        do {
            candidate = base + "-" + generateSecureToken();
        } while (gatherRepository.existsBySlug(candidate));
        return candidate;
    }

    private String generateSecureToken() {
        char[] token = new char[NANO_LENGTH];
        for (int i = 0; i < NANO_LENGTH; i++) {
            token[i] = NANO_ALPHABET.charAt(SECURE_RANDOM.nextInt(NANO_ALPHABET.length()));
        }
        return new String(token);
    }

    private String sanitizeTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            return "event";
        }
        String normalized = Normalizer.normalize(title.trim().toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "");
        // Collapse multiple hyphens and strip edges
        normalized = normalized.replaceAll("-+", "-").replaceAll("^-|-$", "");
        if (normalized.length() > 32) {
            normalized = normalized.substring(0, 32).replaceAll("-$", "");
        }
        return normalized.isEmpty() ? "event" : normalized;
    }
}
