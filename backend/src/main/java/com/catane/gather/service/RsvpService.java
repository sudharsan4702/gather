package com.catane.gather.service;

import com.catane.gather.dto.RsvpDto;
import com.catane.gather.dto.RsvpSummaryDto;
import com.catane.gather.entity.Gather;
import com.catane.gather.entity.RSVP;
import com.catane.gather.repository.GatherRepository;
import com.catane.gather.repository.RSVPRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RsvpService {

    private final RSVPRepository rsvpRepository;
    private final GatherRepository gatherRepository;

    public RsvpService(RSVPRepository rsvpRepository, GatherRepository gatherRepository) {
        this.rsvpRepository = rsvpRepository;
        this.gatherRepository = gatherRepository;
    }

    @Transactional
    public RsvpDto submitRsvp(String slug, RsvpDto dto) {
        Gather gather = gatherRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found"));

        String status = gather.getStatus() != null ? gather.getStatus().toUpperCase() : "DRAFT";
        if ("DRAFT".equals(status)) {
            throw new IllegalArgumentException("RSVP is not available for unpublished Gathers");
        }
        if ("CANCELLED".equals(status) || "COMPLETED".equals(status) || "ARCHIVED".equals(status)) {
            throw new IllegalArgumentException("RSVP is closed for this gathering (" + status.toLowerCase() + ")");
        }
        if (gather.getEventDate() != null && LocalDate.now().isAfter(gather.getEventDate().plusDays(1))) {
            throw new IllegalArgumentException("RSVP is closed because this celebration has concluded.");
        }

        RSVP rsvp = new RSVP();
        rsvp.setGather(gather);
        rsvp.setGuestName(dto.getGuestName().trim());
        String attendance = dto.getAttendance() != null ? dto.getAttendance().toUpperCase() : "ATTENDING";
        rsvp.setAttendance(attendance);
        int guestCount = (dto.getGuestCount() != null && dto.getGuestCount() > 0) ? dto.getGuestCount() : 1;
        // If declined, effective headcount is 0
        rsvp.setGuestCount("DECLINED".equalsIgnoreCase(attendance) ? 0 : guestCount);
        rsvp.setMessage(dto.getMessage());

        RSVP saved = rsvpRepository.save(rsvp);
        return mapToDto(saved);
    }

    public RsvpSummaryDto getGatherRsvps(Long userId, Long gatherId) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        List<RSVP> rsvps = rsvpRepository.findByGatherIdOrderBySubmittedAtDesc(gather.getId());
        List<RsvpDto> dtoList = rsvps.stream().map(this::mapToDto).collect(Collectors.toList());

        long attending = rsvpRepository.countByGatherIdAndAttendance(gatherId, "ATTENDING");
        long maybe = rsvpRepository.countByGatherIdAndAttendance(gatherId, "MAYBE");
        long declined = rsvpRepository.countByGatherIdAndAttendance(gatherId, "DECLINED");
        // Count total guests strictly for confirmed attending RSVPs
        long totalGuests = rsvps.stream()
                .filter(r -> "ATTENDING".equalsIgnoreCase(r.getAttendance()))
                .mapToLong(RSVP::getGuestCount)
                .sum();

        return new RsvpSummaryDto(rsvps.size(), attending, maybe, declined, totalGuests, dtoList);
    }

    public String exportRsvpsCsv(Long userId, Long gatherId) {
        Gather gather = gatherRepository.findByIdAndUserId(gatherId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Gather not found or access denied"));

        List<RSVP> rsvps = rsvpRepository.findByGatherIdOrderBySubmittedAtDesc(gather.getId());

        StringBuilder csv = new StringBuilder();
        csv.append("ID,Guest Name,Attendance,Guest Count,Message,Submitted At\n");

        for (RSVP r : rsvps) {
            csv.append(r.getId()).append(",")
               .append("\"").append(r.getGuestName().replace("\"", "\"\"")).append("\",")
               .append(r.getAttendance()).append(",")
               .append(r.getGuestCount()).append(",")
               .append("\"").append(r.getMessage() != null ? r.getMessage().replace("\"", "\"\"") : "").append("\",")
               .append(r.getSubmittedAt()).append("\n");
        }

        return csv.toString();
    }

    private RsvpDto mapToDto(RSVP rsvp) {
        RsvpDto dto = new RsvpDto();
        dto.setId(rsvp.getId());
        dto.setGuestName(rsvp.getGuestName());
        dto.setAttendance(rsvp.getAttendance());
        dto.setGuestCount(rsvp.getGuestCount());
        dto.setMessage(rsvp.getMessage());
        dto.setSubmittedAt(rsvp.getSubmittedAt());
        return dto;
    }
}
