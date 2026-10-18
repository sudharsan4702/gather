package com.catane.gather.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public class AnnouncementDto {
    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    private LocalDateTime publishedAt;

    public AnnouncementDto() {}

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

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public String getContent() {
        return message;
    }

    public void setContent(String content) {
        if (this.message == null || this.message.trim().isEmpty()) {
            this.message = content;
        }
    }
}
