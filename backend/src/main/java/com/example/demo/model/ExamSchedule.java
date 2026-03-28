package com.example.demo.model;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_schedules")
public class ExamSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_class_id", nullable = false)
    private CourseClass courseClass;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false)
    private ExamType examType;

    @Column(name = "exam_format", nullable = false, length = 100)
    private String examFormat;

    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "first_slot_start", nullable = false)
    private LocalTime firstSlotStart;

    @Column(name = "gap_duration")
    private Integer gapDuration = 15;

    @Column(name = "arrangement_mode", length = 50)
    private String arrangementMode;

    @Column(name = "is_shuffled")
    private Boolean isShuffled = false;

    @Column(name = "has_roll_numbers")
    private Boolean hasRollNumbers = false;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "status", length = 50)
    private String status = "DRAFT";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proctor_id")
    private LecturerProfile proctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "examSchedule", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("examSchedule")
    private java.util.List<ExamScheduleRoom> rooms;

    @OneToMany(mappedBy = "examSchedule", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("examSchedule")
    private java.util.List<ExamSlot> slots;

    @OneToMany(mappedBy = "examSchedule", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("examSchedule")
    private java.util.List<ExamStudentAssignment> assignments;

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum ExamType {
        MIDTERM, FINAL, RETAKE, QUIZ
    }

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CourseClass getCourseClass() { return courseClass; }
    public void setCourseClass(CourseClass courseClass) { this.courseClass = courseClass; }

    public ExamType getExamType() { return examType; }
    public void setExamType(ExamType examType) { this.examType = examType; }

    public String getExamFormat() { return examFormat; }
    public void setExamFormat(String examFormat) { this.examFormat = examFormat; }

    public LocalDate getExamDate() { return examDate; }
    public void setExamDate(LocalDate examDate) { this.examDate = examDate; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public LocalTime getFirstSlotStart() { return firstSlotStart; }
    public void setFirstSlotStart(LocalTime firstSlotStart) { this.firstSlotStart = firstSlotStart; }

    public Integer getGapDuration() { return gapDuration; }
    public void setGapDuration(Integer gapDuration) { this.gapDuration = gapDuration; }

    public String getArrangementMode() { return arrangementMode; }
    public void setArrangementMode(String arrangementMode) { this.arrangementMode = arrangementMode; }

    public Boolean getIsShuffled() { return isShuffled; }
    public void setIsShuffled(Boolean isShuffled) { this.isShuffled = isShuffled; }

    public Boolean getHasRollNumbers() { return hasRollNumbers; }
    public void setHasRollNumbers(Boolean hasRollNumbers) { this.hasRollNumbers = hasRollNumbers; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LecturerProfile getProctor() { return proctor; }
    public void setProctor(LecturerProfile proctor) { this.proctor = proctor; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public java.util.List<ExamScheduleRoom> getRooms() { return rooms; }
    public void setRooms(java.util.List<ExamScheduleRoom> rooms) { this.rooms = rooms; }

    public java.util.List<ExamSlot> getSlots() { return slots; }
    public void setSlots(java.util.List<ExamSlot> slots) { this.slots = slots; }

    public java.util.List<ExamStudentAssignment> getAssignments() { return assignments; }
    public void setAssignments(java.util.List<ExamStudentAssignment> assignments) { this.assignments = assignments; }
}
