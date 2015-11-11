;(function($) {

 	"use strict";

	/**
	 * NumIn plugin
	 * @param  {Object} element HTML/jQuery element
	 * @param  {Object} options (see Plugin.prototype.defaults object)
	 * @return {Void}
	 */
	var Plugin = function(element, options) {
		// empty arguments
		element = element || {};
		options = options || {};

		// init once
		if ($(element).data("jquery.numin")) {
			return;
		}

		// only input and textarea elements
		if ( ! $(element).is('input,textarea')) {
			return;
		}

		// define variables
		this.attrs     = {};
		this.options   = $.extend({}, options);
		this.$element  = $(element);
		this.$parent   = $(false);
		this.$valmin   = $(false);
		this.$valmax   = $(false);
		this.$increase = $(false);
		this.$decrease = $(false);

		// initialize
		this.init();
	}

	/**
	 * NumIn plugin prototype
	 * @type {Object}
	 */
	Plugin.prototype = {

		/**
		 * NumIn plugin default options
		 * @type {Object}
		 */
		defaults: {
			value: 1,
			min: null,
			max: null,
			step: 1,
			decimals: 0,
			//format: "to do!!!",
			keybind: true,
			touch: true,
			parent: null,
			template: '<div class="input-group numin-wrapper"><span class="input-group-btn numin-btn-wrapper"><button class="btn btn-default numin-trigger-decrease" type="button">-</button></span><element /><span class="input-group-btn numin-btn-wrapper"><button class="btn btn-default numin-trigger-increase" type="button">+</button></span></div>'
		},

		/**
		 * Initial attributes
		 * @return {Void}
		 */
		_attrs: function() {
			this.attrs = {}
			var attrs = this.$element.get(0).attributes;
			for (var i = 0; i < attrs.length; i++) {
				this.attrs[attrs[i].name] = attrs[i].value;
			}

			this.$element.removeAttr("min");
			this.$element.removeAttr("max");
			this.$element.removeAttr("step");
			this.$element.removeAttr("type");

			if (this.$element.is("input")) {
				this.$element.attr("type", "text");
			}
		},

		/**
		 * Fix this.options
		 * @return {Void}
		 */
		_options: function() {
			// inherit from attrs
			for (var key in this.defaults) {
				if (this.options[key] === undefined && this.attrs[key]                 !== undefined) this.options[key] = this.attrs[key];
				if (this.options[key] === undefined && this.attrs["data-numin-" + key] !== undefined) this.options[key] = this.attrs["data-numin-" + key];
			}

			// delete invalid options
			for (var key in this.options) {
				if ( ! (key in this.defaults)) {
					delete this.options[key];
				}
			}

			// numeric values
			this.options.value    = this.options.value*1;
			this.options.min      = this.options.min*1;
			this.options.max      = this.options.max*1;
			this.options.step     = this.options.step*1;
			this.options.decimals = this.options.decimals*1;

			// clear non-numeric values
			if (isNaN(this.options.value))    this.options.value    = undefined;
			if (isNaN(this.options.min))      this.options.min      = undefined;
			if (isNaN(this.options.max))      this.options.max      = undefined;
			if (isNaN(this.options.step))     this.options.step     = undefined;
			if (isNaN(this.options.decimals)) this.options.decimals = undefined;

			// extend with defaults
			this.options = $.extend({}, this.defaults, this.options);

			// fix step
			if (this.options.step == 0) this.options.step = this.defaults.step;

			// fix decimals
			var dec = (this.options.step.toString().split(".")[1] || 0).length;
			if (this.options.decimals < 0)   this.options.decimals = this.defaults.decimals;
			if (this.options.decimals < dec) this.options.decimals = dec;
		},

		/**
		 * Create template (wrap element) or use options.parent
		 * @return {Void}
		 */
		_create: function() {
			// disabled on touch devices
			if (("ontouchstart" in window || navigator.msMaxTouchPoints) && ( ! this.options.touch)) {
				return;
			}

			// get parent from options.parent
			if ( ! this.$parent.length) {
				this.$parent = this.$element.closest(this.options.parent);
			}

			// create parent from template
			if ( ! this.$parent.length) {
				this.$parent = $(this.options.template)
					.insertBefore(this.$element);

				var $el = this.$parent.find("element").first();

				this.$element
					.data("jquery.numin", this)
					.removeClass("numin")
					.addClass("numin")
					.val(this.options.value)
					.detach()
					.insertAfter($el);

				$el.remove();

				this.options.parent = null;
			}

			this.$valmin   = this.$parent.find(".numin-trigger-valmin");
			this.$valmax   = this.$parent.find(".numin-trigger-valmax");
			this.$increase = this.$parent.find(".numin-trigger-increase");
			this.$decrease = this.$parent.find(".numin-trigger-decrease");

			this._disable(this.$valmin, this.options.min === undefined);
			this._disable(this.$valmax, this.options.max === undefined);
		},

		/**
		 * Bind events
		 * @return {Void}
		 */
		_bind: function() {
			var that = this;

			this.$valmin
				.on("click.numin", function(e) { that._handleValMinClick.call(that, this, e); });
			this.$valmax
				.on("click.numin", function(e) { that._handleValMaxClick.call(that, this, e); });

			this.$decrease
				.on("click.numin", function(e) { that._handleDecreaseClick.call(that, this, e); });
			this.$increase
				.on("click.numin", function(e) { that._handleIncreaseClick.call(that, this, e); });

			this.$element
				.on("focus.numin", function(e) { that._handleFocus.call(that, this, e); })
				.on("keydown.numin" , function(e) { that._handleKeydown.call(that, this, e); })
				.on("change.numin", function(e) { that._handleChange.call(that, this, e); });
		},

		/**
		 * Handle valmin click
		 * @param  {Object} o this object
		 * @param  {Object} e event object
		 * @return {Void}
		 */
		_handleValMinClick: function(o,e) {
			if ( ! $(o).hasClass("disabled")) {
				this.valmin();
				this.$element.focus();

			}
		},

		/**
		 * Handle valmax click
		 * @param  {Object} o this object
		 * @param  {Object} e event object
		 * @return {Void}
		 */
		_handleValMaxClick: function(o,e) {
			if ( ! $(o).hasClass("disabled")) {
				this.valmax();
				this.$element.focus();
			}
		},

		/**
		 * Handle decrease click
		 * @param  {Object} o this object
		 * @param  {Object} e event object
		 * @return {Void}
		 */
		_handleDecreaseClick: function(o,e) {
			if ( ! $(o).hasClass("disabled")) {
				this.decrease();
				this.$element.focus();
			}
		},

		/**
		 * Handle increase click
		 * @param  {Object} o this object
		 * @param  {Object} e event object
		 * @return {Void}
		 */
		_handleIncreaseClick: function(o,e) {
			if ( ! $(o).hasClass("disabled")) {
				this.increase();
				this.$element.focus();
			}
		},

		/**
		 * Handle element focus
		 * @param  {Object} o this object
		 * @param  {Object} e event object
		 * @return {Void}
		 */
		_handleFocus: function(o,e) {
			$(o).select();
		},

		/**
		 * Handle element keydown
		 * @param  {Object} o this object
		 * @param  {Object} e event object
		 * @return {Void}
		 */
		_handleKeydown: function(o,e) {
			if (this.options.keybind) {
				if      (e.which == 38 && ! e.altKey &&  ! e.ctrlKey) this._handleIncreaseClick();
				else if (e.which == 38 && ! e.altKey && !! e.ctrlKey) this._handleValMaxClick();
				else if (e.which == 40 && ! e.altKey &&  ! e.ctrlKey) this._handleDecreaseClick();
				else if (e.which == 40 && ! e.altKey && !! e.ctrlKey) this._handleValMinClick();
			}
		},

		/**
		 * Handle element change
		 * @param  {Object} o this object
		 * @param  {Object} e event object
		 * @return {Void}
		 */
		_handleChange: function(o,e) {
			// validate
			if ( ! this._validate_num())  return;
			if ( ! this._validate_dec())  return;
			if ( ! this._validate_min())  return;
			if ( ! this._validate_max())  return;
			if ( ! this._validate_step()) return;

			// set value
			this.options.value = this.$element.val();

			// disable buttons
			this._disable(this.$decrease, this.options.min !== undefined && this.$element.val()*1 <= this.options.min);
			this._disable(this.$increase, this.options.max !== undefined && this.$element.val()*1 >= this.options.max);
		},

		/**
		 * Validate numetic value
		 * @return {Boolean}
		 */
		_validate_num: function() {
			if (isNaN(this.$element.val()*1)) {
				this.$element
					.val(this.options.value || 0)
					.trigger("change.numin");

				return false;
			}

			return true;
		},

		/**
		 * Validate decimal value
		 * @return {Boolean}
		 */
		_validate_dec: function() {
			if (this.$element.val()+"" !== (this.$element.val()*1).toFixed(this.options.decimals)+"") {
				this.$element
					.val((this.$element.val()*1).toFixed(this.options.decimals)+"")
					.trigger("change.numin");

				return false;
			}

			return true;
		},

		/**
		 * Validate min value
		 * @return {Boolean}
		 */
		_validate_min: function() {
			if (this.options.min !== null && this.$element.val()*1 < this.options.min) {
				this.$element
					.val(this.options.min)
					.trigger("change.numin");

				return false;
			}

			return true;
		},

		/**
		 * Validate max value
		 * @return {Boolean}
		 */
		_validate_max: function() {
			if (this.options.max !== null && this.$element.val()*1 > this.options.max) {
				this.$element
					.val(this.options.max)
					.trigger("change.numin");

				return false;
			}

			return true;
		},

		/**
		 * Validate step value
		 * @return {Boolean}
		 */
		_validate_step: function() {
			// nothing to do here?

			return true;
		},

		/**
		 * Disable element
		 * @param  {Object}  el  jQuery object
		 * @param  {Boolean} val value
		 * @return {Void}
		 */
		_disable: function(el, val) {
			$(el).each(function() {
				if ($(this).is("button,input")) {
					$(this).removeAttr("disabled");
					if ( !! val) $(this).attr("disabled", "disabled");
				}
				else {
					$(this).removeClass("disabled");
					if ( !! val) $(this).addClass("disabled");
				}
			});
		},

		/**
		 * Constructor
		 * @return {Void}
		 */
		init: function() {
			this._attrs();
			this._options();
			this._create();
			this._bind();

			this.$element
				.data("jquery.numin", this)
				.trigger("change.numin");
		},

		/**
		 * Destructor
		 * @return {Void}
		 */
		destroy: function() {
			// remove plugin from element
			this.$element
				.unbind(".numin")
				.removeClass("numin")
				.removeData("jquery.numin");

			// append removed attributes
			for (var key in this.attrs) {
				if (this.$element.attr(key) === undefined && this.attrs[key] !== undefined && key != "value" && key.substr(0,5) != "data-") {
					this.$element.attr(key, this.attrs[key]);
				}
			}
			if (this.attrs.type) {
				this.$element.attr("type", this.attrs.type);
			}

			// remove parent
			if ( ! this.options.parent) {
				this.$element
					.detach()
					.insertAfter(this.$parent)

				this.$parent
					.remove();
			}

			// clear variables
			this.attrs     = undefined;
			this.options   = undefined;
			this.$element  = undefined;
			this.$parent   = undefined;
			this.$valmin   = undefined;
			this.$valmax   = undefined;
			this.$decrease = undefined;
			this.$increase = undefined;
		},

		/**
		 * Get/set input value
		 * @param  {Mixed} val
		 * @return {Mixed}
		 */
		value: function(val) {
			if (val === undefined) {
				this.$element
					.val(val)
					.trigger("change.numin");
			}
			else {
				return this.options.value;
			}
		},

		/**
		 * Set min value
		 * @return {Void}
		 */
		valmin: function() {
			if (this.options.min !== undefined) {
				this.$element
					.val(this.options.min)
					.trigger("change.numin");
			}
		},

		/**
		 * Set max value
		 * @return {Void}
		 */
		valmax: function() {
			if (this.options.max !== undefined) {
				this.$element
					.val(this.options.max)
					.trigger("change.numin");
			}
		},

		/**
		 * Decrease element value
		 * @return {Void}
		 */
		decrease: function() {
			this.$element
				.val(this.$element.val()*1 - this.options.step)
				.trigger("change.numin");
		},

		/**
		 * Increase element value
		 * @return {Void}
		 */
		increase: function() {
			this.$element
				.val(this.$element.val()*1 + this.options.step)
				.trigger("change.numin");
		}
	}

	/**
	 * jQuery NumIn plugin
	 * @param  {Object} options (see Plugin.prototype.defaults object)
	 * @return {Object}         jQuery collection
	 */
	$.fn.numin = function(options) {
		var arg = arguments;
		var obj = this;
		var val = this;

		$(this).each(function() {
			var plugin = $(this).data('jquery.numin');

			if ( ! plugin) {
				plugin = new Plugin(this, options);
			}
			if (plugin && typeof(options) === 'string' && typeof(plugin[options]) === 'function' && options.substr(0, 1) != '_') {
				val = plugin[options].apply(plugin, Array.prototype.slice.call(arg, 1));
			}
		});

		return val || obj;
	}

	/**
	 * Plugin as global class
	 * @type {Object}
	 */
	window.numin = Plugin;

	// autoiniti
	$(document).ready(function(e) {
		$("[data-numin-autoinit]").numin();
	});

})(jQuery);
