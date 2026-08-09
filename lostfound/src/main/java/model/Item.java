package com.campus.lostfound.model;

import jakarta.persistence.*;

@Entity
@Table(name = "items")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String category;
    private String location;
    private String type; // LOST or FOUND
    private String status = "ACTIVE"; // ACTIVE or RESOLVED

    @Column(length = 2000)
    private String description;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;

    private String posterName;
    private String posterStudentId;
    private String posterPhone;

    public Item() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getPosterName() { return posterName; }
    public void setPosterName(String posterName) { this.posterName = posterName; }

    public String getPosterStudentId() { return posterStudentId; }
    public void setPosterStudentId(String posterStudentId) { this.posterStudentId = posterStudentId; }

    public String getPosterPhone() { return posterPhone; }
    public void setPosterPhone(String posterPhone) { this.posterPhone = posterPhone; }
}