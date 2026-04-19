package com.courtly.controller;

import com.courtly.dto.request.CreatePostRequest;
import com.courtly.entity.Post;
import com.courtly.entity.User;
import com.courtly.repository.PostRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostRepository postRepository;

    @GetMapping
    public Page<Post> getFeed(@PageableDefault(size = 20) Pageable pageable) {
        return postRepository.findAllByOrderByCreatedAtDesc(pageable);
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

    @PostMapping("/{id}/like")
    public ResponseEntity<Void> like(@PathVariable String id,
                                     @AuthenticationPrincipal User user) {
        Post post = postRepository.findById(id).orElseThrow();
        post.getLikedBy().add(user);
        postRepository.save(post);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<Void> unlike(@PathVariable String id,
                                       @AuthenticationPrincipal User user) {
        Post post = postRepository.findById(id).orElseThrow();
        post.getLikedBy().remove(user);
        postRepository.save(post);
        return ResponseEntity.ok().build();
    }
}
