package com.example.demo.controller;

import com.example.demo.dto.CurriculumDTO;
import com.example.demo.service.CurriculumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/curriculums")
@CrossOrigin(origins = "http://localhost:4200")
public class CurriculumController {

    @Autowired
    private CurriculumService curriculumService;

    @GetMapping
    public List<CurriculumDTO> getAllCurriculums() {
        return curriculumService.getAllCurriculums();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CurriculumDTO> getCurriculumById(@PathVariable Long id) {
        return curriculumService.getCurriculumById(id) != null ?
                ResponseEntity.ok(curriculumService.getCurriculumById(id)) :
                ResponseEntity.notFound().build();
    }

    @GetMapping("/major/{majorId}")
    public List<CurriculumDTO> getCurriculumsByMajorId(@PathVariable Long majorId) {
        return curriculumService.getCurriculumsByMajorId(majorId);
    }

    @GetMapping("/{id}/details")
    public List<com.example.demo.dto.KnowledgeBlockDetailDTO> getCurriculumDetails(@PathVariable Long id) {
        return curriculumService.getCurriculumDetails(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCurriculum(@PathVariable Long id) {
        curriculumService.deleteCurriculum(id);
        return ResponseEntity.ok().build();
    }
}
