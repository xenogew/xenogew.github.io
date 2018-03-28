/**
 * jquery 表头固定插件 v0.1.0，fixedThead.js
 * @auther wingmeng
 * @update: 2017/05/06
 */
;(function($) {
 	$.fn.fixedThead = function(options) {
 		var defaults = {
 			height: 'auto',  // 表格最大高度，默认高度占满可视区
			vspace: 0,       // 垂直预留空间，为可视区其他组件空出空间，只有当height为auto时生效
			top: 0,          // 表格距离顶部的距离
			bottom: 0,       // 表格距离底部的距离
			row: 1,          // 要固定的行数
			col: 0           // 要固定的列数
 		};
 		var opts = $.extend(defaults, $.fn.fixedThead.option, options);

		return this.each(function() {
			var _this = $(this);			
			console.log('当前参数：', opts);
			console.group('内部函数执行顺序及耗时统计');
			opts = verifyOpts(opts, defaults);  // 校验参数
			if (typeof options == 'string') {
				if (options === 'refresh') {  // 刷新
					refresh(_this, opts);					
				} else if (options === 'destroy') {  // 销毁实例
					destroy(_this);					
				}
				return;
			}
			
			if (_this.parent().parent('div.fixed-thead').length) {
				refresh(_this, opts);
				return;  // 防止重复创建DOM
			}

			// 存储、移除自身内嵌样式
			if (_this.attr('style')) {
				_this.attr('data-style', _this.attr('style'));
				_this.removeAttr('style');
			}

			// 构建HTML结构
			var configs = buildHTML(_this, opts);
			guideBuild(configs);			
			configs = null;
			console.groupEnd();
		});		
	}

	$.fn.fixedThead.option = {};

	// 校验并确保自定义参数的合法性
	function verifyOpts(opts, defaults) {
		console.time('verifyOpts() -> 校验参数合法性');
		var result = defaults;
		var ckFun = function(str) {
			if (opts[str] == 0 || opts[str]) {
				if (!isNaN(opts[str]) && opts[str] >= 0) {
					result[str] = opts[str];
				}
			}
		};
		for (var key in result) {
			ckFun(key);
		}
		console.timeEnd('verifyOpts() -> 校验参数合法性');
		return result;
	}

	// 刷新数据（动态更新表格）
	function refresh(tableObj, opts) {
		console.info('更新内容');
		if (tableObj.parent().parent('div.fixed-thead').length) {
			var configs = {
				table: tableObj,
				bodyWrap: tableObj.parent(),
				wrapper: tableObj.parent().parent(),
				scrollBarWt: getScrollWidth(),
				opts: opts
			}
			guideBuild(configs, true);
		}
	}

	// 销毁实例
	function destroy(tableObj) {
		console.info('销毁实例');
		var parent = tableObj.parent().parent('div.fixed-thead'),
			oldStyle = tableObj.data('style');			
		if (oldStyle) {
			tableObj.attr('style', oldStyle).removeAttr('data-style');  // 还原之前的style样式
		} else {
			tableObj.removeAttr('style');
		}
		parent.before(tableObj);
		parent.empty().remove();
	}

	// 克隆table HTML
	function cloneTable(table, flag) {
		console.time('cloneTable() -> 克隆当前表格');
		var tClone = table.clone(),  // 是否复制事件？（待完善）
			tId = table.attr('id');
		if (tId) {
			tClone.attr('id', 'clone_' + tId + '_' + flag);
		}
		tClone.removeAttr('style');  // 移除复制的内嵌样式
		console.timeEnd('cloneTable() -> 克隆当前表格');
		return tClone;
	}

	// 构建HTML向导
	function guideBuild(configs, flag) {
		var opts = configs.opts,
			tableWrap = {};
		if (opts.row > 0 && opts.col > 0) {
			tableWrap.head = buildHTML_head(configs);
			tableWrap.side = buildHTML_side(configs);
			tableWrap.corner = buildHTML_coner(configs);
		} else {
			if (opts.row > 0) {
				tableWrap.head = buildHTML_head(configs);
			}
			if (opts.col > 0) {
				tableWrap.side = buildHTML_side(configs);
			}
		}

		calcLayout(configs, tableWrap);
		if (!flag) {
			console.time('监听表格容器滚动条事件');
			configs.bodyWrap.scroll(function() {
				if (tableWrap.side) {
					tableWrap.side.scrollTop($(this).scrollTop());
				}
				if (tableWrap.head) {
					tableWrap.head.scrollLeft($(this).scrollLeft());
				}
			});
			console.timeEnd('监听表格容器滚动条事件');
			console.time('监听浏览器窗口尺寸变化事件');
			$(window).resize(function() {
				calcLayout(configs, tableWrap);
			});
			console.timeEnd('监听浏览器窗口尺寸变化事件');
		}
	}

	// 构建HTML结构
	function buildHTML(tableObj, opts) {
		console.time('buildHTML() -> 构建主HTML结构，返回层级对象');
		var wrapper = $('<div class="fixed-thead"></div>'),
			bodyWrap = $('<div class="fixed-thead-body"></div>');
		tableObj.wrap(wrapper).wrap(bodyWrap);
		var configs = {
			table: tableObj,
			bodyWrap: tableObj.parent(),
			wrapper: tableObj.parent().parent(),
			scrollBarWt: getScrollWidth(),
			opts: opts
		};
		if (opts.top) {
			configs.wrapper.css('margin-top', opts.top);
		}
		if (opts.bottom) {
			configs.wrapper.css('margin-bottom', opts.bottom);
		}
		console.timeEnd('buildHTML() -> 构建主HTML结构，返回层级对象');
		return configs;			
	}

	// 构建头部
	function buildHTML_head(configs) {
		console.time('buildHTML_head() -> 构建头部HTML结构');
		var wrap = configs.wrapper.find('div.fixed-thead-head');
		var headTable = cloneTable(configs.table, 'head');
		if (wrap.length == 0) {
			wrap = $('<div class="fixed-thead-head"></div>');
			configs.bodyWrap.before(wrap.append(headTable));
		} else {
			wrap.empty().append(headTable);  // empty()一下释放内存
		}
		console.timeEnd('buildHTML_head() -> 构建头部HTML结构');
		return wrap;
	}

	// 构建侧边
	function buildHTML_side(configs) {
		console.time('buildHTML_side() -> 构建侧边HTML结构');
		var wrap = configs.wrapper.find('div.fixed-thead-side');
		var sideTable = cloneTable(configs.table, 'side');
		if (wrap.length == 0) {
			wrap = $('<div class="fixed-thead-side"></div>');
			configs.bodyWrap.before(wrap.append(sideTable));
		} else {				
			wrap.empty().append(sideTable);				
		}
		console.timeEnd('buildHTML_side() -> 构建侧边HTML结构');
		return wrap; 
	}

	// 构建左上角
	function buildHTML_coner(configs) {
		console.time('buildHTML_coner() -> 构建左上角HTML结构');
		var wrap = configs.wrapper.find('div.fixed-thead-corner');
		var cornerTable = cloneTable(configs.table, 'corner');
		if (wrap.length == 0) {
			wrap = $('<div class="fixed-thead-corner"></div>');
			configs.bodyWrap.before(wrap.append(cornerTable));
		} else {				
			wrap.empty().append(cornerTable);				
		}
		console.timeEnd('buildHTML_coner() -> 构建左上角HTML结构');
		return wrap;
	}

	// 布局计算
	function calcLayout(configs, tableWrap) {
		console.time('calcLayout() -> 计算布局尺寸并应用');
		// 计算固定的行数高度总和
		var maxHt = 0,
			headHt = 0,
			sideWt = 0;
		if (tableWrap.head) {
			for (var i = 0; i < configs.opts.row; i++) {
				headHt += configs.table.find('tr').eq(i).outerHeight();
			}
			++headHt;  // 让固定head露出1px底边框线
			configs.table.css('margin-top', -headHt + 'px');
			tableWrap.head.height(headHt);
			maxHt = calcLayout_resize_head(configs, tableWrap.head, headHt);
		}
		if (tableWrap.side) {						
			for (var i = 0; i < configs.opts.col; i++) {
				sideWt += configs.table.find('tr:eq(0)').children().eq(i).outerWidth();
			}
			++sideWt;  // 让固定side露出1px右边框线

			// 如果表格未溢出可视区（未出现水平滚动条）
			if (configs.table.width() <= configs.bodyWrap.width()) {
				sideWt = 0;
			}

			configs.table.css('margin-left', -sideWt + 'px');
			configs.bodyWrap.css('margin-left', sideWt + 'px');

			if (tableWrap.head) {
				tableWrap.head.css('margin-left', sideWt + 'px')
					.children('table').css('margin-left', -sideWt + 'px');
			}

			tableWrap.side.css({
				top: headHt - 1 + 'px',
				width: sideWt + 'px',
				maxHeight: maxHt - configs.scrollBarWt + 1 + 'px'
			}).children('table').css('margin-top', -(headHt - 1) + 'px');
		}
		if (tableWrap.corner) {
			tableWrap.corner.css({
				width: sideWt + 'px',
				height: headHt + 'px'
			});
		}
		console.timeEnd('calcLayout() -> 计算布局尺寸并应用');
	}

	// 计算并应用头部固定区域与滚动区域的布局样式
	function calcLayout_resize_head(configs, headWrap, headHt) {
		console.time('calcLayout_resize_head() -> 计算并应用头部固定区域与滚动区域的布局样式');
		var maxHt;
		if (configs.opts.height == 'auto') {  // 占满可视区
			maxHt = $(window).height() - configs.opts.vspace - headHt;
		} else {
			maxHt = configs.opts.height - headHt;
		}
		configs.bodyWrap.css('max-height', maxHt + 'px');

		var headTable = headWrap.children('table'),
			rowfix = headTable.find('.fixed-thead-rowfix');
		if (configs.bodyWrap.height() < configs.table.height() - headHt) {  // 出现垂直滚动条
			if (!rowfix.length) {
				calcLayout_fix_head(configs, headWrap, headTable);
			}
		} else {
			rowfix.remove();
		}
		console.timeEnd('calcLayout_resize_head() -> 计算并应用头部固定区域与滚动区域的布局样式');
		return maxHt;
	}

	// 头部溢出修补
	function calcLayout_fix_head(configs, headWrap, headTable) {
		console.time('calcLayout_fix_head() -> 头部溢出区域修补');
		var scrollBarWt = configs.scrollBarWt - 1 + 'px';  // 滚动条宽度
		// 添加空单元格来修复滚动条占据的宽度
		for (var i = 0; i < configs.opts.row; i++) {
			var curRow = headTable.find('tr').eq(i),
				fixRow = curRow.children().last().clone();

			fixRow.empty().addClass('fixed-thead-rowfix');	
			if (headTable.width() > headWrap.width()) {  // 出现水平滚动条的情况
				var innerDiv = $('<div style="width:' + scrollBarWt + '"></div>');
				fixRow.css({
					width: 0,
					padding: 0
				}).append(innerDiv);
			} else {
				fixRow.css({
					width: scrollBarWt,
					padding: 0
				});
			}
			curRow.append(fixRow);
		} 
		console.timeEnd('calcLayout_fix_head() -> 头部溢出区域修补');
	}

	// 获取浏览器滚动条宽度
	function getScrollWidth() {
		console.time('getScrollWidth() -> 获取浏览器滚动条宽度');
		var noScroll, scroll;
		var oDiv = document.createElement('div'),
			$oDiv = $(oDiv);
		$oDiv.css({
			position: 'absolute',
			top: '-50px',
			zIndex: '-1',
			width: '50px',
			height: '50px',
			overflow: 'hidden'
		});
		document.body.appendChild(oDiv);
		noScroll = oDiv.clientWidth;
		oDiv.style.overflowY = 'scroll';
		scroll = oDiv.clientWidth;
		$oDiv.remove();
		console.timeEnd('getScrollWidth() -> 获取浏览器滚动条宽度');
		return noScroll - scroll;
	}	
})(jQuery);