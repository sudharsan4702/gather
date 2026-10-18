package com.catane.gather.controller;

import com.catane.gather.dto.GatherResponse;
import com.catane.gather.service.GatherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/gathers")
public class PublicGatherController {

    private final GatherService gatherService;

    public PublicGatherController(GatherService gatherService) {
        this.gatherService = gatherService;
    }

    @GetMapping("/{slug}")
    public ResponseEntity<GatherResponse> getPublicGather(@PathVariable String slug) {
        GatherResponse gather = gatherService.getPublicGatherBySlug(slug);
        return ResponseEntity.ok(gather);
    }
}
