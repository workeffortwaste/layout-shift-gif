# Layout Shift GIF Generator - CLI

[https://defaced.dev/tools/layout-shift-gif-generator/](https://defaced.dev/tools/layout-shift-gif-generator/)

Visualise the Core Web Vitals metric Cumulative Layout Shift (CLS) with a simple GIF.

Lighthouse is a great tool for identifying your overall Cumulative Layout Shift (CLS) score, but it's not so great for quickly visualising what's actually shifting on a page. The Layout Shift GIF Generator allows you to quickly identify which elements are moving around in the viewport.

**Like this project? Help support my projects and buy me a coffee via [Ko-fi](https://ko-fi.com/defaced) or sponsor me on [GitHub Sponsors](https://github.com/sponsors/workeffortwaste/)**.

## Getting Started

### Installation

The Layout Shift GIF Generator command line tool can be installed directly from NPM.

`npm install -g layout-shift-gif`

### Usage

Once installed the tool can be used as per the following example.

`layout-shift-gif --url https://blacklivesmatter.com/ --device mobile --output layout-shift.gif`

This will generate an animated `layout-shift.gif` of `https://blacklivesmatter.com/` showing the regions of Cumulative Layout Shift on the viewport of a simulated `mobile` device.

#### Options

| Option    | Alias | Default     | Description                                                                                                                                                                                                                                                                                                           |   |   |   |   |
|-----------|-------|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---|---|---|---|
| --url     | -u    | (null)      | The URL of the page you want to generate a Layout Shift GIF from. **(Required)**                                                                                                                                                                                                                                     |   |   |   |   |
| --device  | -d    | mobile      | The type of the device you wish to simulate.                                                                                                                                                                                                                                                                          |   |   |   |   |
| --width   | -w    | (412\|1920) | Override the device viewport width.                                                                                                                                                                                                                                                                                   |   |   |   |   |
| --height  | -h    | (732\|1080) | Override the device viewport height                                                                                                                                                                                                                                                                                   |   |   |   |   |
| --cookies | -c    | (null)      | Supply a cookie file in the Puppeteer JSON format. I recommend using this Chrome Extension to export your cookies. [Link](https://chrome.google.com/webstore/detail/%E3%82%AF%E3%83%83%E3%82%AD%E3%83%BCjson%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E5%87%BA%E5%8A%9B-for-puppet/nmckokihipjgplolmcmjakknndddifde?hl=en) |   |   |   |   |

### Device Simulation

The tool is able to check both a desktop and a mobile viewport.

- _The `desktop` viewport is a standard 1920x1080 resolution._

- _The `mobile` viewport is the Nexus 5X profile from Lighthouse._

Both the CPU and the network are throttled simulating a `good 3G network`.

## Hosted Version

If you don't wish to use the CLI version there is also a free hosted version running in a cloud function available on [defaced.dev](https://defaced.dev/tools/layout-shift-gif-generator/)

## Understanding The GIF

### Page Screenshot

The screenshot of the page is taken after all the page elements have shifted and the CLS has been calculated.

### Border Style

The border style of an outlined element represents the start and end positions of the elements shift.

- _A dashed border indicates the element's starting position._

- _A solid border indicates the element's end position._

### Border Colour

The border colour of an outlined element represents the CLS score of that element against the overall page thresholds for CLS outlined by Google. 

[Defining the Core Web Vitals metrics thresholds](https://web.dev/defining-core-web-vitals-thresholds/)

🟢 Good ≤0.1  

🟠 Needs Improvement 	

🔴 Poor >0.25 

This means that if you see a shifting element with a red or orange outline then this element alone is contributing significantly to a negative CLS score for that page.

### Corner Metric

The metric in the top left corner is the overall CLS score for that page and is the score you'll see in Lighthouse or Pagespeed Insights.

### Corner Colour

The colour of the top left corner represents where the pages overall CLS score fits within the thresholds for CLS outlined by Google.

[Defining the Core Web Vitals metrics thresholds](https://web.dev/defining-core-web-vitals-thresholds/)

🟢 Good ≤0.1  

🟠 Needs Improvement 	

🔴 Poor >0.25 

## Author

Chris Johnson - [defaced.dev](https://defaced.dev) - [@defaced](http://twitter.co.uk/defaced/)
            