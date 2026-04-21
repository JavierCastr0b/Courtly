package com.courtly.controller;

import com.courtly.entity.User;
import com.courtly.repository.PostRepository;
import com.courtly.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;

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
}
