package Feed::Fever;

use strict;
use warnings;

use Feed::Store;

sub new {
    my ($self, $params) = @_;

    die "db name must be set\n" unless ( ref($params) && $params->{dbname} );

    bless {
        dbname => $params->{dbname},
    }, $self;
}


sub process {
    my ($self, $params) = @_;

    my $store = Feed::Store->new( {dbname => $self->{dbname}} );

    my $reply = {
        api_version => 2,
        # TODO: check auth
        auth        => 1,
        # get data from DB
        last_refreshed_on_time => $store->get_refresh_date(),
    };

    if      ( exists $params->{feeds} ) {
        $self->_add_feeds($params, $reply);
    } elsif ( exists $params->{items} ) {
        $self->_add_items($params, $reply);
    } elsif ( exists $params->{mark} && $params->{mark} eq 'item' ) {
        $self->_mark_items($params, $reply);
    } elsif ( exists $params->{unread_item_ids} ) {
        $self->_add_unread_items($params, $reply);
    } elsif ( exists $params->{saved_item_ids} ) {
        $self->_add_saved_items($params, $reply);

    } elsif ( exists $params->{mark} && $params->{mark} eq 'feed' ) {
        # empty stub here and below
    } elsif ( exists $params->{groups} ) {
        $reply->{groups} = [];
    } elsif ( exists $params->{favicons} ) {
        $reply->{favicons} = [];
    } elsif ( exists $params->{links} ) {
        $reply->{links} = [];
    }


    $store->update_refresh_date();

    return $reply;
}


sub _add_feeds {
    my ($self, $params, $reply) = @_;

    my $store = Feed::Store->new( {dbname => $self->{dbname}} );

    $reply->{feeds} = $store->get_feeds;
    $reply->{feeds_group} = [];
}


sub _add_items {
    my ($self, $params, $reply) = @_;

    my $store = Feed::Store->new( {dbname => $self->{dbname}} );

    $reply->{items} = $store->get_items( $params );
    $reply->{total_items} = $store->get_total_items;
}


sub _add_unread_items {
    my ($self, $params, $reply) = @_;

    my $store = Feed::Store->new( {dbname => $self->{dbname}} );

    $reply->{unread_item_ids} = join ',', $store->get_unread_item_ids( $params );
}


sub _add_saved_items {
    my ($self, $params, $reply) = @_;

    my $store = Feed::Store->new( {dbname => $self->{dbname}} );

    $reply->{saved_item_ids} = join ',', $store->get_saved_item_ids( $params );
}


sub _mark_items {
    my ($self, $params, $reply) = @_;

    my $store = Feed::Store->new( {dbname => $self->{dbname}} );
    $store->mark_item( $params );
}


1;

__END__

#    my $feed = XML::Feed->parse(URI->new('http://k.img.com.ua/rss/ru/news.xml'))
#        or die XML::Feed->errstr;

    my $feed = XML::Feed->parse(URI->new('http://habrahabr.ru/rss/best/'))
        or die XML::Feed->errstr;

    my $title = $feed->title;
    utf8::encode($title);
    #print $feed->title .  "\r\n";

