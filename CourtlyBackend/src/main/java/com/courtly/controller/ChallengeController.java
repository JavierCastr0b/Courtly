package com.courtly.controller;

import com.courtly.dto.request.CreateChallengeRequest;
import com.courtly.entity.Challenge;
import com.courtly.entity.Challenge.ChallengeStatus;
import com.courtly.entity.User;
import com.courtly.repository.ChallengeRepository;
import com.courtly.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeRepository challengeRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<Challenge> getMyChallenges(@AuthenticationPrincipal User user) {
        return challengeRepository.findByUserId(user.getId());
    }

    @PostMapping
    public ResponseEntity<Challenge> create(@Valid @RequestBody CreateChallengeRequest req,
                                            @AuthenticationPrincipal User user) {
        var challenged = userRepository.findById(req.getChallengedUserId()).orElseThrow();
        Challenge challenge = Challenge.builder()
                .challenger(user)
                .challenged(challenged)
                .description(req.getDescription())
                .deadline(req.getDeadline())
                .build();
        return ResponseEntity.ok(challengeRepository.save(challenge));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<Challenge> accept(@PathVariable String id,
                                            @AuthenticationPrincipal User user) {
        Challenge challenge = challengeRepository.findById(id).orElseThrow();
        if (!challenge.getChallenged().getId().equals(user.getId()))
            return ResponseEntity.status(403).build();
        challenge.setStatus(ChallengeStatus.ACTIVE);
        return ResponseEntity.ok(challengeRepository.save(challenge));
    }

    @PutMapping("/{id}/score")
    public ResponseEntity<Challenge> updateScore(@PathVariable String id,
                                                 @RequestBody Map<String, String> body,
                                                 @AuthenticationPrincipal User user) {
        Challenge challenge = challengeRepository.findById(id).orElseThrow();
        boolean isChallenger = challenge.getChallenger().getId().equals(user.getId());
        boolean isChallenged = challenge.getChallenged().getId().equals(user.getId());

        if (!isChallenger && !isChallenged)
            return ResponseEntity.status(403).build();

        if (isChallenger) challenge.setChallengerScore(body.get("score"));
        else challenge.setChallengedScore(body.get("score"));

        if (challenge.getChallengerScore() != null && challenge.getChallengedScore() != null)
            challenge.setStatus(ChallengeStatus.COMPLETED);

        return ResponseEntity.ok(challengeRepository.save(challenge));
    }
}
