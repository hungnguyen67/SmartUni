package com.example.demo.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class SemesterDTO {
    private Long id;
    private String name;
    private String academicYear;
    private Integer semesterOrder;
    private LocalDate startDate;
    private LocalDate endDate;
    private String semesterStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SemesterDTO() {}

    public SemesterDTO(Long id, String name, String academicYear, Integer semesterOrder, 
                       LocalDate startDate, LocalDate endDate, String semesterStatus,
                       LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.academicYear = academicYear;
        this.semesterOrder = semesterOrder;
        this.startDate = startDate;
        this.endDate = endDate;
        this.semesterStatus = semesterStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public Integer getSemesterOrder() { return semesterOrder; }
    public void setSemesterOrder(Integer semesterOrder) { this.semesterOrder = semesterOrder; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getSemesterStatus() { return semesterStatus; }
    public void setSemesterStatus(String semesterStatus) { this.semesterStatus = semesterStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
