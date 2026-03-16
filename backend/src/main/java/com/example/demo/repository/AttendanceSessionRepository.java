package com.example.demo.repository;

import com.example.demo.model.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    Optional<AttendanceSession> findByScheduleInstanceId(Long scheduleInstanceId);
    Optional<AttendanceSession> findByAttendanceCodeAndIsActiveTrue(String code);
}
