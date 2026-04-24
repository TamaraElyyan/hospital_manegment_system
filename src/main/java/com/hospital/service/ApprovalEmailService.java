package com.hospital.service;

import com.hospital.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends an email when a user is approved, if {@code spring.mail.host} and {@code app.mail.from} are set.
 * Otherwise logs only (no failure).
 */
@Service
public class ApprovalEmailService {
    private static final Logger log = LoggerFactory.getLogger(ApprovalEmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String mailFrom;

    @Value("${app.frontend.base-url:http://localhost:5000}")
    private String frontendBaseUrl;

    public void notifyApproved(User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            log.info("User approved, no email address: id={}", user.getId());
            return;
        }
        if (mailSender == null || mailFrom == null || mailFrom.isBlank()) {
            log.info("User approved (mail not configured): {} <{}>", user.getFullName(), user.getEmail());
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(user.getEmail());
            message.setSubject("Your account has been approved");
            message.setText(String.format(
                "Hello %s,\n\n"
                    + "Your HealthHub account has been approved. You can sign in at:\n%s/login\n\n"
                    + "Username: %s",
                user.getFullName() != null ? user.getFullName() : user.getUsername(),
                trimSlash(frontendBaseUrl),
                user.getUsername()
            ));
            mailSender.send(message);
            log.debug("Sent approval email to {}", user.getEmail());
        } catch (MailException e) {
            log.warn("Failed to send approval email to {}: {}", user.getEmail(), e.getMessage());
        }
    }

    private static String trimSlash(String s) {
        if (s == null) {
            return "";
        }
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
