# Angular Calendar
A useful calendar and date utility module for Angular 1.3x.

---

### Main GitHub Page
http://kryo2k.github.io/angular-calendar/

### Module Overview
The purpose of this module was to be able to easily manipulate dates and times in Angular without any other dependencies (date.js, moment, etc). This is still a work in progress, so might be frequently updated till perfected!

### Getting Started

##### Bower Installation
`bower install angular-calendar-util`

##### Angular Dependency Installation
`angular.module('...', ['angular-calendar'])`

### What's in the box?

#### Factory Classes

* `Calendar(boW, year, week)`

    Supports setting the beginning of week day [0 - 6], year and initial week [1 - 53]. Has an internal pointer for current year and week, when changed it updates calculations.

    Provides many static date utility functions as well.

* `Time(hour, minute, second, msec)`

    Similar to JS Date, but only uses the hour, min, sec, milli. Allows overriding dates with these specific time specs.

* `DateRange(from, to)`

    Stores a simple JS date range (2 dates maximum). Automatically makes sure "from" is before "to". Because of this "from" and "to" are read-only properties. To change internal dates, you must use the "setDates(d1, d2)" function.

    Also provides simple abilities like checking if this range contains a certain date, as well as calculating the distance between two dates. Note, this calculation does NOT take into considerations DST offsets, please use the Calendar class, which does handle this correctly.


* `TimeRange(from, to)`

    Very similar to DateRange, but for Time classes, instead of Dates. These can be dynamically applied to any date.

* `DayGroup(title, range, periods)`

    Called it this, for lack of a better name. Allows defining a customizable set of TimeRanges. This set can have an arbitrary title and range of time spans. It does NOT check if these ranges overlap, repeat, etc. That's up to the callee.

* `Day(groups)`

    Essentially a container for DayGroup classes. Allows applying an arbitrary date against the set of the groups to generate a new simplified group which inherit the date settings while keeping the time ranges defined in the group. This container also keeps track of it's internal range of times (as defined by the group). So when new group(s) are added, the range is updated automatically.

* `DateStore(dateProperty, records)`

    A class for storing records of data with a date property. Also has a method to query data between a date range using an efficient binary search algorithm.

#### Services

* String `$padLeft(str, padSize, padWithStr)`

    Ability to pad a string on the left with N amount of string characters.

* Object `$numberUtil`

    Various number abilities used in classes and other functions.

    Be-careful with 'sequence', it can generate a lot of results, and saturate memory.
    It is internally capped to 10,000 records maximum.

#### Filters

* String `join[:delimiter]`

    A very simple filter for joining an array using a configurable delimiter.

* String `time[:format]`

    Uses the angular date filter to format a Time object. Supports all TIME format parameters that angular date filter supports.

* String `dateRange[:format[:toFormat[:delimiter]]]`

    Uses the angular date and join filters to reender a date range to a string. Supports all format parameters that angular date filter supports.

* String `timeRange[:format[:toFormat[:delimiter]]]`

    Very similar to the dateRange filter, but for formatting TimeRange objects.

### Use cases
* Year week manipulations, taking into consideration DST as well as leap years, etc.
* Date manipulation such as adding/subtracting milliseconds, weeks, months, etc.
* Time, TimeRange, and DateRange objects and more.


### Disclaimer
Again, this is a work in progress. More documentation and examples to follow soon. I am not responsible for any damages caused by this software. If you notice any issues, please report them or better yet, fix them and I can pull in patches.