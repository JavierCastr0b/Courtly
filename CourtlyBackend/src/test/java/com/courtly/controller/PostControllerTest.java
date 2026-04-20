package com.courtly.controller;

import com.courtly.config.SecurityConfig;
import com.courtly.entity.Post;
import com.courtly.entity.User;
import com.courtly.repository.PostRepository;
import com.courtly.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PostController.class)
@Import(SecurityConfig.class)
class PostControllerTest extends BaseControllerTest {

    @MockBean PostRepository postRepository;
    @MockBean UserRepository userRepository;

    private Post mockPost;

    @BeforeEach
    void setUpData() {
        mockPost = Post.builder()
                .id("post-1").user(mockUser).title("Busco compañero").build();
    }

    @Test
    void getFeed_returnsPosts() throws Exception {
        when(postRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(mockPost)));

        mockMvc.perform(get("/api/posts")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("post-1"));
    }

    @Test
    void create_returnsPost() throws Exception {
        when(postRepository.save(any())).thenReturn(mockPost);

        mockMvc.perform(post("/api/posts")
                        .header("Authorization", AUTH_HEADER)
                        .contentType(JSON)
                        .content("""
                                {"title": "Busco compañero"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("post-1"));
    }

    @Test
    void delete_ownPost_returnsNoContent() throws Exception {
        when(postRepository.findById("post-1")).thenReturn(Optional.of(mockPost));

        mockMvc.perform(delete("/api/posts/post-1")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_otherPost_returns403() throws Exception {
        Post other = Post.builder()
                .id("post-2").user(User.builder().id("other").username("otro").build())
                .title("otro post").build();
        when(postRepository.findById("post-2")).thenReturn(Optional.of(other));

        mockMvc.perform(delete("/api/posts/post-2")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isForbidden());
    }

    @Test
    void like_returnsOk() throws Exception {
        when(postRepository.findById("post-1")).thenReturn(Optional.of(mockPost));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(postRepository.save(any())).thenReturn(mockPost);

        mockMvc.perform(post("/api/posts/post-1/like")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk());
    }

    @Test
    void unlike_returnsOk() throws Exception {
        when(postRepository.findById("post-1")).thenReturn(Optional.of(mockPost));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(mockUser));
        when(postRepository.save(any())).thenReturn(mockPost);

        mockMvc.perform(delete("/api/posts/post-1/like")
                        .header("Authorization", AUTH_HEADER))
                .andExpect(status().isOk());
    }
}
