package com.example.demo.repository;

import com.example.demo.model.CourseRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRegistrationRepository extends JpaRepository<CourseRegistration, Long> {
    List<CourseRegistration> findByStudentUserId(Long studentId);
    List<CourseRegistration> findByCourseClassId(Long courseClassId);
    Optional<CourseRegistration> findByCourseClassIdAndStudentUserId(Long courseClassId, Long studentId);
    List<CourseRegistration> findByStudentUserIdAndCourseClassSemesterId(Long studentId, Long semesterId);
}
