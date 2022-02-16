# Layout Shift GIF Generator - CLI

[https://defaced.dev/tools/layout-shift-gif-generator/](https://defaced.dev/tools/layout-shift-gif-generator/)

_Visualise the Core Web Vitals metric Cumulative Layout Shift (CLS) with a simple GIF._

Lighthouse is a great tool for identifying your overall Cumulative Layout Shift (CLS) score, but it's not so great for quickly visualising what's actually shifting on a page. The Layout Shift GIF Generator allows you to quickly identify which elements are moving around in the viewport.

> **Support this project** <br/> Help support the work that goes into creating and maintaining my projects and buy me a coffee via [Ko-fi](https://ko-fi.com/defaced) or sponsor me on [GitHub Sponsors](https://github.com/sponsors/workeffortwaste/).

## Getting Started

### Installation

The Layout Shift GIF Generator command line tool can be installed directly from NPM.

```
npm install -g layout-shift-gif
```

### Usage

Once installed the tool can be used as per the following example.

```
layout-shift-gif --url https://blacklivesmatter.com/ --device mobile --output layout-shift.gif
```

This will generate an animated `layout-shift.gif` of `https://blacklivesmatter.com/` showing the regions of Cumulative Layout Shift on the viewport of a simulated `mobile` device.

### Options

```
Options:
      --help     Show help                                             [boolean]
      --version  Show version number                                   [boolean]
  -u, --url      Website URL                                 [string] [required]
  -d, --device   Device type                        [string] [default: "mobile"]
  -w, --width    Device viewport width                                  [number]
  -h, --height   Device viewport height                                 [number]
  -c, --cookies  Cookie filename                                        [string]
  -o, --output   Output filename          [string] [default: "layout-shift.gif"]
  -t, --type     CLS calculation method                [string] [default: "new"]
```
## Examples
### Basic Examples

#### Simulated Mobile Device

```
layout-shift-gif --url https://blacklivesmatter.com/ --device mobile
```

#### Simulated Desktop Device

```
layout-shift-gif --url https://blacklivesmatter.com/ --device desktop
```

### Advanced Examples

#### Supplying Cookies

You can supply a cookie file in the Puppeteer JSON format allowing you to bypass cookie notices, or interstitals.

I recommend using the [Export cookie JSON file for Puppeteer](https://chrome.google.com/webstore/detail/%E3%82%AF%E3%83%83%E3%82%AD%E3%83%BCjson%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E5%87%BA%E5%8A%9B-for-puppet/nmckokihipjgplolmcmjakknndddifde?hl=en) Chrome extension to export your cookies in the correct format.

```
layout-shift-gif --url https://blacklivesmatter.com/ --cookies cookies.json
```

#### Original CLS Calculation Method

In June 2021 Google changed how they [calculate the CLS metric](https://web.dev/cls-web-tooling/). Layout Shift GIF Generator defaults to the newest method, but if you require the old method it can still be access viable the `--type` option.


```
layout-shift-gif --url https://blacklivesmatter.com/ --type old
```


## Device Simulation

The tool is able to check both a desktop and a mobile viewport.

- The `desktop` viewport is a standard 1920x1080 resolution.

- The `mobile` viewport is the Nexus 5X profile from Lighthouse.

Both the CPU and the network are throttled to simulate a `good 3G network`.

## Hosted Version

If you don't wish to use the CLI version there is also a free hosted version running in a cloud function available on [defaced.dev](https://defaced.dev/tools/layout-shift-gif-generator/)

## Output

An outline of how to interpret the GIF output from this tool.

### Page Screenshot

The screenshot of the page is taken after all the page elements have shifted and the CLS has been calculated.

### Border Style

The border style of an outlined element represents the start and end positions of the elements shift.

- A `dashed` border indicates the element's starting position.

- A `solid` border indicates the element's end position.

### Border Colour

The border colour of an outlined element represents the CLS score of that element against the overall page thresholds for CLS [outlined by Google](https://web.dev/defining-core-web-vitals-thresholds/).

🟢 Good `≤` 0.1  

🟠 Needs Improvement 	

🔴 Poor `>` 0.25 

This means that if you see a shifting element with a red or orange outline then this element alone is contributing significantly to a negative CLS score for that page.

### Corner Metric

The metric in the top left corner is the overall CLS score for that page and is the score you'll see in Lighthouse or Pagespeed Insights.

### Corner Colour

The colour of the top left corner represents where the pages overall CLS score fits within the thresholds for CLS [outlined by Google](https://web.dev/defining-core-web-vitals-thresholds/).

🟢 Good `≤` 0.1  

🟠 Needs Improvement 	

🔴 Poor `>` 0.25 

## Sponsors

If you find this project useful please considering sponsoring me on [GitHub Sponsors](https://github.com/sponsors/workeffortwaste/) and help support the work that goes into creating and maintaining my projects.
### Bonus

Sponsors are able to remove the project support message from all my CLI projects, as well as access other additional perks.

## Author

Chris Johnson - [defaced.dev](https://defaced.dev) - [@defaced](http://twitter.co.uk/defaced/)
            
