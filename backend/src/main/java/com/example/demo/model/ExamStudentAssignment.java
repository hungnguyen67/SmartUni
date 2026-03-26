package com.example.demo.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_student_assignments", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"exam_schedule_id", "student_id"}),
    @UniqueConstraint(columnNames = {"exam_slot_id", "room_name", "seat_number"}),
    @UniqueConstraint(columnNames = {"exam_schedule_id", "roll_number"})
})
public class ExamStudentAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_schedule_id", nullable = false)
    private ExamSchedule examSchedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_slot_id", nullable = false)
    private ExamSlot examSlot;

    @Column(name = "room_name", nullable = false, length = 100)
    private String roomName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    @Column(name = "roll_number", length = 50)
    private String rollNumber;

    @Column(name = "seat_number", length = 20)
    private String seatNumber;

    @Column(name = "row_no")
    private Integer rowNo;

    @Column(name = "column_no")
    private Integer columnNo;

    @Column(name = "attendance_status", length = 30)
    private String attendanceStatus = "PENDING";

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ExamSchedule getExamSchedule() { return examSchedule; }
    public void setExamSchedule(ExamSchedule examSchedule) { this.examSchedule = examSchedule; }

    public ExamSlot getExamSlot() { return examSlot; }
    public void setExamSlot(ExamSlot examSlot) { this.examSlot = examSlot; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public StudentProfile getStudent() { return student; }
    public void setStudent(StudentProfile student) { this.student = student; }

    public String getRollNumber() { return rollNumber; }
    public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }

    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }

    public Integer getRowNo() { return rowNo; }
    public void setRowNo(Integer rowNo) { this.rowNo = rowNo; }

    public Integer getColumnNo() { return columnNo; }
    public void setColumnNo(Integer columnNo) { this.columnNo = columnNo; }

    public String getAttendanceStatus() { return attendanceStatus; }
    public void setAttendanceStatus(String attendanceStatus) { this.attendanceStatus = attendanceStatus; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
