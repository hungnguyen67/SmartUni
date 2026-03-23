package com.example.demo.repository;

import com.example.demo.model.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    @Query("SELECT s FROM StudentProfile s JOIN s.user u " +
           "WHERE (:searchTerm IS NULL OR " +
           "LOWER(s.studentCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND (:classId IS NULL OR s.administrativeClass.id = :classId) " +
           "AND (:majorId IS NULL OR s.administrativeClass.major.id = :majorId) " +
           "AND (:enrollmentYear IS NULL OR s.enrollmentYear = :enrollmentYear) " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND (:minGpa IS NULL OR s.currentGpa >= :minGpa) " +
           "AND (:maxGpa IS NULL OR s.currentGpa <= :maxGpa)")
    List<StudentProfile> searchStudents(
            @Param("searchTerm") String searchTerm,
            @Param("classId") Long classId,
            @Param("majorId") Long majorId,
            @Param("enrollmentYear") Integer enrollmentYear,
            @Param("status") StudentProfile.Status status,
            @Param("minGpa") Double minGpa,
            @Param("maxGpa") Double maxGpa
    );

    long countByAdministrativeClassId(Long classId);
    
    @Query("SELECT AVG(s.currentGpa) FROM StudentProfile s WHERE s.administrativeClass.id = :classId")
    Double findAverageGpaByClassId(@Param("classId") Long classId);
    
    @Query("SELECT DISTINCT s.enrollmentYear FROM StudentProfile s ORDER BY s.enrollmentYear ASC")
    List<Integer> findDistinctEnrollmentYears();
}
