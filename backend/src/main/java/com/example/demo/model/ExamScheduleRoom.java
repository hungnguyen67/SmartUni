package com.example.demo.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_schedule_rooms", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"exam_schedule_id", "room_name"})
})
public class ExamScheduleRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_schedule_id", nullable = false)
    private ExamSchedule examSchedule;

    @Column(name = "room_name", nullable = false, length = 100)
    private String roomName;

    @Column(name = "room_order")
    private Integer roomOrder = 1;

    @Column(name = "seat_capacity_override")
    private Integer seatCapacityOverride;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proctor_id")
    private LecturerProfile proctor;

    public LecturerProfile getProctor() { return proctor; }
    public void setProctor(LecturerProfile proctor) { this.proctor = proctor; }

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ExamSchedule getExamSchedule() { return examSchedule; }
    public void setExamSchedule(ExamSchedule examSchedule) { this.examSchedule = examSchedule; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public Integer getRoomOrder() { return roomOrder; }
    public void setRoomOrder(Integer roomOrder) { this.roomOrder = roomOrder; }

    public Integer getSeatCapacityOverride() { return seatCapacityOverride; }
    public void setSeatCapacityOverride(Integer seatCapacityOverride) { this.seatCapacityOverride = seatCapacityOverride; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
