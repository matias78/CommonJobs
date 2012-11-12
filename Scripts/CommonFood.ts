﻿///<reference path='jquery.d.ts' />
///<reference path='Knockout.d.ts' />
///<reference path='underscore.browser.d.ts' />
///<reference path="moment.d.ts" />


//#region Underscore personalizations
declare interface UnderscoreVoidIMenuItemListIterator {
    (element : CommonFood.MenuDataItem, index : number, list : CommonFood.MenuDataItem[]) : void;
}

declare interface UnderscoreStatic extends Function {
    each(list: CommonFood.MenuDataItem[], iterator: UnderscoreVoidIMenuItemListIterator, context?: any): void;
}
//#endregion

module Utilities {
    export class IdGenerator {
        constructor (public chars = "abcdefghijklmnopqrstuvwxyz1234567890", public length = 8) {
        }
        public generate(prefix = "") {
            var chars = this.chars;
            var charsL = chars.length;
            return prefix + _.map(_.range(this.length), () => chars[_.random(0, charsL)]).join("");
        };
    }

    export class HasCallbacks {
	    constructor() {
		    var _this = this, _constructor = (<any>this).constructor;
		    if (!_constructor.__cb__) {
			    _constructor.__cb__ = {};
			    for (var m in this) {
				    var fn = this[m];
				    if (typeof fn === 'function' && m.indexOf('__cb__') == -1) {
					    _constructor.__cb__[m] = fn;					
				    }
			    }
		    }
		    for (var m in _constructor.__cb__) {
			    (function (m, fn) {
				    _this[m] = function () {
					    return fn.apply(_this, Array.prototype.slice.call(arguments));						
				    };
			    })(m, _constructor.__cb__[m]);
		    }
	    }
    }

}

module CommonFood {

    export interface Days {
        (): number[];
        getName(day: number): string;
        isValid(day: number): bool;
    }

    export var days = <Days>(function () { 
        var DAYS = [1, 2, 3, 4, 5];
        var def = function () {
            return DAYS;
        }
        def["getName"] = function (day: number) {
            return moment().day(day).format("dddd");
        };
        def["isValid"] = function (day: number) {
            return DAYS.indexOf(day) >= 0;
        };
        return def; 
    })();

    export interface MenuDataItem {
        week: number;
        day: number;
        option: string;
        food: string;
    }

    export interface KeyText {
        key: string;
        text: string;
    }

    export interface MenuData {
        title?: string;
        firstWeek?: number;
        weeks?: number;
        options?: KeyText[];
        places?: KeyText[];
        startDate?: string;
        endDate?: string;
        deadlineTime?: string;
        foods?: MenuDataItem[]; 
    }

    interface KeyObservableText { 
        key: string; 
        text: knockout.koObservableString; 
    }

    export interface DayFoods {
        [s: string]: knockout.koObservableString;
    }

    export interface EmployeeMenuDataItem {
        week: number;
        day: number;
        option: string;
        place?: string;
    }

    export interface EmployeeMenuDataOverrideItem {
        date: string;
        cancel?: bool;
        option?: string; 
        place?: string;
        comment?: string;
    }

    export interface EmployeeMenuData {
        employeeId: string;
        name: string;
        defaultPlace: string;
        choices: EmployeeMenuDataItem[];
        overrides: EmployeeMenuDataOverrideItem[];
    }

    export class EmployeeMenuDefinition extends Utilities.HasCallbacks {
        menu: MenuDefinition;
        name: string;
        employeeId: string;
        defaultPlace: knockout.koObservableString;


        constructor (menu: MenuDefinition, data: EmployeeMenuData) {
            super();
            this.prepareMenu(menu);
            this.reset(data);
        }

        private prepareMenu(menu: MenuDefinition) {
            this.menu = menu;
            //TODO
        }

        reset(data: EmployeeMenuData) {
            this.employeeId = data.employeeId;
            this.name = data.name;
            this.defaultPlace = ko.observable(data.defaultPlace);

            _.each(data.choices, choice => { 
                //TODO
            });

            _.each(data.overrides, override => { 
                //TODO
            });

        }

