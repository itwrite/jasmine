/**
 * Created by zzpzero on 2018/7/9.
 *
 * version 1.2.1
 * Created by zzpzero.
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.M = global.Model = factory());
}(typeof window !== "undefined" ? window : this, function () {
    var __debug = true,
        __bindings = {},
        __time = null,
        __data = [],
        __operators = ['==', '===', '<', '>', '<=', '>=', '<>', '!=', '<<', '>>', 'like'],
        __booleans = ['&&', '||', '|'],
        __booleans_map = {and: '&&', or: '||'},
        __join_types = ['left', 'right', 'inner'],
        __booleans_or_arr = ['||', '|', 'or'];

    var version = "1.2.1",

        r_trim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
        escape_rgx = /\\|'|\r|\n|\u2028|\u2029/g;

    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {"'": "'", '\\': '\\', '\r': 'r', '\n': 'n', '\u2028': 'u2028', '\u2029': 'u2029'};

    /**
     *
     * @type {{log: Function}}
     */
    var Debug = {
        log: function () {
            if (__debug == true) {
                var time = (new Date()).getTime();
                var arr = ["echo[" + (time - __time) / 1000 + "s]:"];
                for (var i in arguments) {
                    if (arguments.hasOwnProperty(i)) {
                        arr.push(arguments[i]);
                    }
                }
                console.log.apply(this, arr);
            }
        }
    };

    var Fun = {
        /**
         *
         * @param param1
         * @param param2
         * @returns {*}
         */
        compare:function (param1, param2) {
        //if both are strings
        if (typeof param1 == "string" && typeof param2 == "string") {
            return param1.localeCompare(param2);
        }
        //if param1 is a number but param2 is a string
        if (typeof param1 == "number" && typeof param2 == "string") {
            return -1;
        }
        //if param1 is a string but param2 is a number
        if (typeof param1 == "string" && typeof param2 == "number") {
            return 1;
        }
        //if both are numbers
        if (typeof param1 == "number" && typeof param2 == "number") {
            if (param1 > param2) return 1;
            if (param1 == param2) return 0;
            if (param1 < param2) return -1;
        }
        return 0;
    }
    };

    /**
     *
     * @type {{data, each: Function, sum: Function}}
     */
    var Vendor = {
        get data() {
            return __data;
        },
        each: function () {
            Helper.each.apply(this, arguments);
        },
        sum: function (field, list) {
            var sum = 0;
            this.each(list, function (i, row) {
                if (Helper.isDefined(row[field])) {
                    sum += parseFloat(row[field]);
                }
            });
            return sum;
        },
        filter: function (list, callback) {
            return Algorithm.filter.apply(this, arguments);
        }
    };

    /**
     *
     * @param key
     * @param val
     * @param operator
     * @param boolean
     * @constructor
     */
    function ConditionObj(key, operator, val, boolean) {
        var _operator = __operators[0], _boolean = __booleans[0];
        Object.defineProperty(this, 'boolean', {
            get: function () {
                return _boolean;
            },
            set: function (boolean) {
                _boolean = Algorithm.getBoolean(boolean);
            }
        });
        Object.defineProperty(this, 'operator', {
            get: function () {
                return _operator;
            },
            set: function (operator) {
                _operator = Algorithm.getOperator(operator);
            }
        });
        this.field = key;
        this.value = val;
        this.boolean = boolean;
        this.operator = operator;
    }

    /**
     *
     * @param boolean
     * @constructor
     */
    function WhereObj(boolean) {
        var _boolean, _conditionArr = [];
        Object.defineProperty(this, 'boolean', {
            get: function () {
                return _boolean;
            },
            set: function (boolean) {
                _boolean = Algorithm.getBoolean(boolean);
            }
        });
        Object.defineProperty(this, 'conditions', {
            get: function () {
                return _conditionArr;
            }
        });
        this.boolean = boolean;

        /**
         *
         * @param key
         * @param operator
         * @param val
         * @param boolean
         * @returns {WhereObj}
         */
        this.where = function (key, operator, val, boolean) {
            var that = this;
            if (Helper.isObject(key)) {
                boolean = operator;
                for (var k in key) {
                    if (key.hasOwnProperty(k)) {
                        that.where(k, __operators[0], key[k], boolean);
                    }
                }
            } else if (Helper.isString(key) && String(key).length > 0) {
                if (arguments.length == 2) {
                    val = operator;
                    _conditionArr.push(new ConditionObj(key, __operators[0], val));
                } else {
                    _conditionArr.push(new ConditionObj(key, operator, val, boolean));
                }
            } else if (Helper.isFunction(key)) {
                boolean = operator;
                var w_obj = new WhereObj(boolean);
                key.call(w_obj);
                _conditionArr.push(w_obj);
            }
            return this;
        };

        var resolveCondition = function (params, cond) {
            if (cond instanceof WhereObj) {
                return cond.isMatch(params);
            } else if (cond instanceof ConditionObj) {
                var field = cond['field'];
                var value = cond['value'];
                value = String(value).replace(escape_rgx, function (match) {
                    return '\\' + escapes[match];
                });
                var j_bok = false;
                if (Helper.isDefined(params[field])) {
                    switch (cond['operator']) {
                        case '=':
                        case '==':
                            j_bok = params[field] == value;
                            break;
                        case '===':
                            j_bok = params[field] === value;
                            break;
                        case '!=':
                            j_bok = params[field] != value;
                            break;
                        case '<>':
                        case '!==':
                            j_bok = params[field] !== value;
                            break;
                        case '<':
                        case '<<':
                            j_bok = params[field] < value;
                            break;
                        case '<=':
                            j_bok = params[field] <= value;
                            break;
                        case '>':
                        case '>>':
                            j_bok = params[field] > value;
                            break;
                        case '>=':
                            j_bok = params[field] >= value;
                            break;
                        case 'like':
                            var regExpStr = String(value)
                                .replace(/%/g, '(.*)');
                            var regExpObj = new RegExp("^" + regExpStr + "$");
                            j_bok = regExpObj.test(params[field]);
                            break;
                        default :
                            j_bok = false;
                    }
                }
                return j_bok;
            }
            return Helper.isBoolean(cond) ? cond : false;
        };

        this.isMatch = function (data) {
            var that = this;
            var conditions = that.conditions;
            //如果condition为空，则反回true
            if (conditions.length == 0) {
                return true;
            }
            //var firstCond = conditions[0];
            var bool = false;
            Helper.each(conditions, function (i, cond) {
                if (parseInt(i) > 0) {
                    //if 'or'
                    if (Helper.inArray(cond['boolean'], __booleans_or_arr, 0) != -1) {
                        bool = bool || resolveCondition(data, cond);
                    } else {
                        bool = bool && resolveCondition(data, cond);
                    }
                } else {
                    bool = resolveCondition(data, cond);
                }
            });
            return bool;
        }
    }

    var Helper = {
        /**
         *
         * @param elem
         * @param arr
         * @param i
         * @returns {number}
         */
        inArray: function (elem, arr, i) {
            var len;

            if (arr) {
                if ([].indexOf) {
                    return Array.prototype.indexOf.call(arr, elem, i);
                }

                len = arr.length;
                i = i ? i < 0 ? Math.max(0, len + i) : i : 0;

                for (; i < len; i++) {
                    // Skip accessing in sparse arrays
                    if (i in arr && arr[i] === elem) {
                        return i;
                    }
                }
            }
            return -1;
        },

        /**
         *
         * @param text
         * @returns {string}
         */
        trim: function (text) {
            return text == null ? "" : ( text + "" ).replace(r_trim, "");
        },

        /**
         *
         * @param o
         * @returns {string}
         */
        getType: function (o) {
            return Object.prototype.toString.call(o);
        },
        /**
         *
         * @returns {boolean}
         */
        isNull: function (o) {
            return this.getType(o) == '[object Null]';
        },
        /**
         *
         * @returns {boolean}
         */
        isNumber: function (o) {
            return this.getType(o) == '[object Number]';
        },
        /**
         *
         * @param o
         * @returns {boolean}
         */
        isString: function (o) {
            return this.getType(o) == '[object String]';
        },
        /**
         *
         * @param o
         * @returns {boolean}
         */
        isArray: function (o) {
            return this.getType(o) == '[object Array]';
        },
        /**
         *
         * @returns {boolean}
         */
        isObject: function (o) {
            return this.getType(o) == '[object Object]';
        },
        /**
         *
         * @returns {boolean}
         */
        isFunction: function (o) {
            return this.getType(o) == '[object Function]';
        },
        /**
         *
         * @param o
         * @returns {boolean}
         */
        isDefined: function (o) {
            return typeof o != 'undefined';
        },
        /**
         *
         * @param obj
         * @returns {boolean}
         */
        isWindow: function (obj) {
            /* jshint eqeqeq: false */
            return obj != null && typeof (obj['window'] != 'undefined') && obj == obj.window;
        },
        /**
         *
         * @param obj
         * @returns {boolean}
         */
        isEmptyObject: function (obj) {
            var i = 0, name;
            for (name in obj) {
                i++;
                if (i > 0) return false;
            }
            return true;
        },

        /**
         *
         * @param obj
         * @returns {*}
         */
        isPlainObject: function (obj) {
            var key, that = this;

            // Must be an Object.
            // Because of IE, we also have to check the presence of the constructor property.
            // Make sure that DOM nodes and window objects don't pass through, as well
            if (!obj || typeof (obj) !== "object" || obj.nodeType || that.isWindow(obj)) {
                return false;
            }
            var hasOwnProperty = Object.prototype.hasOwnProperty;
            try {

                // Not own constructor property must be Object
                if (obj.constructor && !hasOwnProperty.call(obj, "constructor") && !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
                    return false;
                }
            } catch (e) {

                // IE8,9 Will throw exceptions on certain host objects #9897
                return false;
            }

            // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.
            for (key in obj) {
            }

            return key === undefined || hasOwnProperty.call(obj, key);
        },

        /**
         *
         * @param obj
         * @returns {*}
         */
        copy: function (obj) {
            var that = this;
            if (Helper.isNull(obj) || typeof obj != 'object') {
                return obj;
            }

            var new_obj = Helper.isArray(obj) ? [] : {};
            Helper.each(obj, function (i, n) {
                new_obj[i] = that.copy(n);
            });
            return new_obj;
        },

        /**
         *
         * @returns {*|{}}
         */
        extend: function () {
            var src, copyIsArray, copy, name, options, clone,
                target = arguments[0] || {},
                i = 1,
                length = arguments.length,
                deep = false;

            // Handle a deep copy situation
            if (typeof target === "boolean") {
                deep = target;

                // skip the boolean and the target
                target = arguments[i] || {};
                i++;
            }

            // Handle case when target is a string or something (possible in deep copy)
            if (typeof target !== "object" && !Helper.isFunction(target)) {
                target = {};
            }

            // extend itself if only one argument is passed
            if (i === length) {
                target = this;
                i--;
            }

            for (; i < length; i++) {

                // Only deal with non-null/undefined values
                if (( options = arguments[i] ) != null) {

                    // Extend the base object
                    for (name in options) {
                        if (options.hasOwnProperty(name)) {
                            src = target[name];
                            copy = options[name];

                            // Prevent never-ending loop
                            if (target === copy) {
                                continue;
                            }

                            // Recurse if we're merging plain objects or arrays
                            if (deep && copy && ( Helper.isPlainObject(copy) ||
                                ( copyIsArray = Helper.isArray(copy) ) )) {

                                if (copyIsArray) {
                                    copyIsArray = false;
                                    clone = src && Helper.isArray(src) ? src : [];

                                } else {
                                    clone = src && Helper.isPlainObject(src) ? src : {};
                                }

                                // Never move original objects, clone them
                                target[name] = Helper.extend(deep, clone, copy);

                                // Don't bring in undefined values
                            } else if (copy !== undefined) {
                                target[name] = copy;
                            }
                        }
                    }
                }
            }

            // Return the modified object
            return target;
        },

        /**
         *
         * @param obj
         * @param callback
         * @returns {*}
         */
        each: function (obj, callback) {
            var length, i = 0;
            if (Helper.isArray(obj)) {
                length = obj.length;
                for (; i < length; i++) {
                    if (callback.call(obj[i], i, obj[i]) === false) {
                        break;
                    }
                }
            } else {
                for (var k in obj) {
                    if (obj.hasOwnProperty(k) && callback.call(obj[k], k, obj[k]) === false) {
                        break;
                    }
                }
            }

            return obj;
        }
    };

    // Add some isType methods: isArguments, isFunction, isNumber, isDate, isRegExp, isError.
    Helper.each(['Arguments', 'Date', 'RegExp', 'Error'], function (i, name) {
        Helper['is' + name] = function (obj) {
            return Helper.getType(obj) === '[object ' + name + ']';
        };
    });

    var Algorithm = {
        extend: function () {
            Helper.extend.apply(this, arguments);
        },
        splitName: function (name, glue) {
            glue = glue ? glue : ' ';
            name = Helper.trim(name.replace(/\s+/g, ' '));
            var arr = name.split(glue);
            name = arr[0];
            return [name, (arr.length > 1 ? arr[1] : name)];
        },
        getJoinType: function (join_type) {
            return Helper.inArray(String(join_type).toLocaleLowerCase(), __join_types, 0) != -1 ? join_type : __join_types[2];
        },
        getReverseType: function (rudder) {
            return (String(rudder).toLocaleLowerCase() == 'desc' || rudder == true || rudder == 1) ? 1 : 0;
        },
        getBoolean: function (boolean) {
            boolean = Helper.inArray(boolean, ['and', 'or'], 0) != -1 ? __booleans_map[boolean] : boolean;
            return (Helper.isString(boolean) && Helper.inArray(boolean, __booleans, 0) > -1 ? boolean : __booleans[0]);
        },
        getOperator: function (operator) {
            return (Helper.isString(operator) && Helper.inArray(operator, __operators, 0) > -1 ? operator : __operators[0]);
        },
        getColumns: function (row, fields) {
            var columns = [], f;
            var _fields = fields;//should be array
            _fields = _fields.length > 0 ? _fields : ['*'];
            //field
            var field_count = 0;
            for (var i = 0; i < _fields.length; i++) {
                var field = _fields[i];
                if (Helper.isString(field)) {
                    //去掉左右空格
                    field = Helper.trim(field);
                    /**
                     * if '*', display all fields;
                     */
                    if (/^\s*\*\s*$/gi.test(field)) {
                        field_count++;
                        for (f in row) {
                            if (row.hasOwnProperty(f)) {
                                columns.push({field: f, alias: ''});
                            }
                        }
                    } else {
                        var arr = field.replace(/\s+(as)\s+/i, ' ').split(' ');
                        columns.push({field: arr[0], alias: (arr[1] ? arr[1] : '')});
                    }
                } else if (Helper.isObject(field)) {
                    for (f in field) {
                        if (field.hasOwnProperty(f)) {
                            columns.push({field: f, alias: Helper.isString(field[f]) ? field[f] : ''});
                        }
                    }
                }
            }
            //Debug.log(columns);
            return columns;
        },
        /**
         *
         * @param list1
         * @param key1
         * @param list2
         * @param key2
         * @param join_type
         * @param row_callback
         * @returns {Array}
         */
        join: function (list1, key1, list2, key2, join_type, row_callback) {
            var that = this, result = [], row2_temp = list2[0];// Object.keys(list2[0]);
            var groups = that.getGroups(list2, key2);
            //Debug.log(key1,key2,list1);

            Helper.each(list1, function (i, row1) {
                var val = row1[key1];
                //if it's matched
                if (Helper.isDefined(groups.data[val])) {
                    Helper.each(groups.data[val], function (j, row2) {
                        if (Helper.isFunction(row_callback)) {
                            result.push(Helper.extend({}, row_callback.apply(Helper, [row1, row2, true])));
                        }
                    });
                } else if (Helper.inArray(join_type, ['left', 'right'], 0) != -1 && Helper.isFunction(row_callback)) {
                    result.push(Helper.extend({}, row_callback.apply(Helper, [row1, row2_temp, false])));
                }
            });
            return result;
        },
        /**
         *
         * @param list
         * @param callback
         * @returns {*}
         */
        filter: function (list, callback) {
            var new_list = [];
            if (list.length > 0 && Helper.isFunction(callback)) {
                Helper.each(list, function (i, row) {
                    if (callback.call(row, row, i) == true) {
                        new_list.push(row);
                    }
                });
            } else {
                return list;
            }
            return new_list;
        },
        /**
         *
         * @param list
         * @param order_by_arr
         * @param order_by_i
         * @param callback
         * @returns {*}
         */
        orderBy: function (list, order_by_arr, order_by_i, callback) {
            order_by_i = order_by_i > 0 ? order_by_i : 0;
            var that = this, new_list = [];
            //需要排序
            if (order_by_arr.length > 0 && order_by_i < order_by_arr.length) {
                var sort = order_by_arr[order_by_i];
                var field = sort['field'];

                var groups = that.getGroups(list, field);
                var keys = groups.keys;

                if (keys.length > 0) {
                    if (Helper.isDefined(sort['rudder'])) {
                        var order = sort['rudder'];
                        /**
                         * sort
                         */
                        var reverse = !1;
                        if (Helper.isObject(order)) {
                            if (Helper.isDefined(order['reverse'])) {
                                reverse = that.getReverseType(order['reverse']);
                            }
                        } else {
                            reverse = that.getReverseType(order);
                        }

                        if (Helper.isDefined(order['fx'])) {
                            keys = keys.sort(function (a, b) {
                                var A = parseFloat(order['fx'].call(Vendor, groups.data[a])), B = parseFloat(order['fx'].call(Vendor, groups.data[b]));
                                return (A < B ? -1 : 1) * [1, -1][+!!reverse];
                            });
                        } else {
                            keys = keys.sort(function (a, b) {
                                return Fun.compare(a, b) * [1, -1][+!!reverse];
                            });
                        }
                    }

                    /**
                     * 排好序后遍历输出
                     */
                    Helper.each(keys, function (i, k) {
                        var lst = groups.data[k];
                        lst = that.orderBy(lst, order_by_arr, order_by_i + 1, callback);
                        Helper.each(lst, function (j, row) {
                            new_list.push(row);
                        });
                    });
                } else {
                    return that.orderBy(list, order_by_arr, order_by_i + 1, callback);
                }
            } else {
                Helper.each(list, function (i, row) {
                    if (Helper.isFunction(callback)) {
                        new_list.push(callback.call(row, row, i));
                    } else {
                        new_list.push(row);
                    }
                });
            }
            return new_list;
        },
        /**
         *
         * @param row
         * @param columns
         * @returns {{}}
         */
        getRow: function (row, columns) {
            /**/
            var new_row = {};
            Helper.each(columns, function (k, n) {
                var _f = n['field'];
                if (Helper.isDefined(row[_f])) {
                    new_row[(n['alias'] == '' ? n['field'] : n['alias'])] = row[_f];
                }
            });
            return new_row;
        },
        /**
         *
         * @param list
         * @param field
         * @returns {{data: {}, keys: Array}}
         */
        getGroups: function (list, field) {
            var result = {data: {}, keys: []};
            Helper.each(list, function (i, row) {
                if (Helper.isDefined(row[field])) {
                    var res = true;
                    if (res !== false) {
                        var key = row[field];
                        if (!Helper.isDefined(result['data'][key])) {
                            result.data[key] = [];
                            result.keys.push(key);
                        }
                        result.data[key].push(row);
                    }
                }
            });
            return result;
        }
    };

    // Define a local copy of Model
    var Model = function (data, callback) {
        // The Model object is actually just the init constructor 'enhanced'
        // Need init if Model is called (just allow error to be thrown if not included)
        return new Model.fn.table(data, callback);
    };

    Model.fn = Model.prototype = {
        // The current version of Model being used
        version: version,

        constructor: Model,
        // Execute a callback for every element in the matched set.
        extend: function () {
            return Helper.extend.apply(this, arguments);
        },
        table: function (data, callback) {
            var that = this;
            if(arguments.length>0){
                that.clear();
                __data = data;
                __time = (new Date()).getTime();
                if (arguments.length > 1 && Helper.isFunction(callback)) {
                    return this.filter(callback);
                }
            }
            return this;
        },
        debug: function (debug) {
            _debug = debug==false;
            return this;
        }
    };

    Model.fn.extend({
        /**
         * clear bindings
         * @returns {*}
         */
        clear: function () {
            __bindings = {
                where: new WhereObj('&&'), //condition
                fields: [], // select fields
                limit: [], //paging
                order_by: [] //sort by
            };
            return this;
        },
        /**
         *
         * @param data
         * @returns {*}
         */
        from: function (data) {
          return this.table(data);
        },
        /**
         * set fields
         * @param fields
         * @returns {*}
         */
        fields: function (fields) {
            var that = this;
            if (Helper.isString(fields) || Helper.isObject(fields)) {
                __bindings['fields'].push(fields);
            } else if (Helper.isArray(fields)) {
                Helper.each(fields, function (i, field) {
                    that.fields(field);
                });
            }
            return this;
        },
        /**
         * join other table
         * @param key1
         * @param list2
         * @param key2
         * @param join_type
         * @returns {*}
         */
        join: function (key1, list2, key2, join_type) {
            var that = this;

            join_type = Algorithm.getJoinType(join_type);
            var t2_arr = Algorithm.splitName(key2, '.');
            var t2_alias = t2_arr[0];
            key2 = t2_arr[1];
            var get_new_row = function (one, second, is_both) {
                var obj = {};
                for (var lf in one) {
                    if (one.hasOwnProperty(lf)) {
                        obj[lf] = one[lf];
                    }
                }
                for (var rf in second) {
                    if (second.hasOwnProperty(rf)) {
                        var _nrf = rf.indexOf('.') > -1 ? rf : t2_alias + '.' + rf;
                        obj[_nrf] = (is_both == true ? second[rf] : null);
                    }
                }
                return obj;
            };

            if (join_type == 'right' || (join_type == 'inner' && __data.length > list2.length)) {
                __data = Algorithm.join(list2, key2, __data, key1, join_type, get_new_row);
            } else {
                __data = Algorithm.join(__data, key1, list2, key2, join_type, get_new_row);
            }
            Debug.log("end of join,data.length:", __data.length);
            return that;
        },

        /**
         *
         * @param field
         * @param operator
         * @param val
         * @param boolean
         * @returns {*}
         */
        where: function (field, operator, val, boolean) {
            __bindings['where'].where(field, operator, val, boolean);
            return this;
        },
        /**
         *
         * @param field
         * @param values
         * @param boolean
         * @returns {*}
         */
        where_in: function (field, values, boolean) {
            var that = this;
            if (Helper.isString(field)) {
                that.where(function () {
                    if (Helper.isArray(values)) {
                        for (var k in values) {
                            if (values.hasOwnProperty(k)) {
                                this.where(field, __operators[0], values[k], __booleans_or_arr[0]);
                            }
                        }
                    }
                }, boolean);
            }
            return that;
        },
        /**
         *
         * @param field
         * @param values
         * @param boolean
         * @returns {*}
         */
        where_not_in: function (field, values, boolean) {
            var that = this;
            if (Helper.isString(field)) {
                that.where(function () {
                    if (Helper.isArray(values)) {
                        for (var k in values) {
                            if (values.hasOwnProperty(k)) {
                                this.where(field, '!=', values[k], __booleans[0]);
                            }

                        }
                    }
                }, boolean);
            }
            return that;
        },
        /**
         *
         * @param field
         * @param range
         * @param boolean
         * @returns {*}
         */
        where_between: function (field, range, boolean) {
            var that = this;
            if (Helper.isArray(range) && range.length > 1) {
                that.where(function () {
                    this.where(field, '>', Math.min(range[0], range[1]), boolean);
                    this.where(field, '<', Math.max(range[0], range[1]), boolean);
                }, boolean);
            }
            return that;
        },
        /**
         *
         * @param field
         * @param value
         * @param boolean
         * @returns {*}
         */
        where_like: function (field, value, boolean) {
            var that = this;
            that.where(field, 'like', value, boolean);
            return that;
        },
        /**
         * set order by
         * @param field
         * @param rudder
         * @returns {*}
         */
        order_by: function (field, rudder) {
            var that = this;
            if (Helper.isArray(field)) {
                Helper.each(field, function (i, f) {
                    that.order_by(f, rudder);
                });
            } else if (Helper.isObject(field)) {
                Helper.each(field, function (f, d) {
                    that.order_by(f, d);
                })
            } else if (Helper.isString(field)) {
                __bindings['order_by'].push({"field": field, "rudder": rudder});
            }
            return this;
        },
        /**
         *
         * @param offset
         * @param size
         * @returns {*}
         */
        limit: function (offset, size) {
            if (arguments.length == 1) {
                __bindings['limit'] = [0, Math.max(0, offset)];
            } else if (arguments.length > 1) {
                __bindings['limit'] = [Math.max(0, offset), Math.max(0, offset + size)];
            }
            return this;
        },
        /**
         *
         * @returns {Array}
         */
        get: function () {
            var that = this;
            var list = __data;

            //Debug.log(__data[0]);
            var columns = Algorithm.getColumns(__data[0], __bindings['fields']);
            Debug.log('columns:', columns);
            /**
             * 如果有where 则筛选。
             */
            if (__bindings['where'].conditions.length > 0) {
                list = Algorithm.filter(list, function (row) {
                    return __bindings['where'].isMatch(row);
                });
            }

            /**
             * 如果需要排序
             */
            if (__bindings['order_by'].length > 0) {
                list = Algorithm.orderBy(list, __bindings['order_by'], 0, function (row) {
                    return Algorithm.getRow(row, columns);
                });
            } else {
                var newList = [];
                Helper.each(list, function (i, row) {
                    newList.push(Algorithm.getRow(row, columns));
                });
                list = newList;
            }
            /**
             * 如果有分页
             */
            if (__bindings['limit'].length > 0) {
                list = list.slice(__bindings['limit'][0], Math.min(__bindings['limit'][1], list.length));
            }
            Debug.log("Result::", list);
            that.clear();
            return list;
        },
        find: function () {
            if(arguments){
                this.where.call(this,arguments);
            }
            var list = this.get();
            return list.length > 0 ? list[0] : null;
        },
        /**
         *
         * @returns {number}
         */
        remove: function () {
            if(arguments.length>0){
                this.where.apply(this, arguments);
            }

            /**
             * 如果有where 则筛选。
             */
            var effect_rows = 0;

            if (__bindings['where'].conditions.length > 0) {
                var list = Algorithm.filter(__data, function (row) {
                    if (__bindings['where'].isMatch(row)) {
                        effect_rows++;
                        return true;
                    }
                    return false;
                });
                __data = [];
                Helper.each(list, function () {
                    __data.push(this);
                });
            } else {
                effect_rows = __data.length;
                __data = [];
            }
            return effect_rows;
        },
        update: function (data) {
            if (!Helper.isObject(data)) {
                return 0;
            }
            /**
             * 如果有where 则筛选。
             */
            var effect_rows = 0;

            if (__bindings['where'].conditions.length > 0) {
                Helper.each(__data, function (i, row) {
                    //匹配上的则更新
                    if (__bindings['where'].isMatch(row)) {
                        effect_rows++;
                        for (var k in data) {
                            if (data.hasOwnProperty(k)) {
                                __data[i][k] = data[k];
                            }
                        }
                    }
                });

            } else {
                Helper.each(__data, function (i) {
                    effect_rows++;
                    for (var k in data) {
                        if (data.hasOwnProperty(k)) {
                            __data[i][k] = data[k];
                        }
                    }
                });
            }
            return effect_rows;
        },
        fetch: function (callback) {
            var that = this;
            var list = that.get();

            if (Helper.isFunction(callback)) {
                Debug.log('fetch begin');
                Helper.each(list, callback);
                Debug.log('fetch end');
                return that;
            }

            return list;
        },
        select: function (fields) {
            return this.fields(fields).get();
        },
        count: function () {
            return this.get().length;
        },
        filter: function (where) {
            if (arguments.length > 0) {
                if (Helper.isFunction(where)) {
                    return Algorithm.filter(__data, where);
                } else {
                    this.where.apply(this, arguments);
                    return this.get();
                }
            }
            return __data;
        }
    });

    // Give the init function the iModel prototype for later instantiation
    Model.fn.table.prototype = Model.fn;

    Model.fn.size = function () {
        return this.length;
    };

    return Model;
}));
