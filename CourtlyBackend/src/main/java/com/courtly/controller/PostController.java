package com.courtly.controller;

import com.courtly.dto.request.CreatePostRequest;
import com.courtly.entity.Notification;
import com.courtly.entity.Post;
import com.courtly.entity.User;
import com.courtly.repository.NotificationRepository;
import com.courtly.repository.PostRepository;
import com.courtly.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @GetMapping
    public Page<Post> getFeed(@PageableDefault(size = 20) Pageable pageable) {
        return postRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @GetMapping("/following")
    public Page<Post> getFollowingFeed(@PageableDefault(size = 20) Pageable pageable,
                                       @AuthenticationPrincipal User user) {
        return postRepository.findByFollowing(user.getId(), pageable);
    }

    @GetMapping("/user/{userId}")
    public List<Post> getByUser(@PathVariable String userId) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @PostMapping
    public ResponseEntity<Post> create(@Valid @RequestBody CreatePostRequest req,
                                       @AuthenticationPrincipal User user) {
        Post post = Post.builder()
                .user(user)
                .title(req.getTitle())
                .description(req.getDescription())
                .location(req.getLocation())
                .level(req.getLevel())
                .playersNeeded(req.getPlayersNeeded())
                .date(req.getDate())
                .time(req.getTime())
                .image(req.getImage())
                .build();
        return ResponseEntity.ok(postRepository.save(post));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id,
                                       @AuthenticationPrincipal User user) {
        Post post = postRepository.findById(id).orElseThrow();
        if (!post.getUser().getId().equals(user.getId()))
            return ResponseEntity.status(403).build();
        postRepository.delete(post);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/liked")
    public Set<String> getLikedPostIds(@AuthenticationPrincipal User user) {
        return postRepository.findLikedPostIdsByUser(user.getId());
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Void> like(@PathVariable String id,
                                     @AuthenticationPrincipal User user) {
        Post post = postRepository.findById(id).orElseThrow();
        User liker = userRepository.findById(user.getId()).orElseThrow();
        boolean alreadyLiked = post.getLikedBy().contains(liker);
        post.getLikedBy().add(liker);
        postRepository.save(post);
        if (!alreadyLiked && !post.getUser().getId().equals(user.getId())) {
            notificationRepository.save(Notification.builder()
                    .recipient(post.getUser())
                    .sender(liker)
                    .type("LIKE")
                    .referenceId(post.getId())
                    .build());
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<Void> unlike(@PathVariable String id,
                                       @AuthenticationPrincipal User user) {
        Post post = postRepository.findById(id).orElseThrow();
        post.getLikedBy().remove(userRepository.findById(user.getId()).orElseThrow());
        postRepository.save(post);
        return ResponseEntity.ok().build();
    }
}
