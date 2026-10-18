package com.catane.gather.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;

public class GatherResponse {
    private Long id;
    private String title;
    private String type;
    private String description;
    private String coverImageUrl;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String slug;
    private String status;
    private String themeId;
    private String accentColor;
    private String fontFamily;
    private long pageViews;
    private LocalDateTime createdAt;

    private String photoAccessPolicy = "PUBLIC";
    private String photoPasscode;
    private boolean hasPhotoPasscode = false;

    private VenueDto venue;
    private List<ScheduleItemDto> schedule;
    private List<InformationBlockDto> informationBlocks;
    private List<AnnouncementDto> announcements;
    private List<MediaDto> gallery;
    private boolean concluded;

    public GatherResponse() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getThemeId() {
        return themeId;
    }

    public void setThemeId(String themeId) {
        this.themeId = themeId;
    }

    public String getAccentColor() {
        return accentColor;
    }

    public void setAccentColor(String accentColor) {
        this.accentColor = accentColor;
    }

    public String getFontFamily() {
        return fontFamily;
    }

    public void setFontFamily(String fontFamily) {
        this.fontFamily = fontFamily;
    }

    public long getPageViews() {
        return pageViews;
    }

    public void setPageViews(long pageViews) {
        this.pageViews = pageViews;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public VenueDto getVenue() {
        return venue;
    }

    public void setVenue(VenueDto venue) {
        this.venue = venue;
    }

    public List<ScheduleItemDto> getSchedule() {
        return schedule;
    }

    public void setSchedule(List<ScheduleItemDto> schedule) {
        this.schedule = schedule;
    }

    public List<InformationBlockDto> getInformationBlocks() {
        return informationBlocks;
    }

    public void setInformationBlocks(List<InformationBlockDto> informationBlocks) {
        this.informationBlocks = informationBlocks;
    }

    public List<AnnouncementDto> getAnnouncements() {
        return announcements;
    }

    public void setAnnouncements(List<AnnouncementDto> announcements) {
        this.announcements = announcements;
    }

    public List<MediaDto> getGallery() {
        return gallery;
    }

    public void setGallery(List<MediaDto> gallery) {
        this.gallery = gallery;
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

    public boolean isHasPhotoPasscode() {
        return hasPhotoPasscode;
    }

    public void setHasPhotoPasscode(boolean hasPhotoPasscode) {
        this.hasPhotoPasscode = hasPhotoPasscode;
    }

    public boolean isConcluded() {
        return concluded;
    }

    public void setConcluded(boolean concluded) {
        this.concluded = concluded;
    }
}
