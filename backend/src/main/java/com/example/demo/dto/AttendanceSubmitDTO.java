package com.example.demo.dto;

import com.example.demo.model.AttendanceStatus;
import java.util.List;

public class AttendanceSubmitDTO {
    private Long scheduleInstanceId;
    private String attendanceCode;
    private List<AttendanceRecord> records;

    public static class AttendanceRecord {
        private Long studentId;
        private AttendanceStatus status;
        private Integer absentPeriods;

        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        public AttendanceStatus getStatus() { return status; }
        public void setStatus(AttendanceStatus status) { this.status = status; }
        public Integer getAbsentPeriods() { return absentPeriods; }
        public void setAbsentPeriods(Integer absentPeriods) { this.absentPeriods = absentPeriods; }
    }

    public Long getScheduleInstanceId() { return scheduleInstanceId; }
    public void setScheduleInstanceId(Long scheduleInstanceId) { this.scheduleInstanceId = scheduleInstanceId; }
    public String getAttendanceCode() { return attendanceCode; }
    public void setAttendanceCode(String attendanceCode) { this.attendanceCode = attendanceCode; }
    public List<AttendanceRecord> getRecords() { return records; }
    public void setRecords(List<AttendanceRecord> records) { this.records = records; }
}