        exportData(): EmployeeMenuData {
            var data: EmployeeMenuData = {
                employeeId: this.employeeId,
                name: this.name,
                defaultPlace: this.defaultPlace(),
                choices: [],
                overrides: []
            };

            //TODO: choices
            //TODO: overrides
            return data;
        }
    }
    
    interface ByDayCollectionDataItem {
        week: number;
        day: number;
        value: any;
    }

    interface ByDayCollectionData {
        weeks?: number;
        items?: ByDayCollectionDataItem[];
    }

    class ByDayCollection extends Utilities.HasCallbacks {
        weeks: knockout.koObservableNumber = ko.observable(0);
        items: knockout.koObservableArrayBase = ko.observableArray();
        //TODO:
        //items: ByDayCollectionDataItem[][];

        constructor (data?: ByDayCollectionData) {
            super();
            this.reset(data);
        }

        reset(data?: ByDayCollectionData) {
            var i: any;
            data = _.extend({ weeks: 0, items: [] }, data);
            this.weeks(0);
            this.items.removeAll();

            for (i = 0; i < data.weeks; i++) {
                this.addWeek();
            }
        }

        addWeek() {
            var weekItems = [];

            for (var i = 0; i < 7; i++) {
                var dayItem = this.createNewItem();
                weekItems.push(dayItem);
            }
            this.items.push(weekItems);
            this.weeks(this.weeks() + 1);
        }

        removeWeek() {
            var actual = this.weeks();
            if (actual > 0) {
                this.weeks(actual - 1);
                this.items.pop();
            }    
        }

        createNewItem() {
            return null;
        }

        getItem(week: number, day: number) {
            return days.isValid(day) && week < this.weeks() 
                ? this.items()[week][day] 
                : null;
        }

        eachWeek(f: (weekFoods: DayFoods[], weekIndex: number) => void ) {
            _.each(this.items(), (weekFoods, weekIndex) => f(weekFoods, weekIndex));
        }

        eachDay(f: (dayFoods: DayFoods, dayIndex: number, weekIndex: number) => void ) {
            this.eachWeek((weekFoods, weekIndex) => 
                _.each(weekFoods, (dayFoods, dayIndex) => 
                    f(dayFoods, weekIndex, dayIndex)));
        };
    }

    class MenuDefinitionByDayCollection extends ByDayCollection {
        constructor (private menu: MenuDefinition, data?: MenuData) {
            super(data);
        }

        reset(data?: MenuData) {
            super.reset(data);

            if (data && data.foods) {
                _.each(data.foods, x => {
                    var option = this.getFood(x.week, x.day, x.option);
                    if (option) {
                        option(x.food)
                    }
                });
            }
        }

        createNewItem() {
            var item: DayFoods = {};
            _.each(this.menu.options(), option => 
                item[option.key] = ko.observable(""));
            return item;
        }

        getItem(week: number, day: number): DayFoods {
            return super.getItem(week, day);
        }

        getFood(week: number, day: number, option: string): knockout.koObservableString {
            var dayFoods = this.getItem(week, day);
            return dayFoods && dayFoods[option];
        }
    }
    
    export class MenuDefinition extends Utilities.HasCallbacks  {
        static defaultData: MenuData = {
            title: "Nuevo Menú",
            firstWeek: 0,
            weeks: 0,
            options: [],
            places: [],
            startDate: "2000-01-01",
            endDate: "2100-01-01",
            deadlineTime: "09:30",
            foods: []
        };

        items: MenuDefinitionByDayCollection;
        title: knockout.koObservableString = ko.observable("");
        weeks: knockout.koObservableNumber;
        options: knockout.koObservableArrayBase = ko.observableArray();
        places: knockout.koObservableArrayBase = ko.observableArray();
        startDate: knockout.koObservableAny = ko.observable("");
        endDate: knockout.koObservableAny = ko.observable("");
        deadlineTime: knockout.koObservableString = ko.observable("");
        firstWeek: knockout.koObservableNumber = ko.observable(0);
        foods: knockout.koObservableArrayBase;
        static idGenerator = new Utilities.IdGenerator();

        constructor (data?: MenuData) {
            super();
            this.items = new MenuDefinitionByDayCollection(this);
            this.weeks = this.items.weeks;
            this.foods = this.items.items;
            this.reset(data);
        }

