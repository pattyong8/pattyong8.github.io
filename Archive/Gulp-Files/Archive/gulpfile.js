const gulp = require("gulp");
var   fileinclude = require('gulp-file-include'),
      fileinclude1 = require('gulp-file-include'),
      fileinclude2 = require('gulp-file-include');


gulp.task('fileinclude1', function() {
  return gulp.src(['./build/index-1.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest(['../../Travel-Pages/20s']));
});

gulp.task("fileinclude2", function() {
  return gulp.src(['./build/index-2.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest(['../../Travel-Pages/20s']));
});

gulp.task('default', gulp.parallel('fileinclude1', 'fileinclude2'));
