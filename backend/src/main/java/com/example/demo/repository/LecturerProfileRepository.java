package com.example.demo.repository;

import com.example.demo.model.LecturerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LecturerProfileRepository extends JpaRepository<LecturerProfile, Long> {
    
    @Query("SELECT l FROM LecturerProfile l JOIN l.user u WHERE " +
           "(:searchTerm IS NULL OR LOWER(l.lecturerCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
           "(:facultyId IS NULL OR l.faculty.id = :facultyId)")
    List<LecturerProfile> searchLecturers(@Param("searchTerm") String searchTerm, @Param("facultyId") Long facultyId);

    @Query("SELECT l FROM LecturerProfile l JOIN l.user u WHERE " +
           "LOWER(u.fullName) = LOWER(:fullName) OR " +
           "LOWER(CONCAT(u.lastName, ' ', u.firstName)) = LOWER(:fullName) OR " +
           "LOWER(CONCAT(u.firstName, ' ', u.lastName)) = LOWER(:fullName)")
    LecturerProfile findByUserFullName(@Param("fullName") String fullName);
    
    boolean existsByLecturerCode(String lecturerCode);
}
