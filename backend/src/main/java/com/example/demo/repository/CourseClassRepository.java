package com.example.demo.repository;

import com.example.demo.model.CourseClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseClassRepository extends JpaRepository<CourseClass, Long> {
    List<CourseClass> findBySemesterId(Long semesterId);
    
    @Query("SELECT c FROM CourseClass c WHERE c.semester.id = :semesterId AND c.subject.id = :subjectId")
    List<CourseClass> findBySemesterIdAndSubjectId(@Param("semesterId") Long semesterId, @Param("subjectId") Long subjectId);
    
    @Query("SELECT DISTINCT c.subject.id FROM CourseClass c WHERE c.semester.id = :semesterId")
    List<Long> findDistinctSubjectIdsBySemesterId(@Param("semesterId") Long semesterId);

    java.util.Optional<CourseClass> findByClassCode(String classCode);
    
    @Query("SELECT c FROM CourseClass c WHERE c.semester.id = :semesterId AND c.subject.id = :subjectId AND c.targetClass.id = :targetClassId")
    java.util.List<CourseClass> findBySemesterSubjectAndTargetClass(@Param("semesterId") Long semesterId, @Param("subjectId") Long subjectId, @Param("targetClassId") Long targetClassId);
    
    @Query("SELECT c FROM CourseClass c WHERE c.lecturer.userId = :userId AND c.semester.id = :semesterId")
    List<CourseClass> findByLecturerUserIdAndSemesterId(@Param("userId") Long userId, @Param("semesterId") Long semesterId);
}
