<?php
require __DIR__ . '/vendor/autoload.php';

if (class_exists('App\Kernel')) {
    echo "Found App\Kernel\n";
} else {
    echo "NOT Found App\Kernel\n";
    $loader = require __DIR__ . '/vendor/autoload.php';
    print_r($loader->getPrefixesPsr4());
}
