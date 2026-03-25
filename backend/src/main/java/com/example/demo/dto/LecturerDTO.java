package com.example.demo.dto;

import java.time.LocalDate;
import java.util.List;

public class LecturerDTO {
    private Long id;
    private String lecturerCode;
    private String lastName;
    private String firstName;
    private Long facultyId;
    private String facultyName;
    private String specialization;
    private String degree;
    private String academicRank;
    private String phone;
    private String email;
    private LocalDate birthday;
    private String address;
    private String gender;
    private String status;
    private List<String> advisorClasses;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
    private String password;
    private Boolean isEmailVerified;
    private String avatar;

    public LecturerDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLecturerCode() { return lecturerCode; }
    public void setLecturerCode(String lecturerCode) { this.lecturerCode = lecturerCode; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public Long getFacultyId() { return facultyId; }
    public void setFacultyId(Long facultyId) { this.facultyId = facultyId; }

    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getDegree() { return degree; }
    public void setDegree(String degree) { this.degree = degree; }

    public String getAcademicRank() { return academicRank; }
    public void setAcademicRank(String academicRank) { this.academicRank = academicRank; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public LocalDate getBirthday() { return birthday; }
    public void setBirthday(LocalDate birthday) { this.birthday = birthday; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<String> getAdvisorClasses() { return advisorClasses; }
    public void setAdvisorClasses(List<String> advisorClasses) { this.advisorClasses = advisorClasses; }

    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }

    public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(java.time.LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Boolean getIsEmailVerified() { return isEmailVerified; }
    public void setIsEmailVerified(Boolean isEmailVerified) { this.isEmailVerified = isEmailVerified; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
}