        private createKeyTextObservableArray(items: KeyText[]) {
            return ko.observableArray(_.map(items, (item) => { 
                return {
                    key: item.key,
                    text: ko.observable(item.text)
                };
            }));
        }

        reset(data?: MenuData) {
            data =  <MenuData>$.extend({}, MenuDefinition.defaultData, data);
            var i: any;
            this.title(data.title);
            this.startDate(data.startDate);
            this.endDate(data.endDate);
            this.firstWeek(data.firstWeek);
            this.deadlineTime(data.deadlineTime);

            this.places.removeAll();
            for (i in data.places) {
                this.addPlace(data.places[i]);
            } 

            this.options.removeAll();
            for (i in data.options) {
                this.addOption(data.options[i]);
            }

            this.items.reset(data);
        
        /*
            var opts = {};
            _.each(this.options(), x => { opts[x.key] = true; });

            if (data.foods) {
                _.each(data.foods, x => {
                    var item = this.items.getItem(x.week, x.day);
                    if (item && opts[x.option]) {
                        item[x.option](x.food);
                    }
                });
            }
*/
        }
        
        exportData(): MenuData {
            var data: MenuData = { 
                title: this.title(),
                firstWeek: this.firstWeek(),
                weeks: this.weeks(),
                startDate: this.startDate(),
                endDate: this.endDate(),
                places: ko.toJS(this.places),
                options: ko.toJS(this.options),
                foods: [] 
            };

            this.items.eachDay((dayFoods, weekIndex, dayIndex) => {
                var food;
                for (var opt in dayFoods) {
                    if (food = dayFoods[opt]()) {
                        data.foods.push({
                            week: weekIndex,
                            day: dayIndex,
                            option: opt,
                            food: food
                        });
                    }
                }
            });

            return data;
        }

        getFood(weekIndex: number, dayIndex: number, opt: string): knockout.koObservableString {
            return this.items.getFood(weekIndex, dayIndex, opt);
        }

        //#region KeyObservableText collection helpers

        private generateText(baseName: string, collection: knockout.koObservableArrayBase, name?: string): string {
            var texts = _.map(ko.toJS(collection), (item) => item.text);
            var n = texts.length + 1;
            
            if (name) {
                if ((<any>name).text) {
                    name = (<any>name).text;
                }
                if (_.isString(name)) {
                    if (texts.indexOf(name) == -1) {
                        return name;
                    } else {
                        baseName = name;
                        n = 2;
                    }
                }
            }

            while (true) {
                var name = baseName + n++;
                if (texts.indexOf(name) == -1) 
                    return name;
            }
        }

        private addKeyObservableText(collection: knockout.koObservableArrayBase, baseName: string, idPrefix: string, value?: any): KeyObservableText {
            var item: KeyObservableText;
            if (!value || !value.key) {
                var text = this.generateText(baseName, collection, value);
                item = { key: MenuDefinition.idGenerator.generate(idPrefix), text: ko.observable(text) };
            } else {
                item = { key: value.key, text: ko.observable(value.text) };
            }
            collection.push(item);
            return item;
        }

        private removeItem(collection: knockout.koObservableArrayBase, item: any) : KeyObservableText {
            if (!collection().length)
                return null;

            if (_.isString(item)) 
                return collection.remove(x => x.key == item);
            
            var index: number = _.isNumber(item) ? item : collection.indexOf(item); 
            return collection.splice(index, 1)[0];
        }

        //#endregion

        addWeek() {
            this.items.addWeek();
        }

        removeWeek() {
            this.items.removeWeek();
        };
    
        addOption(option?: any) {
            var op = this.addKeyObservableText(this.options, "Menú ", "menu_", option);
            this.items.eachDay(dayFoods => {
                dayFoods[op.key] = ko.observable("")
            })
        }
  
        removeOption(option?) {
            var removed = this.removeItem(this.options, option);
            if (removed) { 
                this.items.eachDay(dayFoods =>  delete dayFoods[removed.key]);
            }
        };

        addPlace(place?: any) {
            this.addKeyObservableText(this.places, "Lugar ", "place_", place);
        }
        
        removePlace(place?) {
            this.removeItem(this.places, place);
        };
    }
}