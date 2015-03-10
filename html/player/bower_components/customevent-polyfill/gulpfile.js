'use strict';

var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename');

gulp.task('compress', function() {
    gulp.src('customevent-polyfill.js')
    .pipe(uglify())
    .pipe(rename('customevent-polyfill.min.js'))
    .pipe(gulp.dest('.'));
});
