# Cross Platform Scrollbar Experiments

[live example](https://ffscroller.amadeus.now.sh/)

This is a very simple test case for setting up custom scrollbars that can be
used on the latest versions of most major browsers (Chrome, Firefox, Safari)
across Windows and macOS.  Edge is the main outlier at the moment, but support
should fallback nicely.  Apparently Edge will become Chrome in a few months,
and this example may fix itself over time.

This experiment had a few challenges to overcome.

* Support for custom thin scrollbars
  * Support Chrome and Safari's vendor specific styles
  * Support Firefox's new `scrollbar-width` and `scrollbar-color` CSS props
    * These are becoming a standard, and support may start trickling down into
      Chrome and Safari as well.
* Able to handle differences in macOS settings for `General > Show scroll bars`
* Support for content that has uniform padding around it, both with and without
  scrollbars
* Support scrollbar styles only showing when mousing over the scroll region
