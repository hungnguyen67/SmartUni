package com.example.demo.repository;

import com.example.demo.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findBySessionId(Long sessionId);

    Optional<Attendance> findBySessionIdAndStudentUserId(Long sessionId, Long studentId);

    @Query("SELECT SUM(a.absentPeriods) FROM Attendance a WHERE a.student.userId = :studentId AND a.session.scheduleInstance.courseClass.id = :courseClassId")
    Integer sumAbsentPeriodsByStudentAndCourseClass(Long studentId, Long courseClassId);

    @Query("SELECT COUNT(DISTINCT a.session.id) FROM Attendance a WHERE a.student.userId = :studentId AND a.session.scheduleInstance.courseClass.id = :courseClassId AND (a.status = 'ABSENT' OR a.status = 'EXCUSED')")
    Integer countAbsentSessionsByStudentAndCourseClass(Long studentId, Long courseClassId);

    // Get all attendance for a student in a specific course class to calculate
    // stats
    @Query("SELECT a FROM Attendance a WHERE a.student.userId = :studentId AND a.session.scheduleInstance.courseClass.id = :courseClassId")
    List<Attendance> findAllByStudentAndCourseClass(Long studentId, Long courseClassId);
}
