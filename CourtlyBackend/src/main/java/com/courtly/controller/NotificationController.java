package com.courtly.controller;

import com.courtly.entity.Notification;
import com.courtly.entity.User;
import com.courtly.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal User user) {
        long count = notificationRepository.countByRecipientIdAndReadFalse(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable String id,
                                         @AuthenticationPrincipal User user) {
        Notification n = notificationRepository.findById(id).orElseThrow();
        if (!n.getRecipient().getId().equals(user.getId()))
            return ResponseEntity.status(403).build();
        n.setRead(true);
        notificationRepository.save(n);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal User user) {
        List<Notification> notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId());
        notifs.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifs);
        return ResponseEntity.ok().build();
    }
}
