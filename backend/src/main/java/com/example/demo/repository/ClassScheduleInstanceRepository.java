package com.example.demo.repository;

import com.example.demo.model.ClassScheduleInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ClassScheduleInstanceRepository extends JpaRepository<ClassScheduleInstance, Long> {
    List<ClassScheduleInstance> findByCourseClassId(Long courseClassId);

    void deleteByCourseClassId(Long courseClassId);

    List<ClassScheduleInstance> findByScheduleDate(LocalDate date);

    List<ClassScheduleInstance> findByRoomNameAndScheduleDate(String roomName, LocalDate date);

    List<ClassScheduleInstance> findByLecturerUserIdAndScheduleDate(Long userId, LocalDate date);

    @Query("SELECT MIN(i.scheduleDate) FROM ClassScheduleInstance i WHERE i.courseClass.id = :courseClassId")
    LocalDate findMinDateByCourseClassId(@Param("courseClassId") Long courseClassId);

    @Query("SELECT MAX(i.scheduleDate) FROM ClassScheduleInstance i WHERE i.courseClass.id = :courseClassId")
    LocalDate findMaxDateByCourseClassId(@Param("courseClassId") Long courseClassId);

    @Query("SELECT i FROM ClassScheduleInstance i JOIN i.courseClass cc JOIN CourseRegistration r ON r.courseClass = cc WHERE r.student.userId = :studentId AND cc.semester.id = :semesterId AND cc.classStatus IN :statuses")
    List<ClassScheduleInstance> findByStudentIdAndSemesterIdAndStatusIn(@Param("studentId") Long studentId,
            @Param("semesterId") Long semesterId, @Param("statuses") java.util.Collection<com.example.demo.model.CourseClass.ClassStatus> statuses);

    @Query("SELECT i FROM ClassScheduleInstance i JOIN i.courseClass cc WHERE i.lecturer.userId = :lecturerId AND cc.semester.id = :semesterId AND cc.classStatus IN :statuses")
    List<ClassScheduleInstance> findByLecturerIdAndSemesterIdAndStatusIn(@Param("lecturerId") Long lecturerId,
            @Param("semesterId") Long semesterId, @Param("statuses") java.util.Collection<com.example.demo.model.CourseClass.ClassStatus> statuses);
}
