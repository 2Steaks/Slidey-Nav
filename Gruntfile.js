module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        asset_path: 'dist',

        sass: {
            dev: {
                options: {
                    outputStyle: 'expanded'
                },
                files: [{
                    expand: true,
                    cwd: 'dev/scss',
                    src: ['**/*.scss'],
                    dest: '<%= asset_path %>/css/',
                    ext: '.nav.css'
                }]
            },
            dist: {
                options: {
                    outputStyle: 'compressed',
                    sourcemap: 'none'
                },
                files: [{
                    expand: true,
                    cwd: 'dev/scss',
                    src: ['**/*.scss'],
                    dest: '<%= asset_path %>/css/',
                    ext: '.nav.min.css'
                }]
            }
        },

        jshint: {
            files: ['dev/js/**/*.js']
        },

        concat: {
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %> */',
            },
            main: {
                src: ['dev/js/**/*.js'],
                dest: '<%= asset_path %>/js/slideynav.nav.js',
            },
        },

        uglify: {
            dist: {
                files: {
                    '<%= asset_path %>/js/slideynav.min.js': ['<%= asset_path %>/js/slideynav.js']
                }
            }
        },

        watch: {
            js: {
                options: {
                    livereload: true
                },
                files: ['dev/js/**/*.js'],
                tasks: ['jshint', 'concat:main']
            },
            sass: {
                options: {
                    livereload: true
                },
                files: ['dev/scss/**/*.scss'],
                tasks: ['sass:dev']
            }
        }
    });

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.registerTask('default', ['sass:dev', 'jshint', 'concat:main', 'watch']);
    grunt.registerTask('dist', ['sass:dist', 'jshint', 'concat:main', 'uglify:dist']);
};
