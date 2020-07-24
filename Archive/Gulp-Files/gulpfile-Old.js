const fileinclude = require('gulp-file-include');
const gulp = require('gulp');

async function includeHTML(){
  console.info("Gulp is Here");
}

gulp.task('fileinclude', function() {
  gulp.src(['./index.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest('./'));
});

exports.default = includeHTML;

--------------------------- does not work, only runs the bottom one
const fileinclude = require('gulp-file-include');
const gulp = require('gulp');

async function includeHTML(){
  gulp.src(['../index-1.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest(['../']));
}

async function includeHTML(){
  gulp.src(['../Travel-Pages-Sub/index-2.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest(['../Travel-Pages-Sub']));
}

exports.default = includeHTML;

------------------- Works for footer, header, and index
const gulp        = require('gulp');
const fileinclude = require('gulp-file-include');

const paths = {
  scripts: {
    src: './',
    dest: './build/'
  }
};

async function includeHTML(){
  return gulp.src([
    '*.html',
    '!header.html', // ignore
    '!footer.html' // ignore
    ])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest(paths.scripts.dest));
}

exports.default = includeHTML;
