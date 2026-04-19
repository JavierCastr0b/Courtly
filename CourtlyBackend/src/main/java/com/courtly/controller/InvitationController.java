package com.courtly.controller;

import com.courtly.dto.request.CreateInvitationRequest;
import com.courtly.entity.Invitation;
import com.courtly.entity.Invitation.InvitationStatus;
import com.courtly.entity.User;
import com.courtly.repository.CourtRepository;
import com.courtly.repository.InvitationRepository;
import com.courtly.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final CourtRepository courtRepository;

    @GetMapping
    public List<Invitation> getPending(@AuthenticationPrincipal User user) {
        return invitationRepository.findByToUserIdAndStatus(user.getId(), InvitationStatus.PENDING);
    }

    @PostMapping
    public ResponseEntity<Invitation> create(@Valid @RequestBody CreateInvitationRequest req,
                                             @AuthenticationPrincipal User user) {
        var toUser = userRepository.findById(req.getToUserId()).orElseThrow();
        var court = courtRepository.findById(req.getCourtId()).orElseThrow();

        Invitation inv = Invitation.builder()
                .fromUser(user)
                .toUser(toUser)
                .court(court)
                .date(req.getDate())
                .time(req.getTime())
                .message(req.getMessage())
                .build();
        return ResponseEntity.ok(invitationRepository.save(inv));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<Invitation> accept(@PathVariable String id,
                                             @AuthenticationPrincipal User user) {
        Invitation inv = invitationRepository.findById(id).orElseThrow();
        if (!inv.getToUser().getId().equals(user.getId()))
            return ResponseEntity.status(403).build();
        inv.setStatus(InvitationStatus.ACCEPTED);
        return ResponseEntity.ok(invitationRepository.save(inv));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Invitation> reject(@PathVariable String id,
                                             @AuthenticationPrincipal User user) {
        Invitation inv = invitationRepository.findById(id).orElseThrow();
        if (!inv.getToUser().getId().equals(user.getId()))
            return ResponseEntity.status(403).build();
        inv.setStatus(InvitationStatus.REJECTED);
        return ResponseEntity.ok(invitationRepository.save(inv));
    }
}
