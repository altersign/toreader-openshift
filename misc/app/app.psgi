#!/usr/bin/perl

use strict;
use warnings;

use FindBin;
use lib "$FindBin::Bin/../../libs";

use Toreader;

my $app = sub { Toreader->run_psgi(@_, "$FindBin::Bin/../db/toreader.db") };