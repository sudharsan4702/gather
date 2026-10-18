package com.catane.gather.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "venues")
public class Venue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gather_id", nullable = false, unique = true)
    private Gather gather;

    @Column(name = "venue_name")
    private String venueName;

    private String address;

    @Column(name = "map_url")
    private String mapUrl;

    @Column(columnDefinition = "TEXT")
    private String directions;

    @Column(name = "parking_info")
    private String parkingInfo;

    public Venue() {}

    public Venue(Gather gather, String venueName, String address, String mapUrl) {
        this.gather = gather;
        this.venueName = venueName;
        this.address = address;
        this.mapUrl = mapUrl;
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
