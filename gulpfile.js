const gulp = require('gulp')
const babel = require('gulp-babel')
const watch = require('gulp-watch')

gulp.task('default', function () {
    return watch('src/*.js')
        .pipe(babel())
        .pipe(gulp.dest('dist/'))
})

gulp.task('build', function () {
    return gulp.src('src/*.js')
        .pipe(babel())
        .pipe(gulp.dest('dist/'))
})