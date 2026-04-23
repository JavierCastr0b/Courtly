package com.courtly.repository;

import com.courtly.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, String> {

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<Post> findByUserIdOrderByCreatedAtDesc(String userId);
    long countByUserId(String userId);

    @Query("SELECT p FROM Post p WHERE p.user.id IN " +
           "(SELECT f.id FROM User u JOIN u.following f WHERE u.id = :userId) " +
           "ORDER BY p.createdAt DESC")
    Page<Post> findByFollowing(@Param("userId") String userId, Pageable pageable);
}
