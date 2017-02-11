'use strict';

let gulp = require('gulp');
let sass = require('gulp-sass');
let gutil = require( 'gulp-util' );
let ftp = require( 'vinyl-ftp' );

let concat = require('gulp-concat');
let browserSync = require('browser-sync').create();
let reload = browserSync.reload;


gulp.task('styles', () => {
    gulp.src('./style/scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./style/css/'));
});


gulp.task('browser', () => {
	browserSync.init({
		server:  {
			baseDir: './'
		}
	});
});

gulp.task('default', ['browser'],() => {
	gulp.watch('./style/scss/**/*.scss',['styles']);
	gulp.watch('./style/css/**/*.css',reload);
	gulp.watch('./js/*.js',reload);
	gulp.watch('./**/*.html', reload);
});

gulp.task( 'deploy', function() {

	var conn = ftp.create( {
	    host:     'ftp.ppy2wong.com',
	    user:     'ppy2wong',
	    password: 'Kungfury573%',
	    parallel: 10,
	    log: gutil.log
	} );

	var globs = [
	    'html/**',
	    'images/**',
	    'js/**',
	    'style/**',
	    'index.html'
	];


	return gulp.src( globs, { cwd: './', buffer: false } )
	    .pipe( conn.newer( '/public_html/js/finalProject' ) ) 
	    .pipe( conn.dest( '/public_html/js/finalProject' ) );

} );
