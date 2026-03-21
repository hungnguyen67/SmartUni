package com.example.demo.model;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.time.LocalDate;

@Entity
@Table(name = "course_classes")
public class CourseClass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "class_code", unique = true, nullable = false, length = 100)
    private String classCode;

    @Column(name = "class_name", nullable = false, length = 200)
    private String className;

    @ManyToOne
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne
    @JoinColumn(name = "lecturer_id", nullable = true)
    private LecturerProfile lecturer;

    @ManyToOne
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @ManyToOne
    @JoinColumn(name = "major_id")
    private Major major;

    @ManyToOne
    @JoinColumn(name = "curriculum_id")
    private Curriculum curriculum;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_class_id")
    private AdministrativeClass targetClass;

    @Column(name = "registration_start")
    private LocalDateTime registrationStart;

    @Column(name = "registration_end")
    private LocalDateTime registrationEnd;

    @Column(name = "max_students")
    private Integer maxStudents = 40;

    @Column(name = "current_enrolled")
    private Integer currentEnrolled = 0;

    @Column(name = "allow_register")
    private Boolean allowRegister = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "class_status")
    private ClassStatus classStatus = ClassStatus.PLANNING;

    @Column(name = "expected_room")
    private String expectedRoom;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "attendance_weight")
    private Double attendanceWeight = 0.10;

    @Column(name = "midterm_weight")
    private Double midtermWeight = 0.30;

    @Column(name = "final_weight")
    private Double finalWeight = 0.60;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "courseClass", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<ClassSchedulePattern> schedules;

    public enum ClassStatus {
        PLANNING, OPEN_REGISTRATION, FULL, ONGOING, GRADING, COMPLETED, CANCELLED, CLOSED
    }

    public CourseClass() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getClassCode() {
        return classCode;
    }

    public void setClassCode(String classCode) {
        this.classCode = classCode;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public LecturerProfile getLecturer() {
        return lecturer;
    }

    public void setLecturer(LecturerProfile lecturer) {
        this.lecturer = lecturer;
    }

    public Semester getSemester() {
        return semester;
    }

    public void setSemester(Semester semester) {
        this.semester = semester;
    }

    public Major getMajor() {
        return major;
    }

    public void setMajor(Major major) {
        this.major = major;
    }

    public Curriculum getCurriculum() {
        return curriculum;
    }

    public void setCurriculum(Curriculum curriculum) {
        this.curriculum = curriculum;
    }

    public LocalDateTime getRegistrationStart() {
        return registrationStart;
    }

    public void setRegistrationStart(LocalDateTime registrationStart) {
        this.registrationStart = registrationStart;
    }

    public LocalDateTime getRegistrationEnd() {
        return registrationEnd;
    }

    public void setRegistrationEnd(LocalDateTime registrationEnd) {
        this.registrationEnd = registrationEnd;
    }

    public Integer getMaxStudents() {
        return maxStudents;
    }

    public void setMaxStudents(Integer maxStudents) {
        this.maxStudents = maxStudents;
    }

    public Integer getCurrentEnrolled() {
        return currentEnrolled;
    }

    public void setCurrentEnrolled(Integer currentEnrolled) {
        this.currentEnrolled = currentEnrolled;
    }

    public Boolean getAllowRegister() {
        return allowRegister;
    }

    public void setAllowRegister(Boolean allowRegister) {
        this.allowRegister = allowRegister;
    }

    public ClassStatus getClassStatus() {
        return classStatus;
    }

    public void setClassStatus(ClassStatus classStatus) {
        this.classStatus = classStatus;
    }

    public Double getAttendanceWeight() {
        return attendanceWeight;
    }

    public void setAttendanceWeight(Double attendanceWeight) {
        this.attendanceWeight = attendanceWeight;
    }

    public Double getMidtermWeight() {
        return midtermWeight;
    }

    public void setMidtermWeight(Double midtermWeight) {
        this.midtermWeight = midtermWeight;
    }

    public Double getFinalWeight() {
        return finalWeight;
    }

    public void setFinalWeight(Double finalWeight) {
        this.finalWeight = finalWeight;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<ClassSchedulePattern> getSchedules() {
        return schedules;
    }

    public void setSchedules(List<ClassSchedulePattern> schedules) {
        this.schedules = schedules;
    }

    public AdministrativeClass getTargetClass() {
        return targetClass;
    }

    public void setTargetClass(AdministrativeClass targetClass) {
        this.targetClass = targetClass;
    }

    public String getExpectedRoom() {
        return expectedRoom;
    }

    public void setExpectedRoom(String expectedRoom) {
        this.expectedRoom = expectedRoom;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
