var
	gulp = require('gulp'),
	jshint = require('gulp-jshint'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	less = require('gulp-less'),
	autoprefixer = require('gulp-autoprefixer'),
	image = require('gulp-image'),
	browserSync = require('browser-sync'),
	del = require('del'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	wiredep = require('wiredep').stream,
	proxyMiddleware = require('http-proxy-middleware'),
	lessPluginCleanCSS = require('less-plugin-clean-css'),
	minifyCSS = require('gulp-minify-css'),

	jsPath = "app/scripts/**/*.js",
	lessPath = "app/less/*.less",
	imagePath = "app/image/**/*",
	htmlPath = "app/*.html",
	cleancss = new lessPluginCleanCSS({
		advanced: true
	})


const $ = gulpLoadPlugins()
const reload = browserSync.reload

gulp.task('clean', del.bind(null, ['dist']));

gulp.task('lint', function() {
	return gulp.src(jsPath)
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
})

gulp.task('less', function() {
	return gulp.src(lessPath)
		.pipe(less({
			plugins: [cleancss]
		}))
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(minifyCSS())
		.pipe(gulp.dest('.tmp/css'))
		.pipe(gulp.dest('dist/css'))
})

gulp.task('scripts', function() {
	return gulp.src(jsPath)
		.pipe($.uglify())
		.pipe(gulp.dest('.tmp/scripts'))
		.pipe(gulp.dest('dist/scripts'))
})

gulp.task('images', function() {
	return gulp.src(imagePath)
		.pipe($.if($.if.isFile, $.cache($.imagemin({
				progressive: true,
				interlaced: true,
				svgoPlugins: [{
					cleanupIDs: false
				}]
			}))
			.on('error', function(err) {
				console.log(err);
				this.end();
			})))
		.pipe(gulp.dest('dist/images'));
})

gulp.task('imagemin', function() {
	return gulp.src(imagePath)
		.pipe(image())
		.pipe(gulp.dest('app/image'));

})

gulp.task('html', ['less', 'scripts'], function() {
	const assets = $.useref.assets({
		searchPath: ['.tmp', 'app', '.']
	});

	return gulp.src(htmlPath)
		.pipe(assets)
		.pipe($.if('*.js', $.uglify()))
		.pipe($.if('*.css', $.minifyCss({
			compatibility: '*'
		})))
		.pipe(assets.restore())
		.pipe($.useref())
		.pipe($.if('*.html', $.minifyHtml({
			conditionals: true,
			loose: true
		})))
		.pipe(gulp.dest('dist'));
})

gulp.task('wiredep', function() {

	gulp.src(htmlPath)
		.pipe(wiredep({}))
		.pipe(gulp.dest('app'));
})

gulp.task('serve', function() {
	browserSync({
		notify: false,
		port: 9000,
		server: {
			baseDir: ['.tmp', 'app'],
			routes: {
				'/bower_components': 'bower_components'
			},
			middleware: [

			]
		}
	})

	gulp.watch([
		htmlPath,
		jsPath,
		lessPath,
		imagePath
	]).on('change', reload);

	gulp.watch(lessPath, ['less']);
	gulp.watch(jsPath, ['scripts']);
	gulp.watch('bower.json', ['wiredep']);
})

gulp.task('extras', function() {
	return gulp.src([
		'app/*.*',
		'!app/*.html'
	], {
		dot: true
	}).pipe(gulp.dest('dist'))
})

gulp.task('build', ['clean', 'html', 'images', 'extras'], function() {
	return gulp.src('dist/**/*').pipe($.size({
		title: 'build',
		gzip: true
	}))
})