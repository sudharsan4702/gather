package com.catane.gather.controller;

import com.catane.gather.dto.*;
import com.catane.gather.entity.User;
import com.catane.gather.repository.UserRepository;
import com.catane.gather.service.GatherService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/organiser/gathers")
public class OrganiserGatherController {

    private final GatherService gatherService;
    private final UserRepository userRepository;

    public OrganiserGatherController(GatherService gatherService, UserRepository userRepository) {
        this.gatherService = gatherService;
        this.userRepository = userRepository;
    }

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"))
                .getId();
    }

    @PostMapping
    public ResponseEntity<GatherResponse> createGather(@Valid @RequestBody CreateGatherRequest request,
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        GatherResponse response = gatherService.createGather(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<GatherResponse>> getUserGathers(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        List<GatherResponse> gathers = gatherService.getUserGathers(userId);
        return ResponseEntity.ok(gathers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GatherResponse> getGatherById(@PathVariable Long id,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        GatherResponse gather = gatherService.getGatherById(userId, id);
        return ResponseEntity.ok(gather);
    }

    @PutMapping("/{id}")
    public ResponseEntity<GatherResponse> updateGatherDetails(@PathVariable Long id,
                                                               @Valid @RequestBody CreateGatherRequest request,
                                                               @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        GatherResponse response = gatherService.updateGatherDetails(userId, id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/venue")
    public ResponseEntity<VenueDto> updateVenue(@PathVariable Long id,
                                                 @RequestBody VenueDto venueDto,
                                                 @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        VenueDto response = gatherService.updateVenue(userId, id, venueDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/schedule")
    public ResponseEntity<ScheduleItemDto> addScheduleItem(@PathVariable Long id,
                                                            @Valid @RequestBody ScheduleItemDto dto,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        ScheduleItemDto response = gatherService.addScheduleItem(userId, id, dto);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/schedule/{itemId}")
    public ResponseEntity<Void> deleteScheduleItem(@PathVariable Long id,
                                                    @PathVariable Long itemId,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        gatherService.deleteScheduleItem(userId, id, itemId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/schedule/{itemId}")
    public ResponseEntity<ScheduleItemDto> updateScheduleItem(@PathVariable Long id,
                                                               @PathVariable Long itemId,
                                                               @Valid @RequestBody ScheduleItemDto dto,
                                                               @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        ScheduleItemDto response = gatherService.updateScheduleItem(userId, id, itemId, dto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/info-blocks")
    public ResponseEntity<InformationBlockDto> addInformationBlock(@PathVariable Long id,
                                                                     @Valid @RequestBody InformationBlockDto dto,
                                                                     @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        InformationBlockDto response = gatherService.addInformationBlock(userId, id, dto);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/info-blocks/{blockId}")
    public ResponseEntity<InformationBlockDto> updateInformationBlock(@PathVariable Long id,
                                                                      @PathVariable Long blockId,
                                                                      @Valid @RequestBody InformationBlockDto dto,
                                                                      @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        InformationBlockDto response = gatherService.updateInformationBlock(userId, id, blockId, dto);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/info-blocks/{blockId}")
    public ResponseEntity<Void> deleteInformationBlock(@PathVariable Long id,
                                                         @PathVariable Long blockId,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        gatherService.deleteInformationBlock(userId, id, blockId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/theme")
    public ResponseEntity<GatherResponse> updateTheme(@PathVariable Long id,
                                                       @RequestBody Map<String, String> themeReq,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        GatherResponse response = gatherService.updateTheme(
                userId, id,
                themeReq.get("themeId"),
                themeReq.get("accentColor"),
                themeReq.get("fontFamily")
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<GatherResponse> duplicateGather(@PathVariable Long id,
                                                          @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        GatherResponse response = gatherService.duplicateGather(userId, id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/conclude")
    public ResponseEntity<GatherResponse> concludeGather(@PathVariable Long id,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        GatherResponse response = gatherService.concludeGather(userId, id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGather(@PathVariable Long id,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        gatherService.deleteGather(userId, id);
        return ResponseEntity.noContent().build();
    }
}
