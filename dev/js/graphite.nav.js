/*
 *  Graphite Mobile Navigation - v0.1.0
 *  A horizontal navigation plugin for mobile devices
 *  http://graphitedigital.com
 *
 *  dependencies: GSAP TweenMax JS
 *
 *  Made by Ben Simpson
 *  Under MIT License
 */
(function($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "graphiteNav",
        defaults = {
            disableGuides: false,
            activeClass: "active"
        };

    // The actual plugin constructor
    function GraphiteNav(element, options) {

        this.element = $(element);
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.is_dragging = false;
        this.current_position = 0;
        this.cursor_position = 0;
        this.centered_item = false;
        this.active = true;
        this.is_centering = true;
        this.list = this.element.children('ul');
        this.items = this.list.children('li');
        this.item_count = this.items.length;
        this.init();

    }

    $.extend(GraphiteNav.prototype, {
        /**
         * [init description]
         * @return {[type]} [description]
         */
        init: function() {

            var scope = this;

            this.bindUIActions();
            this.resizeOn();

            setTimeout(function() {
                scope.activeItem();
            }, 200);

        },
        /**
         * [bindUIActions description]
         * @return {[type]} [description]
         */
        bindUIActions: function() {

            this.element.on('mousewheel', $.proxy(this.onMouseScroll, this));
            this.element.on('mousedown touchstart', $.proxy(this.onDragStart, this));
            this.element.on('mousemove touchmove', $.proxy(this.onDrag, this));
            this.element.on('mouseup mouseleave touchend', $.proxy(this.onDragEnd, this));

        },
        /**
         * [unBindUIActions description]
         * @return {[type]} [description]
         */
        unBindUIActions: function() {

            this.element.off('mousedown mouseup mouseleave mousemove mousewheel touchstart touchend touchmove');

        },
        /**
         * [resizeOn description]
         * @return {[type]} [description]
         */
        resizeOn: function() {

            var activeItem = this.debounce(this.activeItem, 200);
            $(window).on('resize', $.proxy(activeItem, this));

        },
        /**
         * [resizeOff description]
         * @return {[type]} [description]
         */
        resizeOff: function() {

            $(window).off('resize');

        },
        /**
         * [listTooSmall description]
         * @return {[type]} [description]
         */
        listTooSmall: function() {

            var too_small = false;

            if (this.getCombinedItemWidth() < this.element.outerWidth()) {
                too_small = true;
                this.hideGuides();
                this.element.addClass('is--inactive');
                this.unBindUIActions();
            } else {
                this.element.removeClass('is--inactive');
                this.bindUIActions();
            }

            return too_small;

        },
        /**
         * [activeItem description]
         * @return {[type]} [description]
         */
        activeItem: function() {

            if (this.listTooSmall())
                return false;

            var item = (this.centered_item) ? this.centered_item : this.items.filter('.' + this.settings.activeClass);

            if (item.length === 0) {
                if (typeof console !== "undefined" || typeof console.warn !== "undefined")
                    console.warn('Graphite Nav: Cannot find active list element, please check your class name matches.');

                this.centerNavFallback();
                return false;
            }

            this.centerNav(item);

        },
        /**
         * Fallback if active list element class is missing.
         * @return {[type]} [description]
         */
        centerNav: function(item) {

            var item_width = item.outerWidth() / 2,
                item_pos = (item.position().left + item_width) - (this.element.outerWidth() / 2),
                distance = this.setLimits(item_pos);

            TweenMax.to(this.list, 0, {
                x: -distance,
                onComplete: this.setGuides,
                onCompleteScope: this
            });

        },
        /**
         * Fallback if active list element class is missing.
         * @return {[type]} [description]
         */
        centerNavFallback: function(disable_guides) {

            var element_width = this.element.width() / 2,
                list_width = this.list.outerWidth() / 2,
                position = list_width - element_width;

            TweenMax.to(this.list, 0, {
                x: -position,
                onComplete: function() {
                    if (!disable_guides)
                        this.setGuides();
                },
                onCompleteScope: this
            });

        },
        /**
         * [onMouseScroll description]
         * @param  {[type]} e [description]
         * @return {[type]}   [description]
         */
        onMouseScroll: function(e) {

            this.current_position = this.getMenuPosition();

            var scope = this,
                move = e.originalEvent.deltaX,
                scrolled = this.current_position - move,
                distance = this.setLimits(-scrolled);

            TweenMax.to(this.list, 0, {
                x: -distance
            });

            this.current_position = distance;
            e.preventDefault();

            clearTimeout($.data(this, 'timer'));
            $.data(this, 'timer', setTimeout(function() {
                scope.onDragEnd();
            }, 250));

        },
        /**
         * [toggleActive description]
         * @param  {[type]} e [description]
         * @return {[type]}   [description]
         */
        onDragStart: function(e) {

            this.is_dragging = true;
            this.current_position = this.getMenuPosition();
            this.cursor_position = this.getDevicePositionX(e.type === "mousedown", e);

        },
        /**
         * [onDragEnd description]
         * @param  {[type]} e [description]
         * @return {[type]}   [description]
         */
        onDragEnd: function(e) {

            this.dominantItem(e);
            this.is_dragging = false;

        },
        /**
         * [onDrag description]
         * @param  {[type]} e [description]
         * @return {[type]}   [description]
         */
        onDrag: function(e) {

            if (this.is_dragging === false)
                return false;

            this.drag(e);

        },
        /**
         * [drag description]
         * @param  {[type]} e [description]
         * @return {[type]}   [description]
         */
        drag: function(e) {

            var new_position = this.getDevicePositionX(e.type === "mousemove", e),
                move = Math.abs(this.current_position) + this.cursor_position - new_position,
                distance = this.setLimits(move);

            TweenMax.to(this.list, 0, {
                x: -distance
            });

        },
        /**
         * [setLimits description]
         * @param {[type]} distance [description]
         */
        setLimits: function(distance) {

            var parent_width = this.element.outerWidth(),
                child_width = this.list.outerWidth(),
                remaining = child_width - parent_width,
                buffer = 1;

            this.is_centering = true;

            if (distance < buffer) {
                distance = 0;
                this.is_centering = false;
            } else if (distance > (remaining - buffer)) {
                distance = remaining;
                this.is_centering = false;
            }

            return distance;

        },
        /**
         * [dominantItem description]
         * @param  {[type]} e [description]
         * @return {[type]}   [description]
         */
        dominantItem: function(e) {

            if (!this.is_centering) {
                this.setGuides();
                return false;
            }

            var current_position = this.getMenuPosition() - (this.element.outerWidth() / 2),
                count = this.item_count - 1,
                num = 1,
                closest_item;

            this.items.each(function(i, el) {
                var item = $(el),
                    item_area = item.position().left + item.outerWidth();

                if (Math.abs(current_position) <= item_area) {
                    closest_item = item;
                    return false;
                } else if (i === count) {
                    closest_item = item;
                }

                num++;
            });

            this.centered_item = closest_item;

            if (num !== 0 && num !== this.item_count)
                this.autoCentering(closest_item, num);

        },
        /**
         * [centering description]
         * @param  {[type]} item [description]
         * @return {[type]}      [description]
         */
        autoCentering: function(item, num) {

            // calculate centering
            var element_width = this.element.outerWidth(),
                element_half_width = element_width / 2,
                item_half_width = item.outerWidth() / 2,
                move = -item.position().left + element_half_width - item_half_width;

            // set right limit
            var list_width = this.list.outerWidth(),
                item_center = item.position().left + item_half_width,
                list_width_remaining = list_width - item_center,
                limit = list_width - element_width;

            if (move > 0)
                move = 0;
            else if (list_width_remaining < element_half_width)
                move = -limit;

            TweenMax.to(this.list, 0.5, {
                x: move,
                ease: Power4.easeOut,
                onComplete: this.setGuides,
                onCompleteScope: this
            });

        },
        /**
         * [guides description]
         * @return {[type]} [description]
         */
        setGuides: function() {

            if (this.settings.disableGuides)
                return false;

            var parent_width = this.element.width(),
                list_position = Math.abs(this.getMenuPosition()),
                buffer = {
                    left: 20,
                    right: 40
                },
                showing = {
                    left: {
                        active: false,
                        element: false
                    },
                    right: {
                        active: false,
                        element: false
                    }
                };

            this.items.each(function(i, el) {
                var item = $(el),
                    item_left = item.position().left + buffer.left,
                    item_right = ((item_left + item.outerWidth()) - list_position) - buffer.right;

                if (item_left < list_position) {
                    showing.left.element = i;
                    showing.left.active = true;
                } else if (item_right > parent_width) {
                    showing.right.element = i;
                    showing.right.active = true;
                }
            });

            if (showing.left.active)
                this.element.addClass('has--prev');
            else
                this.element.removeClass('has--prev');

            if (showing.right.active)
                this.element.addClass('has--next');
            else
                this.element.removeClass('has--next');

        },
        /**
         * [getCombinedItemWidth description]
         * @return {[type]} [description]
         */
        getCombinedItemWidth: function() {

            var width = 0;

            this.items.each(function(i, item) {
                width += $(item).outerWidth();
            });

            return width;

        },
        /**
         * [showGuides description]
         * @return {[type]} [description]
         */
        showGuides: function() {

            this.element.addClass('has--prev');
            this.element.addClass('has--next');

        },
        /**
         * [hideGuides description]
         * @return {[type]} [description]
         */
        hideGuides: function() {

            this.element.removeClass('has--prev');
            this.element.removeClass('has--next');

        },
        /**
         * [getMenuPosition description]
         * @return {[type]} [description]
         */
        getMenuPosition: function() {

            return parseInt(this.list.css('transform').split(',')[4]);

        },
        /**
         * [getDevicePositionX description]
         * @param  {[type]} test [description]
         * @return {[type]}      [description]
         */
        getDevicePositionX: function(is_desktop, e) {

            return (is_desktop) ? e.pageX : e.originalEvent.touches[0].pageX;

        },
        /**
         * [debounce description]
         * @param  {[type]} func      [description]
         * @param  {[type]} wait      [description]
         * @param  {[type]} immediate [description]
         * @return {[type]}           [description]
         */
        debounce: function(func, wait, immediate) {
            var timeout;
            return function() {
                var context = this,
                    args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };

        }
    });

    $.fn.graphiteNav = function(options) {

        return this.each(function() {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new GraphiteNav(this, options));
            }
        });

    };

})(jQuery, window, document);
