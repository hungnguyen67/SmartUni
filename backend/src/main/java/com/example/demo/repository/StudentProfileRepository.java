package com.example.demo.repository;

import com.example.demo.model.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    @Query("SELECT s FROM StudentProfile s " +
           "LEFT JOIN FETCH s.user u " +
           "LEFT JOIN FETCH s.administrativeClass ac " +
           "LEFT JOIN FETCH ac.major m " +
           "LEFT JOIN FETCH m.faculty f " +
           "LEFT JOIN FETCH s.curriculum cur " +
           "LEFT JOIN FETCH cur.major cm " +
           "LEFT JOIN FETCH cm.faculty cf " +
           "WHERE (:searchTerm IS NULL OR " +
           "LOWER(s.studentCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND (:classId IS NULL OR ac.id = :classId) " +
           "AND (:majorId IS NULL OR m.id = :majorId) " +
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

    boolean existsByStudentCode(String studentCode);
    long countByAdministrativeClassId(Long classId);
    
    @Query("SELECT AVG(s.currentGpa) FROM StudentProfile s WHERE s.administrativeClass.id = :classId")
    Double findAverageGpaByClassId(@Param("classId") Long classId);
    
    @Query("SELECT DISTINCT s.enrollmentYear FROM StudentProfile s ORDER BY s.enrollmentYear ASC")
    List<Integer> findDistinctEnrollmentYears();
}
