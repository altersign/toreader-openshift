PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS operator;
CREATE TABLE operator (
    id          INTEGER PRIMARY KEY,
    username    TEXT NOT NULL UNIQUE,
    password    CHAR(32), -- md5_hex
    last_refreshed_on_time INTEGER
);

INSERT INTO operator VALUES(NULL, 'toreadr', '', NULL);

DROP TABLE IF EXISTS feed;
CREATE TABLE feed (
    id          INTEGER PRIMARY KEY,
    favicon_id  INTEGER NOT NULL DEFAULT 0,
    title       TEXT NOT NULL,
    url         TEXT NOT NULL,
    site_url    TEXT NOT NULL,
    is_spark    BOOLEAN NOT NULL DEFAULT 0,
    update_interval         INTEGER NOT NULL DEFAULT 3600,
    last_updated_on_time    INTEGER
);


DROP TABLE IF EXISTS item;
CREATE TABLE item (
    id      INTEGER PRIMARY KEY,
    uid     TEXT NOT NULL UNIQUE,
    feed_id INTEGER REFERENCES feed(id),
    title   TEXT NOT NULL,
    author  TEXT NOT NULL,
    html    TEXT NOT NULL,
    url     TEXT NOT NULL,
    is_saved BOOLEAN NOT NULL DEFAULT 0,
    is_read BOOLEAN NOT NULL DEFAULT 0,
    created_on_time    INTEGER NOT NULL
);
