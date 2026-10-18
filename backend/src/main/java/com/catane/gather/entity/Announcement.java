package com.catane.gather.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gather_id", nullable = false)
    private Gather gather;

    @NotBlank(message = "Title is required")
    @Column(nullable = false)
    private String title;

    @NotBlank(message = "Message is required")
    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "published_at", nullable = false, updatable = false)
    private LocalDateTime publishedAt;

    public Announcement() {}

    public Announcement(Gather gather, String title, String message) {
        this.gather = gather;
        this.title = title;
        this.message = message;
        this.publishedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.publishedAt == null) {
            this.publishedAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Gather getGather() {
        return gather;
    }

    public void setGather(Gather gather) {
        this.gather = gather;
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
}
