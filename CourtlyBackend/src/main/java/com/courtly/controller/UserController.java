package com.courtly.controller;

import com.courtly.entity.Equipment;
import com.courtly.entity.Match;
import com.courtly.entity.Notification;
import com.courtly.entity.Recommendation;
import com.courtly.entity.User;
import com.courtly.entity.UserActivity;
import com.courtly.repository.EquipmentRepository;
import com.courtly.repository.MatchRepository;
import com.courtly.repository.NotificationRepository;
import com.courtly.repository.PostRepository;
import com.courtly.repository.RecommendationRepository;
import com.courtly.repository.UserActivityRepository;
import com.courtly.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserActivityRepository userActivityRepository;
    private final MatchRepository matchRepository;
    private final NotificationRepository notificationRepository;
    private final RecommendationRepository recommendationRepository;

    @GetMapping("/me")
    public ResponseEntity<User> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(user);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable String id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> update(@PathVariable String id,
                                       @RequestBody Map<String, Object> updates,
                                       @AuthenticationPrincipal User current) {
        if (!current.getId().equals(id))
            return ResponseEntity.status(403).build();

        User user = userRepository.findById(id).orElseThrow();
        if (updates.containsKey("bio")) user.setBio((String) updates.get("bio"));
        if (updates.containsKey("location")) user.setLocation((String) updates.get("location"));
        if (updates.containsKey("available")) user.setAvailable((Boolean) updates.get("available"));
        if (updates.containsKey("name")) user.setName((String) updates.get("name"));
        if (updates.containsKey("dominantHand")) user.setDominantHand((String) updates.get("dominantHand"));
        if (updates.containsKey("preferredSide")) user.setPreferredSide((String) updates.get("preferredSide"));
        if (updates.containsKey("preferredFormat")) user.setPreferredFormat((String) updates.get("preferredFormat"));
        if (updates.containsKey("preferredStyle")) user.setPreferredStyle((String) updates.get("preferredStyle"));
        return ResponseEntity.ok(userRepository.save(user));
    }

    @GetMapping("/search")
    public ResponseEntity<List<User>> search(@RequestParam String q) {
        return ResponseEntity.ok(userRepository.searchByNameOrUsername(q));
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<Void> follow(@PathVariable String id,
                                       @AuthenticationPrincipal User current) {
        User me = userRepository.findById(current.getId()).orElseThrow();
        User target = userRepository.findById(id).orElseThrow();
        me.getFollowing().add(target);
        userRepository.save(me);
        notificationRepository.save(Notification.builder()
                .recipient(target)
                .sender(me)
                .type("FOLLOW")
                .build());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/follow")
    public ResponseEntity<Void> unfollow(@PathVariable String id,
                                         @AuthenticationPrincipal User current) {
        User me = userRepository.findById(current.getId()).orElseThrow();
        User target = userRepository.findById(id).orElseThrow();
        me.getFollowing().remove(target);
        userRepository.save(me);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<Map<String, Long>> stats(@PathVariable String id) {
        long followers = userRepository.countFollowers(id);
        long following = userRepository.countFollowing(id);
        return ResponseEntity.ok(Map.of("followersCount", followers, "followingCount", following));
    }

    @GetMapping("/me/following")
    public ResponseEntity<List<String>> myFollowing(@AuthenticationPrincipal User current) {
        User me = userRepository.findById(current.getId()).orElseThrow();
        List<String> ids = me.getFollowing().stream().map(User::getId).toList();
        return ResponseEntity.ok(ids);
    }

    @GetMapping("/{id}/followers")
    public ResponseEntity<List<User>> getFollowers(@PathVariable String id) {
        return ResponseEntity.ok(userRepository.findFollowers(id));
    }

    @GetMapping("/{id}/following")
    public ResponseEntity<List<User>> getFollowing(@PathVariable String id) {
        return ResponseEntity.ok(userRepository.findFollowing(id));
    }

    @GetMapping("/{id}/friends")
    public ResponseEntity<List<User>> getFriends(@PathVariable String id) {
        return ResponseEntity.ok(userRepository.findMutualFriends(id));
    }

    // Recommendation / rating
    @PostMapping("/{id}/recommend")
    public ResponseEntity<?> recommend(@PathVariable String id,
                                       @RequestBody Map<String, Integer> body,
                                       @AuthenticationPrincipal User current) {
        if (current.getId().equals(id))
            return ResponseEntity.badRequest().body(Map.of("error", "No puedes recomendarte a ti mismo"));
        int stars = body.getOrDefault("stars", 3);
        if (stars < 1 || stars > 5)
            return ResponseEntity.badRequest().body(Map.of("error", "El puntaje debe ser entre 1 y 5"));

        User target = userRepository.findById(id).orElseThrow();
        User me = userRepository.findById(current.getId()).orElseThrow();

        Recommendation rec = recommendationRepository
                .findByFromUserIdAndToUserId(me.getId(), id)
                .orElse(Recommendation.builder().fromUser(me).toUser(target).build());
        rec.setStars(stars);
        rec.setCreatedAt(java.time.LocalDateTime.now());
        recommendationRepository.save(rec);

        Double avg = recommendationRepository.computeAverageRating(id);
        target.setRating(avg);
        userRepository.save(target);

        return ResponseEntity.ok(Map.of(
                "rating", avg != null ? avg : 0.0,
                "count", recommendationRepository.countByToUserId(id)
        ));
    }

    @GetMapping("/{id}/my-recommendation")
    public ResponseEntity<?> getMyRecommendation(@PathVariable String id,
                                                  @AuthenticationPrincipal User current) {
        return recommendationRepository.findByFromUserIdAndToUserId(current.getId(), id)
                .map(r -> ResponseEntity.ok(Map.of("stars", r.getStars())))
                .orElse(ResponseEntity.ok(Map.of("stars", 0)));
    }

    // Equipment
    @GetMapping("/{id}/equipment")
    public ResponseEntity<List<Equipment>> getEquipment(@PathVariable String id) {
        return ResponseEntity.ok(equipmentRepository.findByUserId(id));
    }

    // Activity heatmap (last 12 weeks)
    @GetMapping("/{id}/activity")
    public ResponseEntity<List<UserActivity>> getActivity(@PathVariable String id) {
        LocalDate from = LocalDate.now().minusWeeks(12);
        LocalDate to = LocalDate.now();
        return ResponseEntity.ok(userActivityRepository.findByUserIdAndDateBetween(id, from, to));
    }

    // Match history
    @GetMapping("/{id}/matches")
    public ResponseEntity<List<Match>> getUserMatches(@PathVariable String id) {
        return ResponseEntity.ok(matchRepository.findByParticipantId(id));
    }
}
