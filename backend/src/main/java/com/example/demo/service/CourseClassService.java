package com.example.demo.service;

import com.example.demo.dto.CourseClassDTO;
import com.example.demo.dto.CourseSubjectGroupDTO;
import com.example.demo.model.CourseClass;
import com.example.demo.model.Subject;
import com.example.demo.model.ClassSchedulePattern;
import com.example.demo.model.AdministrativeClass;
import com.example.demo.model.Semester;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CourseClassService {

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private SemesterRepository semesterRepository;

    @Autowired
    private LecturerProfileRepository lecturerProfileRepository;

    @Autowired
    private CurriculumSubjectRepository curriculumSubjectRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private CourseRegistrationRepository registrationRepository;

    @Autowired
    private AdministrativeClassRepository administrativeClassRepository;

    public List<CourseSubjectGroupDTO> getGroupedSubjectsBySemester(Long semesterId) {
        List<CourseClass> classes = courseClassRepository.findBySemesterId(semesterId);

        Map<Subject, List<CourseClass>> grouped = classes.stream()
                .collect(Collectors.groupingBy(CourseClass::getSubject));

        return grouped.entrySet().stream()
                .map(entry -> {
                    Subject s = entry.getKey();
                    List<CourseClass> subjectClasses = entry.getValue();
                    return new CourseSubjectGroupDTO(
                            s.getId(),
                            s.getSubjectCode(),
                            s.getName(),
                            s.getCredits(),
                            subjectClasses.size(),
                            "ACTIVE");
                })
                .collect(Collectors.toList());
    }

    public List<CourseClassDTO> getClassesBySubjectAndSemester(Long semesterId, Long subjectId) {
        List<CourseClass> classes = courseClassRepository.findBySemesterIdAndSubjectId(semesterId, subjectId);
        return classes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<CourseClassDTO> getClassesBySemester(Long semesterId) {
        List<CourseClass> classes = courseClassRepository.findBySemesterId(semesterId);
        return classes.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public CourseClassDTO createCourseClass(Long semesterId, CourseClassDTO dto) {
        CourseClass cc = new CourseClass();
        updateEntityFromDTO(cc, dto, semesterId);
        CourseClass saved = courseClassRepository.save(cc);
        return convertToDTO(saved);
    }

    public CourseClassDTO updateCourseClass(Long id, CourseClassDTO dto) {
        CourseClass cc = courseClassRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course class not found"));
        updateEntityFromDTO(cc, dto, cc.getSemester().getId());
        CourseClass updated = courseClassRepository.save(cc);
        return convertToDTO(updated);
    }

    public void deleteCourseClass(Long id) {
        courseClassRepository.deleteById(id);
    }

    public List<CourseClassDTO> createBatch(Long semesterId, List<CourseClassDTO> dtos) {
        List<CourseClassDTO> results = new java.util.ArrayList<>();
        for (CourseClassDTO dto : dtos) {
            results.add(createCourseClass(semesterId, dto));
        }
        return results;
    }

    @Transactional
    public List<CourseClassDTO> generateAutoBatch(Long semesterId,
            List<com.example.demo.dto.CourseClassDemandAnalysisDTO> demands) {
        com.example.demo.model.Semester sem = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new RuntimeException("Semester not found"));

        List<CourseClass> toSave = new ArrayList<>();

        for (com.example.demo.dto.CourseClassDemandAnalysisDTO d : demands) {
            if (d.getAdminClassId() == null || d.getAdminClassId() == 0)
                continue;

            Subject s = subjectRepository.findById(d.getSubjectId())
                    .orElseThrow(() -> new RuntimeException("Subject not found"));
            AdministrativeClass ac = administrativeClassRepository.findById(d.getAdminClassId())
                    .orElseThrow(() -> new RuntimeException("Admin class not found"));

            String semPart = sem.getAcademicYear().replace("-", "") + "K" + sem.getSemesterOrder();
            String code = s.getSubjectCode() + "_" + ac.getClassCode() + "_" + semPart;

            if (courseClassRepository.findByClassCode(code).isPresent())
                continue;

            CourseClass cc = new CourseClass();
            cc.setSubject(s);
            cc.setSemester(sem);
            cc.setTargetClass(ac);
            cc.setMajor(ac.getMajor());
            cc.setCurriculum(ac.getCurriculum());
            cc.setMaxStudents(40);
            cc.setClassCode(code);
            cc.setLecturer(null);
            cc.setAttendanceWeight(0.10);
            cc.setMidtermWeight(0.30);
            cc.setFinalWeight(0.60);
            cc.setClassStatus(CourseClass.ClassStatus.PLANNING);
            cc.setCurrentEnrolled(0);
            cc.setAllowRegister(true);

            toSave.add(cc);
        }
        if (toSave.isEmpty())
            return new ArrayList<>();
        return courseClassRepository.saveAll(toSave).stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private void updateEntityFromDTO(CourseClass cc, CourseClassDTO dto, Long semesterId) {
        cc.setClassCode(dto.getClassCode());
        cc.setSubject(subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found")));
        if (dto.getLecturerId() != null) {
            cc.setLecturer(lecturerProfileRepository.findById(dto.getLecturerId())
                    .orElseThrow(() -> new RuntimeException("Lecturer not found")));
        } else {
            cc.setLecturer(null);
        }
        cc.setSemester(semesterRepository.findById(semesterId)
                .orElseThrow(() -> new RuntimeException("Semester not found")));
        cc.setMaxStudents(dto.getMaxStudents());
        cc.setCurrentEnrolled(dto.getCurrentEnrolled());
        cc.setAllowRegister(dto.getCurrentEnrolled() < dto.getMaxStudents());
        cc.setClassStatus(CourseClass.ClassStatus.valueOf(dto.getClassStatus()));
        cc.setRegistrationStart(dto.getRegistrationStart());
        cc.setRegistrationEnd(dto.getRegistrationEnd());
        cc.setAttendanceWeight(dto.getAttendanceWeight() != null ? dto.getAttendanceWeight() : 0.10);
        cc.setMidtermWeight(dto.getMidtermWeight() != null ? dto.getMidtermWeight() : 0.30);
        cc.setFinalWeight(dto.getFinalWeight() != null ? dto.getFinalWeight() : 0.60);
        cc.setExpectedRoom(dto.getExpectedRoom());

        if (dto.getTargetClassId() != null) {
            cc.setTargetClass(administrativeClassRepository.findById(dto.getTargetClassId()).orElse(null));
        }

        if (cc.getSchedules() != null) {
            cc.getSchedules().clear();
        } else {
            cc.setSchedules(new ArrayList<>());
        }

        if (dto.getSchedules() != null) {
            for (CourseClassDTO.ScheduleDTO sDto : dto.getSchedules()) {
                ClassSchedulePattern s = new ClassSchedulePattern();
                s.setCourseClass(cc);
                s.setDayOfWeek(sDto.getDayOfWeek());
                s.setStartPeriod(sDto.getStartPeriod());
                s.setEndPeriod(sDto.getEndPeriod());
                s.setRoomName(sDto.getRoomName());
                s.setSessionType(sDto.getSessionType());
                s.setFromWeek(1);
                s.setToWeek(15);
                cc.getSchedules().add(s);
            }
        }
    }

    private CourseClassDTO convertToDTO(CourseClass cc) {
        CourseClassDTO dto = new CourseClassDTO();
        dto.setId(cc.getId());
        dto.setClassCode(cc.getClassCode());
        dto.setSubjectId(cc.getSubject().getId());
        dto.setSubjectName(cc.getSubject().getName());
        dto.setSubjectCode(cc.getSubject().getSubjectCode());
        if (cc.getLecturer() != null) {
            dto.setLecturerId(cc.getLecturer().getUserId());
            dto.setLecturerName(cc.getLecturer().getUser().getFullName());
        }
        dto.setCredits(cc.getSubject().getCredits());
        dto.setMaxStudents(cc.getMaxStudents());
        dto.setCurrentEnrolled(cc.getCurrentEnrolled());
        dto.setClassStatus(cc.getClassStatus().name());
        dto.setRegistrationStart(cc.getRegistrationStart());
        dto.setRegistrationEnd(cc.getRegistrationEnd());
        dto.setAttendanceWeight(cc.getAttendanceWeight());
        dto.setMidtermWeight(cc.getMidtermWeight());
        dto.setFinalWeight(cc.getFinalWeight());
        dto.setTheoryPeriods(cc.getSubject().getTheoryPeriods());
        dto.setPracticalPeriods(cc.getSubject().getPracticalPeriods());
        dto.setExpectedRoom(cc.getExpectedRoom());

        if (cc.getSchedules() != null) {
            dto.setSchedules(cc.getSchedules().stream()
                    .map(s -> new CourseClassDTO.ScheduleDTO(
                            s.getDayOfWeek(),
                            s.getStartPeriod(),
                            s.getEndPeriod(),
                            s.getRoomName(),
                            s.getSessionType()))
                    .collect(Collectors.toList()));
        }

        if (cc.getMajor() != null) {
            dto.setMajorName(cc.getMajor().getMajorName());
        }

        if (cc.getTargetClass() != null) {
            dto.setTargetClassId(cc.getTargetClass().getId());
            dto.setTargetClassName(cc.getTargetClass().getClassCode());
            if (cc.getTargetClass().getMajor() != null && dto.getMajorName() == null) {
                dto.setMajorName(cc.getTargetClass().getMajor().getMajorName());
            }
        }

        return dto;
    }

    public List<com.example.demo.dto.CourseClassDemandAnalysisDTO> analyzeDemand(Long semesterId, Integer filterCohort,
            Long majorId, Long curriculumId) {
        com.example.demo.model.Semester academicSemester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new RuntimeException("Semester not found"));

        int acadStartYear;
        try {
            acadStartYear = Integer.parseInt(academicSemester.getAcademicYear().split("-")[0]);
        } catch (Exception e) {
            acadStartYear = academicSemester.getStartDate().getYear();
        }
        int semesterOrder = academicSemester.getSemesterOrder();

        List<com.example.demo.model.CurriculumSubject> allCurriculumSubjects = curriculumSubjectRepository.findAll();
        List<com.example.demo.model.StudentProfile> allStudents = studentProfileRepository.findAll();
        Map<String, com.example.demo.dto.CourseClassDemandAnalysisDTO> analysisMap = new java.util.HashMap<>();

        for (com.example.demo.model.StudentProfile student : allStudents) {
            if (student.getStatus() != com.example.demo.model.StudentProfile.Status.STUDYING)
                continue;
            if (filterCohort != null && !student.getEnrollmentYear().equals(filterCohort))
                continue;
            if (curriculumId != null
                    && (student.getCurriculum() == null || !student.getCurriculum().getId().equals(curriculumId)))
                continue;

            Long studentMajorId = null;
            if (student.getAdministrativeClass() != null && student.getAdministrativeClass().getMajor() != null) {
                studentMajorId = student.getAdministrativeClass().getMajor().getId();
            } else if (student.getCurriculum() != null && student.getCurriculum().getMajor() != null) {
                studentMajorId = student.getCurriculum().getMajor().getId();
            }
            if (majorId != null && !majorId.equals(studentMajorId))
                continue;

            int enrollmentYear = student.getEnrollmentYear();
            int currentSemesterNum = (acadStartYear - enrollmentYear) * 2 + semesterOrder;
            if (currentSemesterNum < 1 || currentSemesterNum > 8)
                continue;

            if (student.getCurriculum() != null) {
                Long currId = student.getCurriculum().getId();
                List<com.example.demo.model.CurriculumSubject> mandatory = allCurriculumSubjects.stream()
                        .filter(cs -> cs.getCurriculum().getId().equals(currId)
                                && cs.getRecommendedSemester().equals(currentSemesterNum)
                                && cs.getIsRequired())
                        .collect(Collectors.toList());

                for (com.example.demo.model.CurriculumSubject cs : mandatory) {
                    Long subjId = cs.getSubject().getId();
                    Long adminClassId = student.getAdministrativeClass() != null
                            ? student.getAdministrativeClass().getId()
                            : 0L;
                    String key = subjId + "_" + adminClassId;

                    com.example.demo.dto.CourseClassDemandAnalysisDTO dto = analysisMap.computeIfAbsent(key, k -> {
                        com.example.demo.dto.CourseClassDemandAnalysisDTO d = new com.example.demo.dto.CourseClassDemandAnalysisDTO();
                        d.setSubjectId(subjId);
                        d.setSubjectCode(cs.getSubject().getSubjectCode());
                        d.setSubjectName(cs.getSubject().getName());
                        d.setCredits(cs.getSubject().getCredits());
                        d.setTheoryPeriods(cs.getSubject().getTheoryPeriods());
                        d.setPracticalPeriods(cs.getSubject().getPracticalPeriods());
                        String majorName = (student.getCurriculum() != null
                                && student.getCurriculum().getMajor() != null)
                                        ? student.getCurriculum().getMajor().getMajorName()
                                        : "";
                        d.setMajorName(majorName);
                        d.setMandatoryStudents(0);
                        d.setRepeatingStudents(0);
                        d.setRecommendedSemester(currentSemesterNum);
                        if (student.getAdministrativeClass() != null) {
                            d.setAdminClassId(student.getAdministrativeClass().getId());
                            d.setAdminClassName(student.getAdministrativeClass().getClassName());
                            d.setAdminClassCode(student.getAdministrativeClass().getClassCode());
                            d.setCohort(student.getAdministrativeClass().getCohort());
                        } else {
                            d.setCohort(student.getEnrollmentYear());
                        }
                        return d;
                    });
                    dto.setMandatoryStudents(dto.getMandatoryStudents() + 1);
                }
            }
        }

        List<com.example.demo.model.CourseRegistration> allRegs = registrationRepository.findAll();
        for (com.example.demo.model.CourseRegistration reg : allRegs) {
            if (reg.getIsPassed() != null && !reg.getIsPassed()) {
                Long subjId = reg.getCourseClass().getSubject().getId();
                Long adminClassId = reg.getStudent().getAdministrativeClass() != null
                        ? reg.getStudent().getAdministrativeClass().getId()
                        : 0L;
                String key = subjId + "_" + adminClassId;

                if (analysisMap.containsKey(key)) {
                    analysisMap.get(key).setRepeatingStudents(analysisMap.get(key).getRepeatingStudents() + 1);
                } else {
                    Subject s = reg.getCourseClass().getSubject();
                    com.example.demo.dto.CourseClassDemandAnalysisDTO d = new com.example.demo.dto.CourseClassDemandAnalysisDTO();
                    d.setSubjectId(subjId);
                    d.setSubjectCode(s.getSubjectCode());
                    d.setSubjectName(s.getName());
                    d.setCredits(s.getCredits());
                    d.setTheoryPeriods(s.getTheoryPeriods());
                    d.setPracticalPeriods(s.getPracticalPeriods());
                    d.setMandatoryStudents(0);
                    d.setRepeatingStudents(1);
                    if (reg.getStudent().getAdministrativeClass() != null) {
                        d.setAdminClassId(reg.getStudent().getAdministrativeClass().getId());
                        d.setAdminClassName(reg.getStudent().getAdministrativeClass().getClassName());
                    }
                    analysisMap.put(key, d);
                }
            }
        }

        List<CourseClass> currentClasses = courseClassRepository.findBySemesterId(semesterId);

        for (com.example.demo.dto.CourseClassDemandAnalysisDTO dto : analysisMap.values()) {
            List<CourseClass> subjectClasses = currentClasses.stream()
                    .filter(cc -> cc.getSubject().getId().equals(dto.getSubjectId()))
                    .filter(cc -> dto.getAdminClassId() == null || (cc.getTargetClass() != null
                            && cc.getTargetClass().getId().equals(dto.getAdminClassId())))
                    .collect(Collectors.toList());

            dto.setOpenedClasses(subjectClasses.size());
            dto.setCurrentCapacity(subjectClasses.stream().mapToInt(CourseClass::getMaxStudents).sum());
            dto.setTotalNeeded(dto.getMandatoryStudents() + dto.getRepeatingStudents());
            dto.setMissingSlots(Math.max(0, dto.getTotalNeeded() - dto.getCurrentCapacity()));

            if (dto.getMissingSlots() > 0) {
                int classSize = 40;
                dto.setSuggestedMoreClasses((int) Math.ceil((double) dto.getMissingSlots() / classSize));
            } else {
                dto.setSuggestedMoreClasses(0);
            }
        }

        return new ArrayList<>(analysisMap.values());
    }
}
