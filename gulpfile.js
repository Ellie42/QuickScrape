let gulp = require('gulp');
let babel = require('gulp-babel');
let concat = require('gulp-concat');
let sass = require('gulp-sass');

gulp.task('content', () => {
    let bp = 'src/content/**';
    return gulp.src([
        `src/common/**/*.js`,
        `${bp}/*.js`,
        `src/content.js`,
    ], {ignoreInitial: false})
        .pipe(babel())
        .pipe(concat("content.js"))
        .pipe(gulp.dest('js'));
});

gulp.task('background', () => {
    let bp = 'src/background/**';
    return gulp.src([
        `src/common/**/*.js`,
        `${bp}/*.js`,
        `src/background.js`,
    ], {ignoreInitial: false})
        .pipe(babel())
        .pipe(concat("background.js"))
        .pipe(gulp.dest('js'));
});

gulp.task('scss', () => {
    return gulp.src("src/scss/style.scss")
        .pipe(sass()).pipe(gulp.dest("css"));
});

gulp.task("watch", () => {
    gulp.run("content");
    gulp.run("background");
    gulp.run("scss");
    gulp.watch("src/scss/**/*", ["scss"]);
    gulp.watch("src/common/**/*", ["background", "content"]);
    gulp.watch("src/background/**/*", ["background"]);
    return gulp.watch("src/content/**/*", ["content"]);
});
