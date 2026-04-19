package com.courtly.repository;

import com.courtly.entity.Invitation;
import com.courtly.entity.Invitation.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvitationRepository extends JpaRepository<Invitation, String> {

    List<Invitation> findByToUserIdAndStatus(String toUserId, InvitationStatus status);
    List<Invitation> findByFromUserId(String fromUserId);
}
