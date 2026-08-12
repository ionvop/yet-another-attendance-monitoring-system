<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Year Levels
    |--------------------------------------------------------------------------
    |
    | The configured dropdown values for student year levels.
    | Used in validation for registrations (both manual and CSV import).
    |
    */

    'year_levels' => [
        '1st year',
        '2nd year',
        '3rd year',
        '4th year',
        '5th year',
    ],

    /*
    |--------------------------------------------------------------------------
    | Courses
    |--------------------------------------------------------------------------
    |
    | The configured dropdown values for student courses/programs.
    | Used in validation for registrations (both manual and CSV import).
    |
    */

    'courses' => [
        'BSCS',
        'BSIT',
        'BSBA',
        'BSA',
        'BSED',
        'BSN',
        'BSCRIM',
        'BSHM',
        'BSTM',
        'BSCE',
        'BSME',
        'BSEE',
        'BSMA',
    ],

    /*
    |--------------------------------------------------------------------------
    | CSV Import
    |--------------------------------------------------------------------------
    |
    | Configuration for the CSV registration import feature.
    |
    */

    'csv' => [
        'max_file_size' => 5120, // KB (5 MB)
    ],

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    |
    | Default pagination settings for list endpoints.
    |
    */

    'pagination' => [
        'default_per_page' => 25,
        'max_per_page' => 100,
    ],

];