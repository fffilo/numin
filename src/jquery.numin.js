;(function($) {

 	"use strict";

	/**
	 * Numeric Input plugin
	 * @param  {Object} element HTML/jQuery element
	 * @param  {Object} options (see Plugin.prototype._defaults object)
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

		// only input[type="numeric"]
		if ( ! $(element).is('input[type="number"]')) {
			return;
		}

		// define jQuery elements
		this.$element  = $(element);
		this.$clone    = $(false);
		this.$parent   = $(false);
		this.$minify   = $(false);
		this.$maxify   = $(false);
		this.$increase = $(false);
		this.$decrease = $(false);

		// atributes (reset it on destroy method)
		this.attrs = {
			value:     this.$element.val(),
			min:       this.$element.attr("min")       || null,
			max:       this.$element.attr("max")       || null,
			step:      this.$element.attr("step")      || null,
			maxlength: this.$element.attr("maxlength") || null
		};

		// options
		this.options = options;

		// initialize
		this.init();
	}

	/**
	 * Numeric Input plugin prototype
	 * @type {Object}
	 */
	Plugin.prototype = {

		/**
		 * Numeric Input plugin default options
		 * @type {Object}
		 */
		_defaults: {
			value: null,
			min: null,
			max: null,
			step: 1,
			stepBig: null,
			decimals: "",
			decimalSeparator: ".",
			thousandSeparator: "",
			format: "{val}",
			keyBind: true,
			touch: true,
			template: '<div class="input-group numin-wrapper"><span class="input-group-btn numin-btn-wrapper"><button class="btn btn-default numin-trigger-decrease" type="button">-</button></span><input class="numin numin-clone form-control" type="text" value="" /><span class="input-group-btn numin-btn-wrapper"><button class="btn btn-default numin-trigger-increase" type="button">+</button></span></div>'
		},

		/**
		 * Fix this.options
		 * @return {Void}
		 */
		_options: function() {
			// inherit from this.attrs
			for (var key in this.attrs) {
				if (this.options[key] === undefined && this.attrs[key] !== null) {
					this.options[key] = this.attrs[key];
				}
			}

			// inherit from element data attributes
			for (var key in this._defaults) {
				var akey = "data-numin-" + key.replace(/[A-Z]/g, function(m) { return "-" + m.toLowerCase(); });

				if (this.options[key] === undefined && this.$element.attr(akey) !== undefined) {
					this.options[key] = this.$element.attr(akey);
				}
			}

			// delete invalid options
			for (var key in this.options) {
				if ( ! (key in this._defaults)) {
					delete this.options[key];
				}
			}

			// extend with _defaults
			this.options = $.extend({}, this._defaults, this.options);

			// fix init values
			this.value(this.options.value);
			this.min(this.options.min);
			this.max(this.options.max);
			this.step(this.options.step);
			this.stepBig(this.options.stepBig);
			this.decimals(this.options.decimals);
			this.decimalSeparator(this.options.decimalSeparator);
			this.thousandSeparator(this.options.thousandSeparator);
			this.format(this.options.format);
			this.keyBind(this.options.keyBind);
			this.options.touch = !! this.options.touch;
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

			// create parent from template
			this.$parent = $(this.options.template)
				.insertBefore(this.$element);

			// html elements
			this.$clone       = this.$parent.find(".numin-clone");
			this.$minify      = this.$parent.find(".numin-trigger-minify");
			this.$maxify      = this.$parent.find(".numin-trigger-maxify");
			this.$increase    = this.$parent.find(".numin-trigger-increase");
			this.$increaseBig = this.$parent.find(".numin-trigger-increase-big");
			this.$decrease    = this.$parent.find(".numin-trigger-decrease");
			this.$decreaseBig = this.$parent.find(".numin-trigger-decrease-big");

			// hide $element
			this.$element
				.detach()
				.insertBefore(this.$clone)
				.css("display", "none");
		},

		/**
		 * Bind events
		 * @return {Void}
		 */
		_bind: function() {
			var that = this;

			this.$minify
				.on("click.numin",    function(e) { return that._handleMinifyClick.call(that, this, e); });
			this.$maxify
				.on("click.numin",    function(e) { return that._handleMaxifyClick.call(that, this, e); });

			this.$decrease
				.on("click.numin",    function(e) { return that._handleDecreaseClick.call(that, this, e); });
			this.$decreaseBig
				.on("click.numin",    function(e) { return that._handleDecreaseBigClick.call(that, this, e); });
			this.$increase
				.on("click.numin",    function(e) { return that._handleIncreaseClick.call(that, this, e); });
			this.$increaseBig
				.on("click.numin",    function(e) { return that._handleIncreaseBigClick.call(that, this, e); });

			this.$element
				.on("focus.numin",    function(e) { return that._handleFocus.call(that, this, e); })
				.on("keydown.numin" , function(e) { return that._handleKeydown.call(that, this, e); })
				.on("change.numin",   function(e) { return that._handleElementChange.call(that, this, e); });

			this.$clone
				.on("focus.numin",    function(e) { return that._handleFocus.call(that, this, e); })
				.on("keydown.numin" , function(e) { return that._handleKeydown.call(that, this, e); })
				.on("change.numin",   function(e) { return that._handleCloneChange.call(that, this, e); });
		},

		/**
		 * Handle minify click
		 * @param  {Object}  o this object
		 * @param  {Object}  e event object
		 * @return {Boolean}
		 */
		_handleMinifyClick: function(o,e) {
			this.minify();
			this.$clone.focus();

			return false;
		},

		/**
		 * Handle maxify click
		 * @param  {Object}  o this object
		 * @param  {Object}  e event object
		 * @return {Boolean}
		 */
		_handleMaxifyClick: function(o,e) {
			this.maxify();
			this.$clone.focus();

			return false;
		},

		/**
		 * Handle decrease click
		 * @param  {Object}  o this object
		 * @param  {Object}  e event object
		 * @return {Boolean}
		 */
		_handleDecreaseClick: function(o,e) {
			this.decrease();
			this.$clone.focus();

			return false;
		},

		/**
		 * Handle decreaseBig click
		 * @param  {Object}  o this object
		 * @param  {Object}  e event object
		 * @return {Boolean}
		 */
		_handleDecreaseBigClick: function(o,e) {
			this.decreaseBig();
			this.$clone.focus();

			return false;
		},

		/**
		 * Handle increase click
		 * @param  {Object}  o this object
		 * @param  {Object}  e event object
		 * @return {Boolean}
		 */
		_handleIncreaseClick: function(o,e) {
			this.increase();
			this.$clone.focus();

			return false;
		},

		/**
		 * Handle increaseBig click
		 * @param  {Object}  o this object
		 * @param  {Object}  e event object
		 * @return {Boolean}
		 */
		_handleIncreaseBigClick: function(o,e) {
			this.increaseBig();
			this.$clone.focus();

			return false;
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
			if (this.options.keyBind) {
				// e.which -> 38 up, 40 down, 33 pgup, 34 pgdown, 36 home, 35 end
				if      (e.which == 38 && ! e.altKey &&  ! e.ctrlKey && ! e.shiftKey) return this._handleIncreaseClick();
				else if (e.which == 40 && ! e.altKey &&  ! e.ctrlKey && ! e.shiftKey) return this._handleDecreaseClick();
				else if (e.which == 33 && ! e.altKey &&  ! e.ctrlKey && ! e.shiftKey) return this._handleIncreaseBigClick();
				else if (e.which == 34 && ! e.altKey &&  ! e.ctrlKey && ! e.shiftKey) return this._handleDecreaseBigClick();
				else if (e.which == 35 && ! e.altKey && !! e.ctrlKey && ! e.shiftKey) return this._handleMaxifyClick();
				else if (e.which == 36 && ! e.altKey && !! e.ctrlKey && ! e.shiftKey) return this._handleMinifyClick();
			}
		},

		/**
		 * Handle element change
		 * @param  {Object} o this object
		 * @param  {Object} e event object
		 * @return {Void}
		 */
		_handleElementChange: function(o,e) {
			// set option value
			this.options.value = $(o).val()*1 || 0;

			// set format
			this._handleCloneChange(this.$clone.val(this.options.value+""));
		},

		/**
		 * Handle clone element change
		 * @param  {Object} o this object
		 * @param  {Object} e event object
		 * @return {Void}
		 */
		_handleCloneChange: function(o,e) {
			// not initialized
			if ( ! $(o).length) {
				return;
			}

			// get and validate value
			var val = this._validate($(o).val());
			if (this.options.min !== null && val*1 < this.options.min) val = this.options.min+"";
			if (this.options.max !== null && val*1 > this.options.max) val = this.options.max+"";

			// split
			var arr = val.split(".");
			var tho = arr[0] || 0;
			var dec = arr[1] || 0;

			// thounsand separator (append default ,)
			var sp1 = tho.toString().split("").reverse().join("").match(/.{1,3}/g).join(",").split('').reverse().join('').replace("-,", "-");

			// decimal separator (append default .)
			var sp0 = dec ? "." + dec : "";

			// class attribute
			this.$parent
				.removeClass("numin-value-positive")
				.removeClass("numin-value-negative")
				.removeClass("numin-value-zero")
				.removeClass("numin-value-one")
				.removeClass("numin-value-min")
				.removeClass("numin-value-max")
				.addClass(val  > 0                ? "numin-value-positive" : "numin-noclass_")
				.addClass(val  < 0                ? "numin-value-negative" : "numin-noclass_")
				.addClass(val == 0                ? "numin-value-zero"     : "numin-noclass_")
				.addClass(val == 1                ? "numin-value-one"      : "numin-noclass_")
				.addClass(val == this.options.min ? "numin-value-min"      : "numin-noclass_")
				.addClass(val == this.options.max ? "numin-value-max"      : "numin-noclass_")
				.removeClass("numin-noclass_");

			// format value
			var str = ""
				+ sp1.replace(new RegExp("\\,", "g"), this.options.thousandSeparator)
				+ sp0.replace(new RegExp("\\.", "g"), this.options.decimalSeparator);
			str = this.options.format.replace(/\{val\}/g, str);
			this.$clone.val(str);

			// set value
			if (val*1 !== this.$element.val()*1) {
				this.$element
					.val(val+"")
					.trigger("change");
			}
		},

		/**
		 * Validate value
		 * @param  {Numeric} val
		 * @return {Numeric}
		 */
		_validate: function(val) {
			val = val.toString();
			if (this.options.thousandSeparator) val = val.replace(new RegExp("\\" + this.options.thousandSeparator, "g"), "");
			if (this.options.decimalSeparator)  val = val.replace(new RegExp("\\" + this.options.decimalSeparator,  "g"), ".");

			val = parseFloat(val);

			if (isNaN(val)) val = this.$element.val()*1 || 0;
			if (this.options.min !== null && val < this.options.min) val = this.options.min;
			if (this.options.max !== null && val > this.options.max) val = this.options.max;

			if ( ! isNaN(parseInt(this.options.decimals))) {
				val = Math.round(val * Math.pow(10, this.options.decimals)) / Math.pow(10, this.options.decimals);
				val = val.toFixed(this.options.decimals);
			}

			return val+"";
		},

		/**
		 * Constructor
		 * @return {Void}
		 */
		init: function() {
			this._options();
			this._create();
			this._bind();

			this.$element
				.data("jquery.numin", this)
				.removeAttr("maxlength")
				.removeAttr("min")
				.removeAttr("max")
				.attr("step", "any")
				.removeClass("numin")
				.removeClass("numin-element")
				.addClass("numin")
				.addClass("numin-element")
				.val(this.options.value)
				.trigger("change");
		},

		/**
		 * Destructor
		 * @return {Void}
		 */
		destroy: function() {
			// remove plugin from element
			this.$element
				.removeAttr("maxlength")
				.removeAttr("min")
				.removeAttr("max")
				.removeAttr("step")
				.removeClass("numin")
				.removeClass("numin-element")
				.removeData("jquery.numin")
				.css("display", "")
				.unbind(".numin")
				.detach()
				.insertAfter(this.$parent);

			// reset element attributes
			if (this.attrs.maxlength !== null) this.$element.attr("maxlength",  this.attrs.maxlength);
			if (this.attrs.min       !== null) this.$element.attr("min",        this.attrs.min);
			if (this.attrs.max       !== null) this.$element.attr("max",        this.attrs.max);
			if (this.attrs.step      !== null) this.$element.attr("step",       this.attrs.step);

			// remove parent
			this.$parent
				.remove();

			// clear variables
			this.options   = undefined;
			this.$element  = undefined;
			this.$clone    = undefined;
			this.$parent   = undefined;
			this.$minify   = undefined;
			this.$maxify   = undefined;
			this.$decrease = undefined;
			this.$increase = undefined;
		},

		/**
		 * Get/set this.option.value
		 * @param  {Mixed} val
		 * @return {Mixed}
		 */
		value: function(val) {
			if (val === undefined) {
				return this.$element.val()*1;
			}

			// validate
			val = parseFloat(val);
			if (isNaN(val)) return;
			if (this.options.min !== null && val < this.options.min) val = this.options.min;
			if (this.options.max !== null && val > this.options.max) val = this.options.max;

			// set and format
			if (val != this.$element.val()*1) {
				this.options.value = val;
				this.$element
					.val(val)
					.trigger("change");
			}
		},

		/**
		 * Get/set this.option.min
		 * @param  {Mixed} val
		 * @return {Mixed}
		 */
		min: function(val) {
			if (val === undefined) {
				return this.options.min;
			}

			// reset
			if (val === null) {
				this.options.min = val;
			}

			// validate
			val = parseFloat(val);
			if (isNaN(val)) return;
			if (this.options.max !== null && this.options.max*1 < val) return;

			// set and format
			this.options.min = val;
			if (this.$element.val()*1 < val) {
				this.$element
					.val(val)
					.trigger("change");
			}
		},

		/**
		 * Get/set this.option.max
		 * @param  {Mixed} val
		 * @return {Mixed}
		 */
		max: function(val) {
			if (val === undefined) {
				return this.options.max;
			}

			// reset
			if (val === null) {
				this.options.max = val;
			}

			// validate
			val = parseFloat(val);
			if (isNaN(val)) return;
			if (this.options.min !== null && this.options.min*1 > val) return;

			// set and format
			this.options.max = val;
			if (this.$element.val()*1 > val) {
				this.$element
					.val(val)
					.trigger("change");
			}
		},

		/**
		 * Get/set this.option.step
		 * @param  {Mixed} val
		 * @return {Mixed}
		 */
		step: function(val) {
			if (val === undefined) {
				return this.options.max;
			}

			// reset
			if (val === null) {
				this.options.step = val;
			}

			// validate
			val = parseFloat(val);
			if (isNaN(val) || val == 0) return;

			// set
			this.options.step = val;
		},

		/**
		 * Get/set this.option.stepBig
		 * @param  {Mixed} val
		 * @return {Mixed}
		 */
		stepBig: function(val) {
			if (val === undefined) {
				return this.options.max;
			}

			// reset
			if (val === null) {
				this.options.stepBig = val;
			}

			// validate
			val = parseFloat(val);
			if (isNaN(val) || val == 0) return;

			// set
			this.options.stepBig = val;
		},

		/**
		 * Get/set this.option.decimals
		 * @param  {Mixed} val
		 * @return {Mixed}
		 */
		decimals: function(val) {
			if (val === undefined) {
				return this.options.decimals;
			}

			// validate
			val = parseInt(val);
			val = Math.abs(val);
			val = Math.round(val);
			val = val > 16 ? 16 : val;
			val = isNaN(val) ? this._defaults.decimals : val;
			if (this.options.decimals === val) return;

			// set and format
			this.options.decimals = val;
			this._handleCloneChange(this.$clone);
		},

		/**
		 * Get/set this.option.decimalSeparator
		 * @param  {Mixed} val
		 * @return {Mixed}
		 */
		decimalSeparator: function(val) {
			if (val === undefined) {
				return this.options.decimalSeparator;
			}

			// validate
			val = val.toString()[0] || "";

			// set and format
			this.options.decimalSeparator = val;
			this._handleCloneChange(this.$clone);
		},

		/**
		 * Get/set this.option.thousandSeparator
		 * @param  {Mixed} val
		 * @return {Mixed}
		 */
		thousandSeparator: function(val) {
			if (val === undefined) {
				return this.options.thousandSeparator;
			}

			// validate
			val = val.toString()[0] || "";

			// set and format
			this.options.thousandSeparator = val;
			this._handleCloneChange(this.$clone);
		},

		/**
		 * Get/set this.option.format
		 * @param  {Mixed} val
		 * @return {Mixed}
		 */
		format: function(val) {
			if (val === undefined) {
				return this.options.format;
			}

			// validate
			val = val.toString();

			// set and format
			this.options.format = val;
			this._handleCloneChange(this.$clone);
		},

		/**
		 * Get/set this.option.keyBind
		 * @param  {Mixed} val
		 * @return {Mixed}
		 */
		keyBind: function(val) {
			if (val === undefined) {
				return this.options.keyBind;
			}

			this.options.keyBind = !! val;
		},

		/**
		 * Set min value
		 * @return {Void}
		 */
		minify: function() {
			if (this.options.min !== null && this.options.min != this.$element.val()) {
				this.$element
					.val(this.options.min+"")
					.trigger("change");
			}
		},

		/**
		 * Set max value
		 * @return {Void}
		 */
		maxify: function() {
			if (this.options.max !== null && this.options.max != this.$element.val()) {
				this.$element
					.val(this.options.max+"")
					.trigger("change");
			}
		},

		/**
		 * Decrease element value
		 * @return {Void}
		 */
		decrease: function() {
			this.value(this.value() + this.options.step*-1);
		},

		/**
		 * Decrease element value
		 * @return {Void}
		 */
		decreaseBig: function() {
			if (this.options.stepBig) {
				this.value(this.value() + this.options.stepBig*-1);
			}
		},

		/**
		 * Increase element value
		 * @return {Void}
		 */
		increase: function() {
			this.value(this.value() + this.options.step*1);
		},

		/**
		 * Increase element value
		 * @return {Void}
		 */
		increaseBig: function() {
			if (this.options.stepBig) {
				this.value(this.value() + this.options.stepBig*1);
			}
		}
	}

	/**
	 * jQuery Numeric Input plugin
	 * @param  {Object} options (see Plugin.prototype._defaults object)
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

	// autoinit
	$(document).ready(function(e) {
		$("[data-numin-autoinit]").numin();
	});

})(jQuery);
