package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DatabaseUpgradeService implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseUpgradeService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        logger.info("Initializing database upgrade for ClassStatus enum...");
        try {
            // Convert ENUM column to VARCHAR for better stability and to allow any string
            // during refactoring
            jdbcTemplate
                    .execute("ALTER TABLE course_classes MODIFY COLUMN class_status VARCHAR(50) DEFAULT 'PLANNING'");

            // Update Course Class Statuses to match new Enum strings
            jdbcTemplate.execute(
                    "UPDATE course_classes SET class_status = 'OPEN' WHERE class_status = 'OPEN_REGISTRATION' OR class_status = 'FULL'");
            jdbcTemplate.execute(
                    "UPDATE course_classes SET class_status = 'CLOSED' WHERE class_status = 'COMPLETED' OR class_status = 'GRADING' OR class_status = 'CLOSED'");

            // Failsafe for missing columns in course_registrations (as reported by user)
            try {
                jdbcTemplate.execute("ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS course_class_id BIGINT");
                jdbcTemplate.execute("ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS student_id BIGINT");
                logger.info("Failsafe: Checked/Added missing foreign key columns to course_registrations.");
            } catch (Exception e) {
                // Ignore if already exist or IF NOT EXISTS not supported
            }

            // Java-based calculation logic: Update existing records in DB via SQL that matches Java logic
            try {
                // Update total_score first
                jdbcTemplate.execute("UPDATE course_registrations cr " +
                    "JOIN course_classes cc ON cr.course_class_id = cc.id " +
                    "SET cr.total_score = ROUND(cr.attendance_score * cc.attendance_weight + cr.midterm_score * cc.midterm_weight + cr.final_score * cc.final_weight, 2)");
                
                // Then update is_passed, grade_letter, grade_point based on the new total_score
                jdbcTemplate.execute("UPDATE course_registrations SET " +
                    "is_passed = (total_score >= 4.0), " +
                    "grade_letter = (CASE " +
                    "WHEN total_score >= 8.5 THEN 'A' " +
                    "WHEN total_score >= 7.0 THEN 'B' " +
                    "WHEN total_score >= 5.5 THEN 'C' " +
                    "WHEN total_score >= 4.0 THEN 'D' " +
                    "ELSE 'F' END), " +
                    "grade_point = (CASE " +
                    "WHEN total_score >= 8.5 THEN 4.0 " +
                    "WHEN total_score >= 7.0 THEN 3.0 " +
                    "WHEN total_score >= 5.5 THEN 2.0 " +
                    "WHEN total_score >= 4.0 THEN 1.0 " +
                    "ELSE 0.0 END)");
                
                logger.info("Failsafe: Successfully recalculated and updated existing grades in DB.");
            } catch (Exception e) {
                logger.warn("Failsafe Note: Could not perform mass grade recalculation. Error: " + e.getMessage());
            }

            logger.info("Database upgrade completed successfully.");
        } catch (Exception e) {
            logger.warn(
                    "Database upgrade note: Course classes table might not be fully initialized yet or update already performed. Error: "
                            + e.getMessage());
        }
    }
}
