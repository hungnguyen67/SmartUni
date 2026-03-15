package com.example.demo.repository;

import com.example.demo.model.ClassSchedulePattern;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassSchedulePatternRepository extends JpaRepository<ClassSchedulePattern, Long> {
    List<ClassSchedulePattern> findByCourseClassId(Long courseClassId);
}
