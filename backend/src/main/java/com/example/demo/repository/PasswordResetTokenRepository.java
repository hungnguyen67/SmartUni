package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying; 
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional; 

import com.example.demo.model.PasswordResetToken;
import com.example.demo.model.User;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    
    Optional<PasswordResetToken> findByUserAndToken(User user, String token);

    @Modifying
    @Transactional
    void deleteByUser(User user);
}