/**
 * Created by zzpzero on 2016/4/17.
 */

(function ($) {

    $.fn.extend({
        jasmineTab:function(config){
            var defaults = {
                maxTabs:4,
                onClick: null,//方法
                onDelete:null
            };
            config = $.extend({},defaults,config);
            return  $.fn.jasmineTab.fn.init(this,config);
        }
    });
    $.fn.jasmineTab.fn = $.fn.jasmineTab.prototype = {
        init:function(elem,config){
            var self = this;
            self.config = config;
            self.$elem = $(elem);
            self.$elem.css({"border-bottom":0}).closest("[role='panel']").css({border:0,"-webkit-box-shadow":"none","box-shadow":"none"});
            self.$ul =self.$elem.find(">[role='nav-tabs']");
            if(self.$ul.length<1){
                self.$elem.html('').css({padding:0});
                self.$ul = $('<ul></ul>').attr({role:'nav-tabs'});
                self.$elem.append(self.$ul);
            }
            return self;
        },
        addWithoutClick: function (option) {
            var self =this;
            self.default_tab = "__home__";
            var defaults = {
                id:self.default_tab,
                title:"Home",
                hasCancel:true
            };
            option = $.extend(defaults,option);
            option.id = option.id == ""? self.default_tab:option.id;

            self.$current_item = self.$ul.find(">[role='tabs-item'][data-id='"+option.id+"']");

            if(self.$current_item.length>0){
                self.$a = self.$current_item.find(">a").eq(0);
                return self;
            }

            if (self.$ul.children().length >= self.config.maxTabs) {
                if (self.$ul.find(".active").data("id") === self.default_tab) {
                    self.$current_item = self.$ul.children().last().addClass("active").siblings().removeClass("active");
                }
                self.$ul.find(".active").attr({"data-id": option.id}).find(">a").html(option.title);
                return self;
            }

            self.$current_item = $('<li></li>').attr({role:'tabs-item',"data-id":option.id}).css({"list-style":"none"});
            if(option.id == self.default_tab){
                self.$current_item.addClass('active');
            }
            //self.$current_item.addClass('active');
            self.$a = $('<a></a>').attr({href:"#"}).html(option.title);
            self.$ul.append(self.$current_item.append(self.$a));

            if(option.hasCancel==true && option.id != self.default_tab){
                self.$cancel = $('<div role="tabs-item-cancel">&nbsp;&nbsp;&nbsp;&nbsp;</div>');
                self.$current_item.append(self.$cancel);
                //delete event
                self.$cancel.click(function () {
                    var index = $(this).parent().index();
                    var items = $(this).parent().parent().children();

                    index = index == 0? items.length : index;

                    index = index - 1;

                    if ($(this).parent().is(".active")) {
                        var $current = items.eq(index).addClass("active");
                        id = $current.data("id");
                        items.not($current).removeClass("active");
                    }

                    $(this).parent().detach();

                    if(typeof self.config.onDelete == 'function'){
                        self.config.onDelete.call(self,option.id,option.title);
                    }
                });
            }

            self.$a.click(function(event){
                event.preventDefault();
                $(this).closest("[role='tabs-item']").addClass('active').siblings().removeClass('active');
                if(typeof self.config.onClick == 'function'){
                    self.config.onClick.call(self,option);
                }
            });

            return self;
        },
        add:function(option){
            this.addWithoutClick(option).$a.click();
            return this;
        }
    }
})(jQuery);