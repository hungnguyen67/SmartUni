package com.example.demo.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendResetCode(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Mã đặt lại mật khẩu");
        message.setText(String.format("Mã đặt lại mật khẩu của bạn là: %s\nMã có hiệu lực trong 15 phút.", code));
        mailSender.send(message);
    }

    public void sendInvitationEmail(String toEmail, String name, String defaultPassword) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Mời tham gia hệ thống quản lý sinh viên");
        message.setText(String.format(
            "Xin chào %s,\n\n" +
            "Bạn đã được mời tham gia hệ thống quản lý sinh viên.\n\n" +
            "Thông tin đăng nhập\n" +
            "Email: %s\n" +
            "Mật khẩu tạm thời: %s\n\n" +
            "Vui lòng đăng nhập và thay đổi mật khẩu của bạn ngay sau lần đầu tiên.\n\n" +
            "Trân trọng,\n" +
            "Ban quản trị hệ thống",
            name, toEmail, defaultPassword
        ));
        mailSender.send(message);
    }
}
