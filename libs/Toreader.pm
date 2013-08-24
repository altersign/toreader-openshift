package Toreader;

use strict;
use warnings;

our $VERSION = '0.01';

use Plack::Request;
use Feed::Fever;
use JSON;

sub run_psgi {
    my ($self, $env, $dbname) = @_;

    my $req = Plack::Request->new($env);

    # GET params
    my %param = _parse_query_string( $env->{QUERY_STRING} );
    # POST params
    foreach my $key ( keys %{$req->body_parameters} ) {
        $param{$key} = $req->body_parameters->{$key};
    }

    my $fever = Feed::Fever->new( {dbname => $dbname} );
    # reply is ref on hash
    my $reply = $fever->process( \%param );

    my $json = JSON->new();
    my $reply_str = $json->encode( $reply );
    utf8::encode($reply_str);

    [
        '200',
        [ 'Content-Type' => 'application/json; charset=utf-8' ],
        [ $reply_str ]
    ];
}


sub _parse_query_string {
    my ($string) = @_;

    my ($key, $val, @param, %param);

    @param = split '&', $string;
    foreach my $it (@param) {
        ($key, $val) = split '=', $it;
        $param{$key} = $val;
    }

    return %param;
}

1;

__END__