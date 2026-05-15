package com.courtly.repository;

import com.courtly.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface PostRepository extends JpaRepository<Post, String> {

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
    List<Post> findByUserIdOrderByCreatedAtDesc(String userId);
    long countByUserId(String userId);

    @Query("SELECT p FROM Post p JOIN p.user pu WHERE pu.id IN " +
           "(SELECT f.id FROM User u JOIN u.following f WHERE u.id = :userId) " +
           "ORDER BY p.createdAt DESC")
    Page<Post> findByFollowing(@Param("userId") String userId, Pageable pageable);

    @Query("SELECT p.id FROM Post p JOIN p.likedBy u WHERE u.id = :userId")
    Set<String> findLikedPostIdsByUser(@Param("userId") String userId);
}
