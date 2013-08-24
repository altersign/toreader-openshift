#!/usr/bin/perl

use strict;
use warnings;

use FindBin;

use lib "$FindBin::Bin/../../libs";

use Feed::Store;

my $store = Feed::Store->new({dbname => "$FindBin::Bin/../db/toreader.db"});

$store->update_feeds;

exit;

__END__
