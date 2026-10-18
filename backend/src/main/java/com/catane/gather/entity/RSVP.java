package com.catane.gather.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "rsvps")
public class RSVP {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gather_id", nullable = false)
    private Gather gather;

    @NotBlank(message = "Guest name is required")
    @Column(name = "guest_name", nullable = false)
    private String guestName;

    @Column(nullable = false)
    private String attendance = "ATTENDING"; // ATTENDING, MAYBE, DECLINED

    @Min(value = 1, message = "Guest count must be at least 1")
    @Column(name = "guest_count", nullable = false)
    private Integer guestCount = 1;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    public RSVP() {}

    public RSVP(Gather gather, String guestName, String attendance, Integer guestCount, String message) {
        this.gather = gather;
        this.guestName = guestName;
        this.attendance = attendance;
        this.guestCount = guestCount;
        this.message = message;
        this.submittedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.submittedAt == null) {
            this.submittedAt = LocalDateTime.now();
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

    public String getGuestName() {
        return guestName;
    }

    public void setGuestName(String guestName) {
        this.guestName = guestName;
    }

    public String getAttendance() {
        return attendance;
    }

    public void setAttendance(String attendance) {
        this.attendance = attendance;
    }

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
}
