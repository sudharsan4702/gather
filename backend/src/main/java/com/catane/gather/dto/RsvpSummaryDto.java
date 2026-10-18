package com.catane.gather.dto;

import java.util.List;

public class RsvpSummaryDto {
    private long totalResponses;
    private long attendingCount;
    private long maybeCount;
    private long declinedCount;
    private long totalGuestsIndicated;
    private List<RsvpDto> responses;

    public RsvpSummaryDto() {}

    public RsvpSummaryDto(long totalResponses, long attendingCount, long maybeCount, long declinedCount, long totalGuestsIndicated, List<RsvpDto> responses) {
        this.totalResponses = totalResponses;
        this.attendingCount = attendingCount;
        this.maybeCount = maybeCount;
        this.declinedCount = declinedCount;
        this.totalGuestsIndicated = totalGuestsIndicated;
        this.responses = responses;
    }

    public long getTotalResponses() {
        return totalResponses;
    }

    public void setTotalResponses(long totalResponses) {
        this.totalResponses = totalResponses;
    }

    public long getAttendingCount() {
        return attendingCount;
    }

    public void setAttendingCount(long attendingCount) {
        this.attendingCount = attendingCount;
    }

    public long getMaybeCount() {
        return maybeCount;
    }

    public void setMaybeCount(long maybeCount) {
        this.maybeCount = maybeCount;
    }

    public long getDeclinedCount() {
        return declinedCount;
    }

    public void setDeclinedCount(long declinedCount) {
        this.declinedCount = declinedCount;
    }

    public long getTotalGuestsIndicated() {
        return totalGuestsIndicated;
    }

    public void setTotalGuestsIndicated(long totalGuestsIndicated) {
        this.totalGuestsIndicated = totalGuestsIndicated;
    }

    public List<RsvpDto> getResponses() {
        return responses;
    }

    public void setResponses(List<RsvpDto> responses) {
        this.responses = responses;
    }
}
