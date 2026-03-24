package com.example.demo.controller;

import com.example.demo.dto.CurriculumDTO;
import com.example.demo.dto.KnowledgeBlockDTO;
import com.example.demo.dto.CurriculumSubjectDetailDTO;
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
        return curriculumService.getCurriculumById(id) != null
                ? ResponseEntity.ok(curriculumService.getCurriculumById(id))
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/major/{majorId}")
    public List<CurriculumDTO> getCurriculumsByMajorId(@PathVariable Long majorId) {
        return curriculumService.getCurriculumsByMajorId(majorId);
    }

    @GetMapping("/{id}/details")
    public List<com.example.demo.dto.KnowledgeBlockDetailDTO> getCurriculumDetails(@PathVariable Long id) {
        return curriculumService.getCurriculumDetails(id);
    }

    @GetMapping("/knowledge-blocks")
    public List<KnowledgeBlockDTO> getAllKnowledgeBlocks() {
        return curriculumService.getAllKnowledgeBlocks();
    }

    @GetMapping("/subjects")
    public List<CurriculumSubjectDetailDTO> getAllCurriculumSubjects() {
        return curriculumService.getAllCurriculumSubjects();
    }

    @PostMapping("/knowledge-blocks")
    public KnowledgeBlockDTO createKnowledgeBlock(@RequestBody KnowledgeBlockDTO dto) {
        return curriculumService.createKnowledgeBlock(dto);
    }

    @PutMapping("/knowledge-blocks/{id}")
    public KnowledgeBlockDTO updateKnowledgeBlock(@PathVariable Long id, @RequestBody KnowledgeBlockDTO dto) {
        return curriculumService.updateKnowledgeBlock(id, dto);
    }

    @DeleteMapping("/knowledge-blocks/{id}")
    public void deleteKnowledgeBlock(@PathVariable Long id) {
        curriculumService.deleteKnowledgeBlock(id);
    }

    @PostMapping("/curriculum-subjects")
    public CurriculumSubjectDetailDTO addSubjectToCurriculum(@RequestBody CurriculumSubjectDetailDTO dto) {
        return curriculumService.addSubjectToCurriculum(dto);
    }

    @PutMapping("/curriculum-subjects")
    public CurriculumSubjectDetailDTO updateCurriculumSubject(@RequestBody CurriculumSubjectDetailDTO dto) {
        return curriculumService.updateCurriculumSubject(dto);
    }

    @DeleteMapping("/curriculum-subjects/{curriculumId}/{subjectId}")
    public void deleteCurriculumSubject(@PathVariable Long curriculumId, @PathVariable Long subjectId) {
        curriculumService.deleteCurriculumSubject(curriculumId, subjectId);
    }

    @PostMapping
    public CurriculumDTO createCurriculum(@RequestBody CurriculumDTO curriculumDTO) {
        return curriculumService.createCurriculum(curriculumDTO);
    }

    @PutMapping("/{id}")
    public CurriculumDTO updateCurriculum(@PathVariable Long id, @RequestBody CurriculumDTO curriculumDTO) {
        return curriculumService.updateCurriculum(id, curriculumDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCurriculum(@PathVariable Long id) {
        curriculumService.deleteCurriculum(id);
        return ResponseEntity.ok().build();
    }
}
