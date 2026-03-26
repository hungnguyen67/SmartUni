package com.example.demo.repository;

import com.example.demo.model.ExamStudentAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamStudentAssignmentRepository extends JpaRepository<ExamStudentAssignment, Long> {
    List<ExamStudentAssignment> findByExamScheduleId(Long examScheduleId);
    List<ExamStudentAssignment> findByExamSlotId(Long examSlotId);
    long countByExamScheduleId(Long examScheduleId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT a.student.studentCode FROM ExamStudentAssignment a " +
            "WHERE a.examSchedule.courseClass.subject.id = :subjectId " +
            "AND a.examSchedule.courseClass.semester.id = :semesterId " +
            "AND a.examSchedule.examType = :examType")
    List<String> findAssignedStudentCodes(
            @org.springframework.data.repository.query.Param("subjectId") Long subjectId, 
            @org.springframework.data.repository.query.Param("semesterId") Long semesterId, 
            @org.springframework.data.repository.query.Param("examType") com.example.demo.model.ExamSchedule.ExamType examType);

    @org.springframework.data.jpa.repository.Query("SELECT CONCAT(a.student.studentCode, '_', a.examSchedule.courseClass.subject.id) FROM ExamStudentAssignment a " +
            "WHERE a.examSchedule.courseClass.semester.id = :semesterId " +
            "AND a.examSchedule.examType = :examType")
    List<String> findAllAssignedStudentSubjectKeys(
            @org.springframework.data.repository.query.Param("semesterId") Long semesterId, 
            @org.springframework.data.repository.query.Param("examType") com.example.demo.model.ExamSchedule.ExamType examType);
}
