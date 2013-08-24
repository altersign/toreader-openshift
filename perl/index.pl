#!/usr/bin/perl

use strict;
use warnings;

use Plack::Runner;
use File::Basename qw(dirname);
use File::Spec;

my $psgi = File::Spec->catfile(dirname($0), '..', 'misc', 'app', 'app.psgi');
die "Unable to read startup script: $psgi" unless -r $psgi;

Plack::Runner->run($psgi);

