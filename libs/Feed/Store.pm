package Feed::Store;

use DBI;
use XML::Feed;

sub new {
    my ($self, $params) = @_;

    die "db name must be set\n" unless ( ref($params) && $params->{dbname} );

    bless {
        db_connection => __PACKAGE__->get_db_connection( $params->{dbname} )
    }, $self;
}


sub update_feeds {
    my ($self) = @_;

    my $dbh = $self->{db_connection};

    my $sth = $dbh->prepare(
        "SELECT id, url
            FROM feed
            WHERE last_updated_on_time+update_interval < 0+strftime('%s', 'now') OR last_updated_on_time IS NULL;" );

    $sth->execute();

    # get list of feeds and their urls
    my ($id, $url, $feed, %feeds);
    while ( ($id, $url) = $sth->fetchrow_array() ) {
        $feeds{$id} = $url;
    }

    while ( ($id, $url) = each %feeds ) {

        $feed = XML::Feed->parse(URI->new($url));
        unless ($feed) {
            warn XML::Feed->errstr;
            next;
        }

        # enclose changes into transaction
        $dbh->begin_work;
        eval {
            for my $entry ($feed->entries) {
                $sth = $dbh->prepare( "SELECT id FROM item WHERE uid=?" );
                $sth->execute( $entry->id );
                my ($item_id) = $sth->fetchrow_array();
                next if ($item_id);

                $sth = $dbh->prepare( "INSERT INTO item (uid, feed_id, title, author, html, url, created_on_time) VALUES (?, ?, ?, ?, ?, ?, ?)" );
                $sth->execute( $entry->id, $id, $entry->title, $entry->author, $entry->content->body, $entry->link, $entry->issued->epoch() );
            }

            $sth = $dbh->prepare( "UPDATE feed SET last_updated_on_time=? WHERE id=?" );
            $sth->execute(time, $id);

            $dbh->commit;
        };
        if ($@) {
            $dbh->rollback;
            die "Database error: $@";
        }
    }

}


sub get_feeds {
    my ($self) = @_;

    my $dbh = $self->{db_connection};

    my ($feed, @feeds);

    my $sth = $dbh->prepare(
        "SELECT id, favicon_id, title, url, site_url, is_spark, last_updated_on_time
            FROM feed
            ORDER BY id;" );
            
    $sth->execute();
    
    # get list of feeds and their urls

    while ( $feed = $sth->fetchrow_hashref() ) {
        push @feeds, $feed;
    }

    return \@feeds;
}


sub get_items {
    my ($self, $params) = @_;

    my $dbh = $self->{db_connection};

    my ($item, @items);
    my $where = '1';
    my @param = ();
    if ( $params->{with_ids} ) {
        @param = split ',', $params->{with_ids};
        $where .= ' AND id IN(' . join(',', ('?') x @param) . ')';
    }


    # TODO: move limit to config
    my $sth = $dbh->prepare(
        "SELECT id, feed_id, title, author, html, url, is_saved, is_read, created_on_time
            FROM item
            WHERE $where
            ORDER BY id DESC
            LIMIT 50;" );

    $sth->execute(@param);
    
    # get list of items
    while ( $item = $sth->fetchrow_hashref() ) {
        push @items, $item;
    }

    return \@items;
}


sub get_total_items {
    my ($self) = @_;

    my $dbh = $self->{db_connection};

    my ($item, @items);

    my $sth = $dbh->prepare(
        "SELECT count(*)
            FROM item
            ORDER BY id DESC;" );

    $sth->execute();
    
    # get list of items
    ($count) = $sth->fetchrow_array();

    return $count;
}

sub mark_item {
    my ($self, $params) = @_;

    my $dbh = $self->{db_connection};

    my %states = (
        read    => 'is_read=1',
        unread  => 'is_read=0',
        saved   => 'is_saved=1',
        unsaved => 'is_saved=0',
    );

    return unless ( $params->{id} && $params->{as} && exists $states{ $params->{as} } );

    my $sth = $dbh->prepare(
        "UPDATE item SET $states{ $params->{as} }
            WHERE id=?;" );

    $sth->execute($params->{id});
}


sub get_unread_item_ids {
    my ($self, $params) = @_;

    my $dbh = $self->{db_connection};

    my ($id, @ids);
    my $sth = $dbh->prepare(
        "SELECT id
            FROM item
            WHERE is_read=0
            ORDER BY id DESC" );

    $sth->execute();

    # get list of ids
    while ( $id = $sth->fetchrow_array() ) {
        push @ids, $id;
    }

    return @ids;
}


sub get_saved_item_ids {
    my ($self, $params) = @_;

    my $dbh = $self->{db_connection};

    my ($id, @ids);
    my $sth = $dbh->prepare(
        "SELECT id
            FROM item
            WHERE is_saved=1
            ORDER BY id DESC" );

    $sth->execute();

    # get list of ids
    while ( $id = $sth->fetchrow_array() ) {
        push @ids, $id;
    }

    return @ids;
}


sub update_refresh_date {
    my ($self) = @_;

    my $dbh = $self->{db_connection};

    my $sth = $dbh->prepare(
        "UPDATE operator SET last_refreshed_on_time=0+strftime('%s', 'now')" );
    $sth->execute();
}


sub get_refresh_date {
    my ($self) = @_;

    my $dbh = $self->{db_connection};

    my $sth = $dbh->prepare(
        "SELECT last_refreshed_on_time FROM operator LIMIT 1" );
    $sth->execute();

    ($date) = $sth->fetchrow_array();

    return $date;
}


sub get_db_connection {
    my ( $class, $dbname ) = @_;

    # check for database file
    unless (-e $dbname && -r _) {
        die "Can't connect to sqlite database, file not found: " . $dbname . "\n";
    }


    DBI->connect(
        'dbi:SQLite:dbname=' . $dbname, '', '', 
        {
            sqlite_unicode => 1,
            RaiseError     => 1,
            on_connect_do  => "PRAGMA foreign_keys = ON", } );
}



1;


__END__