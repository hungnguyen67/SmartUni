package com.example.demo.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class ExamScheduleCreateDTO {
    private Long courseClassId;
    private List<Long> courseClassIds;
    private String examType;
    private String examFormat;
    private LocalDate examDate;
    private Integer durationMinutes;
    private LocalTime firstSlotStart;
    private Integer gapDuration;
    private String arrangementMode;
    private Boolean isShuffled;
    private Boolean hasRollNumbers;
    private List<RoomCapacityDTO> rooms;
    private Long proctorId;
    private List<Long> proctorIds;
    private Long createdById;
    private String notes;

    public Long getCourseClassId() { return courseClassId; }
    public void setCourseClassId(Long courseClassId) { this.courseClassId = courseClassId; }

    public List<Long> getCourseClassIds() { return courseClassIds; }
    public void setCourseClassIds(List<Long> courseClassIds) { this.courseClassIds = courseClassIds; }

    public String getExamType() { return examType; }
    public void setExamType(String examType) { this.examType = examType; }

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

    public List<RoomCapacityDTO> getRooms() { return rooms; }
    public void setRooms(List<RoomCapacityDTO> rooms) { this.rooms = rooms; }

    public Long getProctorId() { return proctorId; }
    public void setProctorId(Long proctorId) { this.proctorId = proctorId; }

    public List<Long> getProctorIds() { return proctorIds; }
    public void setProctorIds(List<Long> proctorIds) { this.proctorIds = proctorIds; }

    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public static class RoomCapacityDTO {
        private String roomName;
        private Integer capacity;

        public String getRoomName() { return roomName; }
        public void setRoomName(String roomName) { this.roomName = roomName; }
        public Integer getCapacity() { return capacity; }
        public void setCapacity(Integer capacity) { this.capacity = capacity; }
    }
}
