package com.catane.gather.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public class CreateGatherRequest {

    @NotBlank(message = "Event title is required")
    private String title;

    private String type = "Other";
    private String description;
    private String coverImageUrl;

    @NotNull(message = "Event date is required")
    private LocalDate eventDate;

    private LocalTime startTime;
    private LocalTime endTime;

    private String photoAccessPolicy = "PUBLIC"; // PUBLIC, RSVP_ONLY, PASSCODE
    private String photoPasscode;

    private VenueDto venue;
    private java.util.List<ScheduleItemDto> scheduleItems;
    private java.util.List<InformationBlockDto> informationBlocks;

    public CreateGatherRequest() {}

    public VenueDto getVenue() {
        return venue;
    }

    public void setVenue(VenueDto venue) {
        this.venue = venue;
    }

    public java.util.List<ScheduleItemDto> getScheduleItems() {
        return scheduleItems;
    }

    public void setScheduleItems(java.util.List<ScheduleItemDto> scheduleItems) {
        this.scheduleItems = scheduleItems;
    }

    public java.util.List<InformationBlockDto> getInformationBlocks() {
        return informationBlocks;
    }

    public void setInformationBlocks(java.util.List<InformationBlockDto> informationBlocks) {
        this.informationBlocks = informationBlocks;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getPhotoAccessPolicy() {
        return photoAccessPolicy;
    }

    public void setPhotoAccessPolicy(String photoAccessPolicy) {
        this.photoAccessPolicy = photoAccessPolicy;
    }

    public String getPhotoPasscode() {
        return photoPasscode;
    }

    public void setPhotoPasscode(String photoPasscode) {
        this.photoPasscode = photoPasscode;
    }
}
