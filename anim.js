/*
 * anim.js
 * date: 2013-5-2 
 */
 //把window、document传递给win和doc，使其作为局部变量，这样在闭包里访问window、document时就不用访问全局对象了，查找效率提高了。
(function(win, doc) {

	// 构造器Anim
	var Anim = function(elem) {
		elem = typeof elem === "string" ? doc.getElementById(elem) : elem;
		return new AnimExtend(elem); // 把元素的对象引用传给构造函数AnimExtend，并返回实例对象
	},
		pow = Math.pow,
		sin = Math.sin,
		PI = Math.PI,
		BACK_CONST = 1.70158,
		animData = []; // 动画数据

	// #######################################################################
	// 动画的tween算法
	var Easing = {
		// 匀速运动
		linear: function(t) {
			return t;
		},
		easeIn: function(t) {
			return t * t;
		},
		easeOut: function(t) {
			return (2- t) * t;
		},
		easeBoth: function(t) {
			return (t *= 2) < 1 ? 
				.5 * t * t :
				.5 * (1 - (--t) * (t - 2));
		},
		easeInStrong: function(t) {
			return t * t * t * t;
		},
		easeOutStrong: function(t) {
			return 1 - (--t) * t * t * t;
		},
		easeBothStrong: function(t) {
			return (t *= 2) < 1 ?
				.5 * t * t * t * t :
				.5 * (2 - (t -= 2) * t * t * t);
		},
		easeOutQuart: function(t) {
	      	return -(pow((t - 1), 4) -1);
	    },
	    easeInOutExpo: function(t) {
		    if(t === 0) return 0;
		    if(t === 1) return 1;
		    if((t /= 0.5) < 1) return 0.5 * pow(2, 10 * (t - 1));
		    return 0.5 * (-pow(2, -10 * --t) + 2);
	    },
		easeOutExpo: function(t) {
	      	return (t===1) ? 1 : -pow(2, -10 * t) + 1;
	    },
		swingFrom: function(t) {
	      	return t * t * ((BACK_CONST + 1) * t - BACK_CONST);
	    },
		swingTo: function(t) {
	      	return (t -= 1) * t * ((BACK_CONST + 1) * t + BACK_CONST) + 1;
	    },
		backIn: function(t) {
			if (t === 1) t -= .001;
			return t * t * ((BACK_CONST + 1) * t - BACK_CONST);
		},
		backOut: function(t) {
			return (t -= 1) * t * ((BACK_CONST + 1) * t + BACK_CONST) + 1;
		},
		bounce: function(t) {
			var s = 7.5625,
				r;
			if (t < (1 / 2.75)) {
				r = s * t * t;
			} else if (t < (2 / 2.75)) {
				r = s * (t -= (1.5 / 2.75)) * t + .75;
			} else if (t < (2.5 / 2.75)) {
				r = s * (t -= (2.25 / 2.75)) * t + .9375;
			} else {
				r = s * (t -= (2.625 / 2.75)) * t + .984375;
			}

			return r;
		}	
	};

	// #######################################################################
	// 动画数据初始化对象
	var animBase = {
	    /*
		 * 获取应用到元素并计算的最终样式
		 * @param {Object} DOM对象
		 * @param {String} 要获取的css属性
		 * @return {String}
		 */
		getStyle: function(elem, prop) {
			return "getComputedStyle" in win ?
				// W3C方法 (匿名函数立执行并返回属性值)
				function() {
					// 对如font-size属性进行处理，使其变成驼峰式名称fontSize
					prop = prop.replace(/\-(\w)/g, function(match, value, index) {
						// alert(match);match为与整个模式匹配的项，如属性为font-size时match为-s
						// value 为 捕获组
						// index 为匹配项的索引，如font-size时则为4
						return value.toUpperCase();
					});

					// 获取相应的属性值
					var val = getComputedStyle(elem, null)[prop];

					// 如果是left、right、top、bottom属性，并且其值为auto(不设置默认为auto)，则返回0px
					if ((prop == "left" || prop == "right" || prop === "top" || prop === "bottom") && val === "auto") {
						return "0px"; 
					}
					// 否则直接返回
					return val;
				}() :

				// IE方法 (匿名函数立执行并返回属性值)
				function() {
					prop = prop.replace(/\-(\w)/g, function(match, value, index) {
						return value.toUpperCase();
					});

					// 获取相应的属性值
					var val = elem.currentStyle[prop];

					// 如果是width、height属性，并且其值为auto(不设置默认为auto)，则根据getBoundingClientRect方法计算其宽度和高度 
					if ((prop === "width" || prop === "height") && val === "auto") {
						// 获取元素相对于文档document的坐标(位置)
						var rect = elem.getBoundingClientRect();
						// 如果是width属性，则right坐标-left坐标，反之为bottom坐标-top坐标，记得加上单位px
						return (prop === "width" ? rect.right - rect.left : rect.bottom - rect.top) + "px";
					}

					// 获取元素在IE6/7/8中的透明度
					if (prop === "opacity") {
						// 获取filter属性值
						var filter = elem.currentStyle.filter;
						if (/opacity/.test(filter)) {
							// 获取透明度数值(1-100)并除于100,等价于/\d+/g.exec(filter)[0] / 100
							val = filter.match(/\d+/)[0] / 100;
							// 如果透明度数值为0或100，则不保留小数点位数，否则保留一位小数点，如0.3
							return (val === 1 || val === 0) ? val.toFixed(0) : val.toFixed(1);
						} else if (val === undefined) {
							return "1";
						}
					}

					// 如果是left、right、top、bottom属性，并且其值为auto，则返回0px
					if ((prop == "left" || prop == "right" || prop === "top" || prop === "bottom") && val === "auto") {
						return "0px"; 
					}
					// 否则直接返回
					return val;

				}();
		},

		/* 
		 * 解析颜色值
		 * @param {String} 颜色值
		 * @return {Object} RGB颜色值组成的对象
		 * red: object.r green: object.g blue: object.b
		 */
		parseColor: function(val) {
			var r, g, b;
			// 解析rgb值
			if (/rgb/.test(val)) {
				var arr = val.match(/\d+/g);
				r = arr[0];
				g = arr[1];
				b = arr[2];
			// 解析十六进制值
			} else if (/#/.test(val)) {
				var len = val.length;
				if (len === 7) {
					// 字符串截取，等价于substring方法，注意截取的项不包括最后位置
					r = parseInt(val.slice(1, 3), 16); 
					g = parseInt(val.slice(3, 5), 16);
					b = parseInt(val.slice(5, 7), 16);
				// #FFFFFF等价于#FFF					
				} else if (len === 4) {
					r = parseInt(val.charAt(1) + val.charAt(1), 16);
					g = parseInt(val.charAt(2) + val.charAt(2), 16);
					b = parseInt(val.charAt(3) + val.charAt(3), 16);
				}
			} else {
				return val;
			}

			// 返回一个包含r、g、b属性的对象
			return {
				r: parseFloat(r),
				g: parseFloat(g),
				b: parseFloat(b)
			};
		},

		/*
		 * 解析css属性值
		 * @param {String} css属性
		 * @param {Object} object.val为css属性值 object.unit为css属性单位
		 * object.fn 为计算普通的属性值和颜色值的方法
		 */
		parseStyle: function(prop) {
			var val = parseFloat(prop),
				unit = prop.replace(/^[\-\d\.]+/, "");

			return isNaN(val) ? {
				// val不是一个数值
				val: this.parseColor(unit),
				unit: "",
				fn: function(sv, tv, tu, e) {
					var r = (sv.r + (tv.r - sv.r) * e).toFixed(0), 
						g = (sv.g + (tv.g - sv.g) * e).toFixed(0), 
						b = (sv.b + (tv.b - sv.b) * e).toFixed(0);
					return "rgb(" + r + "," + g + "," + b + ")";
				}
			} : {
				// val是一个数值
				val: val,
				unit: unit,
				fn: function(sv, tv, tu, e) {
					return (sv + (tv - sv) * e).toFixed(3) + tu;
				}
			}
		},

		/*
		 * 将数组转换为对象
		 * @param {Array} 数组
		 * @param {String} 对象的键值
		 * @param {Object}
		 */
		newObj: function(arr, val) {
			val = val !== undefined ? val : 1;
			var i,
			 	len,
				obj = {};
			for (i = 0, len = arr.length; i < len; i++) {
				obj[arr[i]] = val;
			}
			// 返回对象
			return obj;
		},

		/*
		 * 设置透明度
		 * @param {Object} DOM对象
		 * @param {String} 透明值
		 * @returns {undefined}
		 */
		setOpacity: function(elem, val) {
			// w3c方法(对Firefox、chrome有效)
			if ("getComputedStyle" in win) {
				elem.style.opacity = val === 1 ? "" : val;
			} else {
				// IE有效
				elem.style.zoom = 1; // 触发IE6/7下的hasLayout属性
				elem.style.filter = val === 1 ? "" : "alpha(opacity=" + val * 100 + ")";  
			}
		},

		// 预定义的速度(默认)
		speed: {
			slow: 600,
			fast: 200,
			defaults: 400
		},

		/*
		 * 预定义的动画
		 * @param {String} 动画类型(show/hide)
		 * @param {Number} 数组index，0为slide，1为fade
		 * @param {Object} object.props为css属性数组，object.type为动画类型(show/hide)
		 */
		fxAttrs: function(type, index) {
			var attrs = [
				["width", "height", "opacity", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"],
				["height", "paddingTop", "paddingBottom", "borderTopWidth", "borderBottomWidth"],
				["opacity"]
			];

			return {
				attrs: attrs[index],
				type: type
			};
		},

		/*
		 * 将动画参数存储到一个新对象中
		 * @param {Object} DOM对象
		 * @param {String && Number} 动画持续时间 String: fast/slow/defaults
		 * @param {String && Function} tween算法
		 * @param {Function} 回调函数
		 * @return {Object} 参数的集合对象
		 */
		setOptions: function(elem, duration, easing, callback) {
			var self = this,
				options = {};
			
			// 参数对象options属性：duration
			options.duration = (function(d) {
				// duration为数值
				if (typeof d === "number") {
					return d;
				// duration为字符串
				} else if (typeof d === "string") {
					return self.speed[d];
				// 如果没有传入duration菜单，则取得默认值
				} else if (!d) {
					return self.speed.defaults; 
				}
			})(duration);

			// 参数对象options属性：easing
			options.easing = (function(e) {
				// 如果easing为字符串，则根据Easing对象取得相应的tween算法(函数)
				if (typeof e === "string") {
					return Easing[e]; 
				// 如果easing为函数，则直接返回	
				} else if (typeof e === "function") {
					return e;
				// 否则默认为easeBoth函数
				} else {
					return Easing.easeBoth;
				}
			})(easing);

			// 参数对象options属性：callback
			options.callback = function() {
				if (typeof callback === "function") {
					callback();
				}
				// 清除动画队列
				self.dequeue(elem);
			};

			return options; // 返回参数对象
		},

		/*
		 * 初始化动画属性
		 * @param {Object} DOM对象
		 * @param {Object} css动画属性和属性值
		 * @param {String} 动画类型
		 * @return {Object} 处理好的css动画属性和属性值
		 */
		setProps: function(elem, props, type) {
			if (type) {
				var attrs = props().attrs,
					type = props().type,
					val,
					obj = null,
					p;
				if (type === "hide") {
					val = attrs[0] === "opacity" ? "0" : "0px";
				}

				obj = this.newObj(attrs, val); // css动画属性都取得一个相同的值

				if (type === "show") {
					for (p in obj) {
						obj[p] = this.getStyle(elem, p);
					}
				}
				return obj;
			// 如果存在props参数并且该参数为对象,则直接返回
			} else if (props && typeof props === "object") {
				return props;
			}
		},

		// 返回或存储队列(获取动画队列)
		data: function(elem) {
			var animQueue = elem.animQueue; // 动画队列

			if (!animQueue) {
				animQueue = elem.animQueue = []; // 如果不存在动画队列，则初始化为一个空数组
			}

			return animQueue;
		},

		// 将数据添加到队列中(添加动画到动画队列中)
		queue: function(elem, data) {
			var animQueue = this.data(elem);

			if (data) {
				animQueue.push(data);
			}

			// 如果动画队列的第一个动画函数不是runing，则清除动画队列(取出队列中的数据并执行)
			if (animQueue[0] !== "runing") {
				this.dequeue(elem);
			}
		},

		// 取出队列中的数据并执行
		dequeue: function(elem) {
			var self = this,
				animQueue = self.data(elem), // 取得动画队列
				fn = animQueue.shift(); // 取得动画队列的第一个动画

			// 如果该动画正在执行，则删除它并返回
			if (fn === "runing") {
				fn = animQueue.shift();
			}

			if (fn) {
				animQueue.unshift("runing");  // 在动画队列头部添加runing函数
				// 如果fn是一个数值，则在该数值时间后调用dequeue方法
				if (typeof fn === "number") {
					win.setTimeout(function() {
						self.dequeue(elem);
					}, fn);
				// 如果fn是一个函数，则在elem上调用该fn
				} else if (typeof fn === "function") {
					fn.call(elem, function() {
						self.dequeue(elem);
					});
				}
			}

			// 如果animQueue不是一个数组，则令元素的animQueue属性值为undefined
			if (!animQueue.length) {
				elem.animQueue = undefined;
			}

		}

	};

	// #######################################################################
	// AnimCore构造函数
	var AnimCore = function(elem, options, props, type) {
		this.elem = elem;
		this.options = options;
		this.props = props;
		this.type = type;
	};
	// 原型对象
	AnimCore.prototype = {
		// 开始
		start: function(source, target) {
			this.startTime = +new Date(); // 生成随机数
			this.source = source;
			this.target = target;
			animData.push(this);

			var self = this;
			if (self.elem.timer) return;
			self.elem.timer = win.setInterval(function() {
				for (var i = 0, curStep; curStep = animData[i++];) {
					curStep.run();
				}

				if (!animData.length) {
					self.stop();
				}
			}, 13);
		},

		// 执行(运行)
		run: function(end) {	
			var elem = this.elem,
				type = this.type,
				props = this.props,
				startTime = this.startTime,	// 动画开始的时间
				elapsedTime = +new Date(),	// 当前帧的时间			
				duration = this.options.duration, // 动画持续的时间	
				endTime = startTime + duration,	 // 动画结束的时间
				t = elapsedTime > endTime ? 1 : (elapsedTime - startTime) / duration,
				e = this.options.easing(t),
				len = 0,
				i = 0,
				p;
			
			// 计算props对象有多少个属性
			for (p in props) {
				len += 1;
			}
			
			elem.style.overflow = "hidden";
			if (type === "show") {
				elem.style.display = "block";
			}
				
			for (p in props) {
				i += 1;
				var	sv = this.source[p].val,
					tv = this.target[p].val,
					tu = this.target[p].unit;
							
				// 结束动画并还原样式
				if (end || elapsedTime >= endTime) {
					elem.style.overflow = "";
					if (type === "hide") {
						elem.style.display = "none";
					}
					
					if (type) {
						if (p === "opacity") {
							animBase.setOpacity(elem, 1);
						} else {
							elem.style[p] = (type === "hide" ? sv : tv) + tu;
						}
					} else {
						elem.style[p] = /color/i.test(p) ? 
							"rgb(" + tv.r + "," + tv.g + "," + tv.b + ")" :
							tv + tu;
					}
					
					if (i === len) {  // 判断是否为最后一个属性
						this.complete();
						this.options.callback.call(elem);	
					}
							
				} else {
					if (sv === tv) continue;
					if (p === "opacity") {
						animBase.setOpacity(elem, (sv + (tv - sv) * e).toFixed(3));
					} else {
						elem.style[p] = this.target[p].fn(sv, tv, tu, e);
					}
				}		
			}
				
		},

		// 停止
		stop: function() {
			win.clearInterval(this.elem.timer);
			this.elem.timer = undefined;
		},

		// 完成
		complete: function() {
			for (var i = animData.length - 1; i >= 0; i--) {
				if (this === animData[i]) {
					animData.splice(i, 1);
				}
			}
		}

	};


	// #######################################################################
	// AnimExtend构造函数
	var AnimExtend = function(elem) {
		this.elem = elem;
	};
	// 原型对象
	AnimExtend.prototype = {
		// 自定义动画
		custom: function (props, duration, easing, callback) {
			var elem = this.elem,
				options = animBase.setOptions(elem, duration, easing, callback),
				type = typeof props === "function" ? props().type : null;
			
			props = animBase.setProps(elem, props, type);
								
			animBase.queue(elem, function() {
				var source = {},
					target = {},
					p;
							
				for (p in props) {
					if (type === "show") {
						// 将CSS重置为0
						if (p === "opacity"){
							animBase.setOpacity(elem, "0");
						} else {
							elem.style[p] = "0px";
						}
					}

					// 动画开始时的CSS样式
					source[p] = animBase.parseStyle(animBase.getStyle(elem, p)); 
					// 动画结束时的CSS样式
					target[p] = animBase.parseStyle(props[p]); 
				}
				
				var core = new AnimCore(elem, options, props, type);
				core.start(source, target);
			});
			
			return this; //实现链式调用
		},

		/*
		 * 停止动画
		 * @param { Boolean } 是否清除队列
		 * @param { Boolean } 是否执行当前队列的最后一帧动画
		 * @return { Object } 
		 */
		stop: function(clear, end) {
			var elem = this.elem,
				i = animData.length;
				
			if (clear) {
				elem.animQueue = undefined;
			}
					
			while (i--) {
				if (animData[i].elem === elem) {
					if (end) {
						animData[i].run(true);			
						if (elem.timer) return;
						elem.timer = win.setInterval(function() {
							for (var j = 0, curStep; curStep = animData[j++];) {
								curStep.run();
							}
							
							if (!i) {
								win.clearInterval(elem.timer);
								elem.timer = undefined;
							}
						}, 13);	
					}
					animData.splice(i, 1);
				}
			}
			
			if (!end) {
				animBase.dequeue(elem);
			}
						
			return this; // 实现链式调用		
		},

		// 显示动画
		show: function(duration, easing, callback) {
			var elem = this.elem;
			if (duration) {
				this.custom(function() {
					return animBase.fxAttrs("show", 0);
				}, duration, easing, callback);
			} else {
				elem.style.display = "block";
			}
			
			return this;
		},
		
		// 延迟时间
		delay: function(time) {
			if (typeof time === "number") {
				animBase.queue(this.elem, time);
			}
			
			return this;
		},
		
		// 隐藏动画
		hide: function(duration, easing, callback) {
			var elem = this.elem;
			if (duration) {
				this.custom(function() {
					return animBase.fxAttrs("hide", 0);
				}, duration, easing, callback);
			} else {
				elem.style.display = "none";
			}
			
			return this;
		},

		// 下滑动画
		slideDown: function(duration, easing, callback) {
			this.custom(function() {
				return animBase.fxAttrs("show", 1);
			}, duration, easing, callback);
			
			return this;
		},
		
		// 上滑动画
		slideUp: function(duration, easing, callback) {
			this.custom(function() {
				return animBase.fxAttrs("hide", 1);
			}, duration, easing, callback);
			
			return this;
		},
		
		// 切换上下滑动动画
		slideToggle: function(duration, easing, callback) {
			var elem = this.elem;
		
			animBase.getStyle(elem, "display") === "none" ? 
				this.slideDown(duration, easing, callback) :
				this.slideUp(duration, easing, callback);
			
			return this;
		},
		
		// 淡入动画
		fadeIn: function(duration, easing, callback) {
			this.custom(function(){
				return animBase.fxAttrs("show", 2);
			}, duration, easing, callback);
			
			return this;
		},
		
		// 淡出
		fadeOut: function(duration, easing, callback) {
			this.custom(function() {
				return animBase.fxAttrs("hide", 2);
			}, duration, easing, callback);
			
			return this;
		}
	};


	// 需要作为全局对象window的属性，才可以在外部访问到
	win.Anim = Anim;
	win.animBase = animBase;

})(window, document);