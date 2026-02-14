package com.csi43C9.baylor.farmers_market.repository;

import com.csi43C9.baylor.farmers_market.entity.User;
import com.csi43C9.baylor.farmers_market.repository.base.AbstractJdbcRepository;
import com.csi43C9.baylor.farmers_market.repository.base.MarketRepository;
import com.csi43C9.baylor.farmers_market.util.UuidUtils;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class UserRepository extends AbstractJdbcRepository implements MarketRepository<User, UUID> {

    protected UserRepository(JdbcTemplate jdbcTemplate) {
        super(jdbcTemplate);
    }

    /**
     * Persists a new user to the database.
     * @param user the user to persist
     * @return the persisted user
     */
    @Override
    public User save(User user) {
        if (user.getId() == null) {
            user.setId(UUID.randomUUID());
            return insert(user);
        } else {
            return update(user);
        }
    }

    /**
     * Inserts a new user record into the database.
     * @param u the user to insert
     * @return the inserted user
     */
    private User insert(User u) {
        String sql = "insert into users (id, email, password_hash) values (?, ?, ?)";
        int result = jdbcTemplate.update(sql,
                UuidUtils.toBytesObject(u.getId()),
                u.getEmail(),
                u.getPasswordHash());

        // Check if the insert was successful.
        if (result != 1) {
            throw new IllegalStateException("Failed to insert user record.");
        }

        return u;
    }

    /**
     * Updates an existing user record.
     * @param u the user to update
     * @return the updated user
     */
    private User update(User u) {
        String sql = "update users set email = ?, password_hash = ? where id = ?";
        int result = jdbcTemplate.update(sql,
                u.getEmail(),
                u.getPasswordHash(),
                UuidUtils.toBytesObject(u.getId()));

        // Check if the update was successful.
        if (result != 1) {
            throw new IllegalStateException("Failed to update user record.");
        }

        return u;
    }

    /**
     * Finds a user by email address.
     * @param email the email address to search for
     * @return an Optional containing the user if found, or an empty Optional otherwise
     */
    public Optional<User> findByEmail(String email) {
        String sql = "select * from users where email = ?";
        try {
            User user = jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(User.class), email);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Retrieves a user by its UUID.
     * @param uuid the UUID of the user to retrieve
     * @return an Optional containing the user if found, or an empty Optional otherwise
     */
    @Override
    public Optional<User> findById(UUID uuid) {
        String sql = "select * from users where id = ?";
        try {
            User user = jdbcTemplate.queryForObject(sql, new BeanPropertyRowMapper<>(User.class), UuidUtils.toBytesObject(uuid));
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Retrieves all users from the database.
     * @return a List of all users
     */
    @Override
    public List<User> findAll() {
        String sql = "select * from users";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(User.class));
    }

    /**
     * Retrieves a page of users from the database.
     * @param pageNumber 0-based page number
     * @param pageSize page size
     * @return a List of users
     */
    @Override
    public List<User> findAllPaged(int pageNumber, int pageSize) {
        int offset = pageNumber * pageSize;
        String sql = """
                select * from users
                order by email
                offset ? rows fetch next ? rows only
                """;
        return jdbcTemplate.query(sql,
                new BeanPropertyRowMapper<>(User.class),
                offset,
                pageSize);
    }

    /**
     * Counts the number of users in the database.
     * @return the number of users
     */
    @Override
    public Long count() {
        String sql = "select count(*) from users";
        return jdbcTemplate.queryForObject(sql, Long.class);
    }

    /**
     * Hard deletes a user from the database.
     * @param uuid the UUID of the user to delete
     */
    @Override
    public void deleteById(UUID uuid) {
        String sql = "delete from users where id = ?";
        jdbcTemplate.update(sql, UuidUtils.toBytesObject(uuid));
    }
}
