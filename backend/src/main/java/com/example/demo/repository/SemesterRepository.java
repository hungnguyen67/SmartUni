package com.example.demo.repository;

import com.example.demo.model.Semester;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, Long> {
    Optional<Semester> findByAcademicYearAndSemesterOrder(String academicYear, Integer semesterOrder);
}
