/**
 * Created by zzpzero on 2017/3/24.
 */
;(function (factory) {
    if (typeof define === "function" && define.amd) {
        // AMD模式
        define([ "jquery" ], factory);
    } else {
        // 全局模式
        factory(jQuery);
    }
}(function ($) {
    $.fn.extend({
        jasmineLayout: function (option) {

            return this.each(function () {
                var $that = $(this);

                var _prop = {
                    $el: $that,
                    option:null,
                    init: function (option) {
                        $that.data('option',option)
                        this.option = option;
                        var that = this;

                        that.$el = $that;
                        that._auto_w = 0;
                        that._auto_h = 0;

                        //
                        that._regions = ["center", "east", "west", "north", "south"];

                        //注册五个区域
                        $.each(that._regions, function (i, val) {
                            that[val] = $that.find(">[region='" + val + "']");
                        });
                        _fun.makeup();
                        $(window).resize(function () {
                            _fun.makeup();
                        });

                        if ($.isFunction(that.option.onInit)) {
                            that.option.onInit.call(that, option)
                        }
                        return this;
                    }
                };

                var _fun = {
                    splitWidth: function (name) {
                        return (this.elemExist(name) && $.inArray(name,_prop.option.splitPanels)>-1?_prop.option.splitWidth:0)
                    },
                    reSetMiddleHeight: function () {
                        var self = this;
                        var fixedHeight = self.getElemFixedHeight();
                        var northHeight = (self.elemExist('north')?self.getOuterHeight('north'):0);
                        var southHeight = (self.elemExist('south')?self.getOuterHeight('south'):0);
                        var northSplitHeight = self.splitWidth('north');
                        var southSplitHeight = self.splitWidth('south');
                        _prop._auto_h = _prop.$el.innerHeight() - northHeight - southHeight - fixedHeight- northSplitHeight-southSplitHeight;
                        var topY = (self.getOuterHeight('north')+ fixedHeight / 2)+northSplitHeight;
                        self.elemExist('west') && _prop.west.height(_prop._auto_h-self.getFixedHeight('west')).css({top: topY});
                        self.elemExist('center') && _prop['center'].height(_prop._auto_h-self.getFixedHeight('center')).css({top: topY});
                        self.elemExist('east') && _prop.east.height(_prop._auto_h-self.getFixedHeight('east')).css({top: topY});
                        self.elemExist('north') && _prop.north.css({top: fixedHeight / 2});
                        self.elemExist('south') && _prop.south.css({bottom: fixedHeight / 2});
                    },
                    reSetCenterWidth: function () {
                        var self = this;
                        var fixedWidth = self.getElemFixedWidth();
                        self.elemExist('north') && _prop.north.css({left: fixedWidth / 2, right: fixedWidth / 2});
                        self.elemExist('south') && _prop.south.css({left: fixedWidth / 2, right: fixedWidth / 2});

                        var eastSplitWidth = self.splitWidth('east');
                        var westSplitWidth = self.splitWidth('west');

                        _prop._auto_w = _prop.$el.innerWidth() - self.getOuterWidth('west') - self.getOuterWidth('east') - self.getFixedWidth('center')-(eastSplitWidth+westSplitWidth)-fixedWidth;

                        console.log(_prop._auto_w,fixedWidth)
                        self.elemExist('west') &&_prop.west.css({left: fixedWidth / 2});
                        self.elemExist('east') &&_prop.east.css({right: fixedWidth / 2});
                        self.elemExist('center') && _prop['center'].css({
                            width: _prop._auto_w,
                            left: this.getOuterWidth('west') + fixedWidth / 2+westSplitWidth
                        });

                    },
                    getElemFixedWidth: function () {
                        return ($that.outerWidth(true) - $that.width());
                    },
                    getElemFixedHeight: function () {
                        return ($that.outerHeight(true) - $that.height());
                    },
                    getBodyFixedWidth: function () {
                        var $body = $("body");
                        return ($body.outerWidth(true) - $body.width());
                    },
                    getBodyFixedHeight: function () {
                        var $body = $("body");
                        return ($body.outerHeight(true) - $body.height());
                    },
                    getFixedWidth: function (name) {
                        return this.elemExist(name)?_prop[name].outerWidth(true)- _prop[name].width():0;
                    },
                    getFixedHeight: function (name) {
                        return this.elemExist(name)?_prop[name].outerHeight(true)- _prop[name].height():0;
                    },
                    getWidth: function (name) {
                        if (!this.elemExist(name)) {
                            return 0;
                        }
                        return _prop[name].width();
                    },
                    getOuterWidth: function (name) {
                        if (!this.elemExist(name)) {
                            return 0;
                        }
                        return _prop[name].outerWidth(true);
                    },
                    getHeight: function (name) {
                        if (!this.elemExist(name)) {
                            return 0;
                        }
                        return _prop[name].height();
                    },
                    getOuterHeight: function (name) {
                        if (!this.elemExist(name)) {
                            return 0;
                        }
                        return _prop[name].outerHeight(true);
                    },
                    elemExist: function (name) {
                        return !(!name || name == "" || typeof _prop[name] == 'undefined' || _prop[name].length < 1);
                    },
                    makeup: function () {
                        var self = this;
                        if ($.isFunction(_prop.option.onBeforeResize)) {
                            _prop.option.onBeforeResize.call($that[0]);
                        }
                        if($that[0].nodeName =='BODY'){
                            $that.height($(window).height()-_fun.getBodyFixedHeight());
                        }
                        self.reSetMiddleHeight();
                        self.reSetCenterWidth();
                        if ($.isFunction(_prop.option.onResize)) {
                            _prop.option.onResize.call($that[0], _prop._auto_w,_prop._auto_h);
                        }
                    }
                };

                $that.css({position:'relative',margin:0});

                if(Object.prototype.toString.call(option)=="[object String]"){
                    if(_fun.hasOwnProperty(option)){
                        var _options = $that.data('option');
                        _prop.init(_options);
                        var args = [];
                        for(var i in arguments){
                            if(parseInt(i)>0){
                                args.push(arguments[i]);
                            }
                        }
                        return _fun[option].apply(_fun,args);
                    }
                    return;
                }
                var defaults = {
                    splitPanels: ["center", "east", "west", "north", "south"],
                    splitWidth: 5,
                    onInit: null,
                    onBeforeResize:null,
                    onResize: function (w,h) {
                        $("[region='center']",$(this)).css({overflow:"hidden"}).find(">iframe").css({width:w,height:h});
                    }
                };
                option = $.extend({}, defaults, option);
                _prop.init(option);
            });
        }
    });
}));
