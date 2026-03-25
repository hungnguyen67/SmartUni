package com.example.demo.dto;

public class StudentDTO {
    private Long id;
    private String studentCode;
    private String fullName;
    private String className;
    private Long classId;
    private Long curriculumId;
    private String curriculumName;
    private Integer enrollmentYear;

    private Integer totalCreditsEarned;
    private Double currentGpa;
    private Double currentGpa10;
    private String status;
    private String majorName;
    private Long majorId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private java.time.LocalDate birthday;
    private String gender;
    private Long facultyId;
    private String facultyName;
    private Integer absentSessions = 0;
    private Integer absentPeriods = 0;
    private Double absentPercent = 0.0;
    private boolean selfAttended;
    private boolean absent;
    private boolean excused;
    private boolean present;
    private Integer sessionAbsentPeriods = 0;
    private String enteredCode;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
    private String password;
    private Boolean isEmailVerified;
    private String avatar;

    public StudentDTO() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStudentCode() {
        return studentCode;
    }

    public void setStudentCode(String studentCode) {
        this.studentCode = studentCode;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public Long getClassId() {
        return classId;
    }

    public void setClassId(Long classId) {
        this.classId = classId;
    }

    public Long getCurriculumId() {
        return curriculumId;
    }

    public void setCurriculumId(Long curriculumId) {
        this.curriculumId = curriculumId;
    }

    public String getCurriculumName() {
        return curriculumName;
    }

    public void setCurriculumName(String curriculumName) {
        this.curriculumName = curriculumName;
    }

    public Integer getEnrollmentYear() {
        return enrollmentYear;
    }

    public void setEnrollmentYear(Integer enrollmentYear) {
        this.enrollmentYear = enrollmentYear;
    }



    public Integer getTotalCreditsEarned() {
        return totalCreditsEarned;
    }

    public void setTotalCreditsEarned(Integer totalCreditsEarned) {
        this.totalCreditsEarned = totalCreditsEarned;
    }

    public Double getCurrentGpa() {
        return currentGpa;
    }

    public void setCurrentGpa(Double currentGpa) {
        this.currentGpa = currentGpa;
    }

    public Double getCurrentGpa10() {
        return currentGpa10;
    }

    public void setCurrentGpa10(Double currentGpa10) {
        this.currentGpa10 = currentGpa10;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMajorName() {
        return majorName;
    }

    public void setMajorName(String majorName) {
        this.majorName = majorName;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public java.time.LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(java.time.LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public java.time.LocalDate getBirthday() {
        return birthday;
    }

    public void setBirthday(java.time.LocalDate birthday) {
        this.birthday = birthday;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public Long getMajorId() {
        return majorId;
    }

    public void setMajorId(Long majorId) {
        this.majorId = majorId;
    }

    public Long getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(Long facultyId) {
        this.facultyId = facultyId;
    }

    public String getFacultyName() {
        return facultyName;
    }

    public void setFacultyName(String facultyName) {
        this.facultyName = facultyName;
    }

    public Integer getAbsentSessions() {
        return absentSessions;
    }

    public void setAbsentSessions(Integer absentSessions) {
        this.absentSessions = absentSessions;
    }

    public Integer getAbsentPeriods() {
        return absentPeriods;
    }

    public void setAbsentPeriods(Integer absentPeriods) {
        this.absentPeriods = absentPeriods;
    }

    public Double getAbsentPercent() {
        return absentPercent;
    }

    public void setAbsentPercent(Double absentPercent) {
        this.absentPercent = absentPercent;
    }

    public boolean isSelfAttended() { return selfAttended; }
    public void setSelfAttended(boolean selfAttended) { this.selfAttended = selfAttended; }
    public boolean isAbsent() { return absent; }
    public void setAbsent(boolean absent) { this.absent = absent; }
    public boolean isExcused() { return excused; }
    public void setExcused(boolean excused) { this.excused = excused; }
    public boolean isPresent() { return present; }
    public void setPresent(boolean present) { this.present = present; }
    public Integer getSessionAbsentPeriods() { return sessionAbsentPeriods; }
    public void setSessionAbsentPeriods(Integer sessionAbsentPeriods) { this.sessionAbsentPeriods = sessionAbsentPeriods; }
    public String getEnteredCode() { return enteredCode; }
    public void setEnteredCode(String enteredCode) { this.enteredCode = enteredCode; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Boolean getIsEmailVerified() { return isEmailVerified; }
    public void setIsEmailVerified(Boolean isEmailVerified) { this.isEmailVerified = isEmailVerified; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
}
