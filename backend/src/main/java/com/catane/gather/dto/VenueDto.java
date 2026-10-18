package com.catane.gather.dto;

public class VenueDto {
    private Long id;
    private String venueName;
    private String address;
    private String mapUrl;
    private String directions;
    private String parkingInfo;

    public VenueDto() {}

    public VenueDto(Long id, String venueName, String address, String mapUrl, String directions, String parkingInfo) {
        this.id = id;
        this.venueName = venueName;
        this.address = address;
        this.mapUrl = mapUrl;
        this.directions = directions;
        this.parkingInfo = parkingInfo;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getVenueName() {
        return venueName;
    }

    public void setVenueName(String venueName) {
        this.venueName = venueName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getMapUrl() {
        return mapUrl;
    }

    public void setMapUrl(String mapUrl) {
        this.mapUrl = mapUrl;
    }

    public String getDirections() {
        return directions;
    }

    public void setDirections(String directions) {
        this.directions = directions;
    }

    public String getParkingInfo() {
        return parkingInfo;
    }

    public void setParkingInfo(String parkingInfo) {
        this.parkingInfo = parkingInfo;
    }
}
