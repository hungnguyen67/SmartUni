package com.example.demo.service;

import com.example.demo.dto.CourseClassDTO;
import com.example.demo.dto.CourseSubjectGroupDTO;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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

    @Autowired
    private ClassScheduleInstanceRepository instanceRepository;

    public List<CourseSubjectGroupDTO> getGroupedSubjectsBySemester(Long semesterId, Long studentId) {
        List<CourseClass> classes = courseClassRepository.findBySemesterId(semesterId);

        // Lấy thông tin môn học trong khung chương trình để biết bắt buộc hay tự chọn
        java.util.Map<Long, Boolean> subjectRequirementMap = new java.util.HashMap<>();
        
        if (studentId != null) {
            // 1. Chỉ lấy các lớp đang trong trạng thái Mở đăng ký cho sinh viên
            classes = classes.stream()
                    .filter(cc -> cc.getClassStatus() == CourseClass.ClassStatus.OPEN_REGISTRATION)
                    .collect(Collectors.toList());

            // 2. Lọc theo khung chương trình
            StudentProfile student = studentProfileRepository.findById(studentId).orElse(null);
            if (student != null && student.getCurriculum() != null) {
                Long curriculumId = student.getCurriculum().getId();
                curriculumSubjectRepository.findAll().stream()
                        .filter(cs -> cs.getCurriculum().getId().equals(curriculumId))
                        .forEach(cs -> subjectRequirementMap.put(cs.getSubject().getId(), cs.getIsRequired()));
                
                // Lọc lớp theo danh sách môn trong khung
                classes = classes.stream()
                        .filter(cc -> subjectRequirementMap.containsKey(cc.getSubject().getId()))
                        .collect(Collectors.toList());
            }
        }

        Map<Subject, List<CourseClass>> grouped = classes.stream()
                .collect(Collectors.groupingBy(CourseClass::getSubject));

        return grouped.entrySet().stream()
                .map(entry -> {
                    Subject s = entry.getKey();
                    List<CourseClass> subjectClasses = entry.getValue();
                    boolean required = subjectRequirementMap.getOrDefault(s.getId(), false);
                    return new CourseSubjectGroupDTO(
                            s.getId(),
                            s.getSubjectCode(),
                            s.getName(),
                            s.getCredits(),
                            subjectClasses.size(),
                            "ACTIVE",
                            required);
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

            String code = s.getSubjectCode() + "." + sem.getSemesterOrder() + "." + sem.getStartDate().getYear() + "/" + ac.getClassCode();
            String name = s.getName() + "." + sem.getSemesterOrder() + "." + sem.getStartDate().getYear() + "/" + ac.getClassCode();

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
            cc.setClassName(name);
            cc.setLecturer(null);
            cc.setAttendanceWeight(0.10);
            cc.setMidtermWeight(0.30);
            cc.setFinalWeight(0.60);
            cc.setClassStatus(CourseClass.ClassStatus.PLANNING);
            cc.setCurrentEnrolled(0);
            cc.setAllowRegister(true);
            cc.setStartDate(sem.getStartDate());
            cc.setEndDate(sem.getEndDate());

            toSave.add(cc);
        }
        if (toSave.isEmpty())
            return new ArrayList<>();
        return courseClassRepository.saveAll(toSave).stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private void updateEntityFromDTO(CourseClass cc, CourseClassDTO dto, Long semesterId) {
        cc.setClassCode(dto.getClassCode());
        
        Semester sem = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new RuntimeException("Semester not found"));

        if (dto.getClassName() != null && !dto.getClassName().trim().isEmpty()) {
            cc.setClassName(dto.getClassName());
        } else if (cc.getClassName() == null || cc.getClassName().trim().isEmpty()) {
            // Nếu chưa có tên lớp và DTO không gửi lên, tự sinh theo format chuẩn
            String autoName = (cc.getSubject() != null ? cc.getSubject().getName() : "");
            if (cc.getTargetClass() != null) {
                autoName += "." + sem.getSemesterOrder() + "." + sem.getStartDate().getYear() + "/" + cc.getTargetClass().getClassCode();
            }
            cc.setClassName(autoName);
        }
        
        cc.setSubject(subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found")));
        if (dto.getLecturerId() != null) {
            cc.setLecturer(lecturerProfileRepository.findById(dto.getLecturerId())
                    .orElseThrow(() -> new RuntimeException("Lecturer not found")));
        } else {
            cc.setLecturer(null);
        }
        cc.setExpectedRoom(dto.getExpectedRoom());
        
        cc.setMaxStudents(dto.getMaxStudents());
        cc.setCurrentEnrolled(dto.getCurrentEnrolled());
        cc.setAllowRegister(dto.getCurrentEnrolled() < dto.getMaxStudents());
        cc.setClassStatus(CourseClass.ClassStatus.valueOf(dto.getClassStatus()));
        cc.setRegistrationStart(dto.getRegistrationStart());
        cc.setRegistrationEnd(dto.getRegistrationEnd());
        cc.setAttendanceWeight(dto.getAttendanceWeight() != null ? dto.getAttendanceWeight() : 0.10);
        cc.setMidtermWeight(dto.getMidtermWeight() != null ? dto.getMidtermWeight() : 0.30);
        cc.setFinalWeight(dto.getFinalWeight() != null ? dto.getFinalWeight() : 0.60);

        // Cập nhật ngày bắt đầu/kết thúc - Ưu tiên từ DTO, nếu không lấy từ Học kỳ
        cc.setStartDate(dto.getStartDate() != null ? dto.getStartDate() : sem.getStartDate());
        cc.setEndDate(dto.getEndDate() != null ? dto.getEndDate() : sem.getEndDate());

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
        dto.setClassName(cc.getClassName());
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
                            s.getStartTime(),
                            s.getEndTime(),
                            s.getRoomName(),
                            s.getSessionType()))
                    .collect(Collectors.toList()));
        }

        LocalDate actualStart = instanceRepository.findMinDateByCourseClassId(cc.getId());
        LocalDate actualEnd = instanceRepository.findMaxDateByCourseClassId(cc.getId());
        dto.setStartDate(actualStart != null ? actualStart : cc.getStartDate());
        dto.setEndDate(actualEnd != null ? actualEnd : cc.getEndDate());

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
