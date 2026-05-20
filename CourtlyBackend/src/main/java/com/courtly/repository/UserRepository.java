package com.courtly.repository;

import com.courtly.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<User> searchByNameOrUsername(@Param("q") String q);

    @Query("SELECT COUNT(f) FROM User u JOIN u.followers f WHERE u.id = :userId")
    long countFollowers(@Param("userId") String userId);

    @Query("SELECT COUNT(f) FROM User u JOIN u.following f WHERE u.id = :userId")
    long countFollowing(@Param("userId") String userId);

    @Query("SELECT f FROM User u JOIN u.followers f WHERE u.id = :userId")
    List<User> findFollowers(@Param("userId") String userId);

    @Query("SELECT f FROM User u JOIN u.following f WHERE u.id = :userId")
    List<User> findFollowing(@Param("userId") String userId);

    @Query("SELECT f FROM User u JOIN u.following f WHERE u.id = :userId AND f IN (SELECT f2 FROM User u2 JOIN u2.following f2 WHERE u2.id = f.id AND f2.id = :userId)")
    List<User> findMutualFriends(@Param("userId") String userId);

    @Query("SELECT f.id FROM User u JOIN u.following f WHERE u.id = :userId")
    List<String> findFollowingIds(@Param("userId") String userId);
}
