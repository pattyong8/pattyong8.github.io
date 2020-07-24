const gulp = require("gulp");
var   fileinclude = require('gulp-file-include'),
      fileinclude1 = require('gulp-file-include'),
      fileinclude2 = require('gulp-file-include');


gulp.task('fileinclude1', function() {
  return gulp.src(['../index-1.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest(['../']));
});

gulp.task("fileinclude2", function() {
  return gulp.src(['../Travel-Pages-Sub/index-2.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest(['../Travel-Pages-Sub']));
});

gulp.task('default', gulp.parallel('fileinclude1', 'fileinclude2'));
